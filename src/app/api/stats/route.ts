import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface UserStats {
  total_users: number
  today_signups: number
  active_users: number
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return null
  }

  return createClient(url, key)
}

export async function GET() {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return NextResponse.json({
      totalUsers: 0,
      todaySignups: 0,
      activeUsers: 0
    })
  }

  try {
    let total = 0
    let todayCount = 0
    let activeCount = 0

    // Try to get from RPC function if available
    const { data: authUsers, error: authError } = await supabase
      .rpc('get_user_stats')
      .single<UserStats>()

    if (!authError && authUsers) {
      total = authUsers.total_users ?? 0
      todayCount = authUsers.today_signups ?? 0
      activeCount = authUsers.active_users ?? 0
    } else {
      // Fallback: try to count from a custom profiles/users table
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      if (profileCount !== null) {
        total = profileCount
      }

      // Today's signups
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count: todaySignups } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      if (todaySignups !== null) {
        todayCount = todaySignups
      }

      // Active users (last 24h) - approximation
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', yesterday.toISOString())

      if (activeUsers !== null) {
        activeCount = activeUsers
      }
    }

    return NextResponse.json({
      totalUsers: total,
      todaySignups: todayCount,
      activeUsers: activeCount
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({
      totalUsers: 0,
      todaySignups: 0,
      activeUsers: 0
    })
  }
}
