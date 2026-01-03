import { NextResponse } from 'next/server'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

type ServiceStatus = 'live' | 'building' | 'error' | 'unknown'

interface VercelProject {
  id: string
  name: string
  link?: {
    type: string
    repo?: string
    org?: string
  }
}

async function fetchVercelProjects(): Promise<VercelProject[]> {
  if (!VERCEL_TOKEN) return []

  try {
    const url = VERCEL_TEAM_ID
      ? `https://api.vercel.com/v9/projects?teamId=${VERCEL_TEAM_ID}&limit=100`
      : `https://api.vercel.com/v9/projects?limit=100`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      next: { revalidate: 60 }
    })

    if (!res.ok) return []

    const data = await res.json()
    return data.projects || []
  } catch {
    return []
  }
}

async function getVercelStatus(projectName: string): Promise<ServiceStatus> {
  if (!VERCEL_TOKEN) return 'unknown'

  try {
    // Use v6 deployments API with projectId filter (works with project name)
    const teamParam = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : ''
    const res = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${projectName}&limit=1&target=production${teamParam}`,
      {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
        next: { revalidate: 30 }
      }
    )

    if (!res.ok) return 'unknown'

    const data = await res.json()
    const deployment = data.deployments?.[0]

    if (!deployment) return 'unknown'

    // v6 API uses readyState instead of state
    const state = deployment.readyState || deployment.state
    switch (state) {
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
    // Fetch all projects from Vercel dynamically
    const vercelProjects = await fetchVercelProjects()

    const statuses: Record<string, { vercel: ServiceStatus; github: ServiceStatus; supabase: ServiceStatus }> = {}

    await Promise.all(
      vercelProjects.map(async (project) => {
        // Get GitHub repo if connected
        const githubRepo = project.link?.type === 'github' && project.link.org && project.link.repo
          ? `${project.link.org}/${project.link.repo}`
          : undefined

        const [vercelStatus, githubStatus] = await Promise.all([
          getVercelStatus(project.name),
          githubRepo ? getGitHubActionsStatus(githubRepo) : Promise.resolve('unknown' as ServiceStatus)
        ])

        statuses[project.id] = {
          vercel: vercelStatus,
          github: githubStatus,
          supabase: 'live' // Supabase status assumed live (no direct API)
        }
      })
    )

    return NextResponse.json(statuses)
  } catch (error) {
    console.error('Project status API error:', error)
    return NextResponse.json({})
  }
}
