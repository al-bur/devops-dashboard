import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET - Get all project maintenance statuses
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('project_maintenance')
      .select('*')

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({})
    }

    // Convert to object keyed by project_id
    const statuses: Record<string, { enabled: boolean; message: string }> = {}
    for (const row of data || []) {
      statuses[row.project_id] = {
        enabled: row.enabled,
        message: row.message
      }
    }

    return NextResponse.json(statuses)
  } catch (error) {
    console.error('Maintenance fetch error:', error)
    return NextResponse.json({})
  }
}

// POST - Toggle maintenance for a project
export async function POST(request: Request) {
  // Check auth
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('devops-auth')

  if (authCookie?.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { projectId, projectName, enabled, message } = body

    if (!projectId || !projectName) {
      return NextResponse.json({ error: 'projectId and projectName required' }, { status: 400 })
    }

    // Upsert maintenance status (use admin client for write access)
    const { error } = await supabaseAdmin
      .from('project_maintenance')
      .upsert({
        project_id: projectId,
        project_name: projectName,
        enabled: enabled ?? false,
        message: message ?? '서비스 점검 중입니다. 잠시 후 다시 시도해주세요.',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id'
      })

    if (error) {
      console.error('Supabase upsert error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true, enabled })
  } catch (error) {
    console.error('Maintenance update error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
