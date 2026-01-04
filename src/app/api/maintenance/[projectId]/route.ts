import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Public API for services to check their maintenance status
// Usage: GET /api/maintenance/{projectId}
// Returns: { enabled: boolean, message: string }
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    const { data, error } = await supabase
      .from('project_maintenance')
      .select('enabled, message')
      .eq('project_id', projectId)
      .single()

    if (error) {
      // No record means not in maintenance
      return NextResponse.json({
        enabled: false,
        message: ''
      })
    }

    return NextResponse.json({
      enabled: data.enabled ?? false,
      message: data.message ?? '서비스 점검 중입니다.'
    })
  } catch (error) {
    console.error('Maintenance check error:', error)
    return NextResponse.json({
      enabled: false,
      message: ''
    })
  }
}
