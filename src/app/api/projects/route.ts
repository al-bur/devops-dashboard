import { NextResponse } from 'next/server'
import type { Project } from '@/types/project'

interface VercelProject {
  id: string
  name: string
  link?: {
    type: string
    repo?: string
    org?: string
  }
  targets?: {
    production?: {
      alias?: string[]
    }
  }
  latestDeployments?: Array<{
    url?: string
  }>
}

export async function GET() {
  const token = process.env.VERCEL_TOKEN
  const teamId = process.env.VERCEL_TEAM_ID

  if (!token) {
    return NextResponse.json({ error: 'VERCEL_TOKEN not configured' }, { status: 500 })
  }

  // Excluded projects (comma-separated names in env var)
  const excludedProjects = (process.env.EXCLUDED_PROJECTS || '')
    .split(',')
    .map(p => p.trim().toLowerCase())
    .filter(Boolean)

  try {
    const url = teamId
      ? `https://api.vercel.com/v9/projects?teamId=${teamId}&limit=100`
      : `https://api.vercel.com/v9/projects?limit=100`

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 60 } // Cache for 1 minute
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Vercel API error:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    const data = await res.json()
    const vercelProjects: VercelProject[] = data.projects || []

    // Transform to our Project type and filter out excluded
    const projects: Project[] = vercelProjects
      .filter(p => !excludedProjects.includes(p.name.toLowerCase()))
      .map(p => {
        // Get production URL
        const productionUrl = p.targets?.production?.alias?.[0]
          ? `https://${p.targets.production.alias[0]}`
          : p.latestDeployments?.[0]?.url
            ? `https://${p.latestDeployments[0].url}`
            : undefined

        // Get GitHub repo if connected
        const githubRepo = p.link?.type === 'github' && p.link.org && p.link.repo
          ? `${p.link.org}/${p.link.repo}`
          : undefined

        return {
          id: p.id,
          name: p.name,
          vercelProjectId: p.id,
          githubRepo,
          url: productionUrl,
          healthCheckUrl: productionUrl ? `${productionUrl}/api/health` : undefined,
        }
      })

    return NextResponse.json({
      projects,
      total: projects.length,
      excluded: excludedProjects.length
    })
  } catch (error) {
    console.error('Projects API error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}
