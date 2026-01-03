import { NextResponse } from 'next/server'
import type { ErrorLog } from '@/types/project'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

// Fetch Vercel deployment errors
async function getVercelLogs(): Promise<ErrorLog[]> {
  if (!VERCEL_TOKEN) return []

  try {
    const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''
    const res = await fetch(
      `https://api.vercel.com/v6/deployments${teamParam}&limit=10&state=ERROR`,
      {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
        next: { revalidate: 60 }
      }
    )

    if (!res.ok) return []

    const data = await res.json()
    return (data.deployments || []).map((d: { uid: string; created: number; name: string; errorMessage?: string }) => ({
      id: d.uid,
      timestamp: new Date(d.created).toISOString(),
      level: 'error' as const,
      service: 'vercel' as const,
      message: d.errorMessage || `Deployment failed: ${d.name}`
    }))
  } catch {
    return []
  }
}

// Fetch GitHub Actions failures
async function getGitHubLogs(repos: string[]): Promise<ErrorLog[]> {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  if (!GITHUB_TOKEN) return []

  const logs: ErrorLog[] = []

  await Promise.all(
    repos.map(async (repo) => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${repo}/actions/runs?per_page=5&status=failure`,
          {
            headers: {
              Authorization: `Bearer ${GITHUB_TOKEN}`,
              Accept: 'application/vnd.github.v3+json'
            },
            next: { revalidate: 60 }
          }
        )

        if (!res.ok) return

        const data = await res.json()
        for (const run of data.workflow_runs || []) {
          logs.push({
            id: String(run.id),
            timestamp: run.created_at,
            level: 'error',
            service: 'github',
            message: `${run.name} failed in ${repo}`
          })
        }
      } catch {
        // Ignore errors for individual repos
      }
    })
  )

  return logs
}

// Fetch Supabase logs (simulated - actual implementation needs Supabase logs API)
async function getSupabaseLogs(): Promise<ErrorLog[]> {
  // Supabase logs API requires Management API access
  // For now, return empty array - can be implemented with mcp__supabase__get_logs
  return []
}

export async function GET() {
  try {
    const repos = ['luke-sonnet/web-bbibbi', 'luke-sonnet/fitmate', 'luke-sonnet/daily-ok']

    const [vercelLogs, githubLogs, supabaseLogs] = await Promise.all([
      getVercelLogs(),
      getGitHubLogs(repos),
      getSupabaseLogs()
    ])

    // Combine and sort by timestamp (newest first)
    const allLogs = [...vercelLogs, ...githubLogs, ...supabaseLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50) // Limit to 50 most recent

    return NextResponse.json(allLogs)
  } catch (error) {
    console.error('Logs API error:', error)
    return NextResponse.json([])
  }
}
