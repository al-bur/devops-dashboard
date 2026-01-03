import { NextResponse } from 'next/server'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

type ServiceStatus = 'live' | 'building' | 'error' | 'unknown'

interface ProjectConfig {
  id: string
  vercelProjectId?: string
  githubRepo?: string
}

// Configure your projects here (should match page.tsx)
const PROJECTS: ProjectConfig[] = [
  { id: 'web-bbibbi', vercelProjectId: 'web-bbibbi', githubRepo: 'luke-sonnet/web-bbibbi' },
  { id: 'fitmate', vercelProjectId: 'fitmate', githubRepo: 'luke-sonnet/fitmate' },
  { id: 'daily-ok', vercelProjectId: 'daily-ok', githubRepo: 'luke-sonnet/daily-ok' }
]

async function getVercelStatus(projectId: string): Promise<ServiceStatus> {
  if (!VERCEL_TOKEN) return 'unknown'

  try {
    const teamParam = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : ''
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/deployments?limit=1${teamParam}`,
      {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
        next: { revalidate: 30 }
      }
    )

    if (!res.ok) return 'unknown'

    const data = await res.json()
    const deployment = data.deployments?.[0]

    if (!deployment) return 'unknown'

    switch (deployment.state) {
      case 'READY':
        return 'live'
      case 'BUILDING':
      case 'QUEUED':
      case 'INITIALIZING':
        return 'building'
      case 'ERROR':
      case 'CANCELED':
        return 'error'
      default:
        return 'unknown'
    }
  } catch {
    return 'unknown'
  }
}

async function getGitHubActionsStatus(repo: string): Promise<ServiceStatus> {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  if (!GITHUB_TOKEN) return 'unknown'

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/runs?per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json'
        },
        next: { revalidate: 30 }
      }
    )

    if (!res.ok) return 'unknown'

    const data = await res.json()
    const run = data.workflow_runs?.[0]

    if (!run) return 'unknown'

    if (run.status === 'in_progress' || run.status === 'queued') {
      return 'building'
    }

    if (run.conclusion === 'success') {
      return 'live'
    }

    if (run.conclusion === 'failure' || run.conclusion === 'cancelled') {
      return 'error'
    }

    return 'unknown'
  } catch {
    return 'unknown'
  }
}

export async function GET() {
  try {
    const statuses: Record<string, { vercel: ServiceStatus; github: ServiceStatus; supabase: ServiceStatus }> = {}

    await Promise.all(
      PROJECTS.map(async (project) => {
        const [vercelStatus, githubStatus] = await Promise.all([
          project.vercelProjectId ? getVercelStatus(project.vercelProjectId) : 'unknown' as ServiceStatus,
          project.githubRepo ? getGitHubActionsStatus(project.githubRepo) : 'unknown' as ServiceStatus
        ])

        statuses[project.id] = {
          vercel: vercelStatus,
          github: githubStatus,
          supabase: 'live' // Supabase is generally always available
        }
      })
    )

    return NextResponse.json(statuses)
  } catch (error) {
    console.error('Project status API error:', error)
    return NextResponse.json({})
  }
}
