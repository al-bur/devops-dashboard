import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { RecentUser } from '@/types/project'

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
    return NextResponse.json([])
  }

  try {
    // Try to get recent users from profiles table
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching profiles:', error)
      return NextResponse.json([])
    }

    const users: RecentUser[] = (profiles || []).map((p) => ({
      id: p.id,
      email: p.email || 'anonymous@example.com',
      created_at: p.created_at
    }))

    return NextResponse.json(users)
  } catch (error) {
    console.error('Recent users API error:', error)
    return NextResponse.json([])
  }
}
