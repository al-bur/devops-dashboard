import { NextResponse } from 'next/server'
import type { HealthCheckResult } from '@/types/project'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

interface VercelProject {
  id: string
  name: string
  targets?: {
    production?: {
      alias?: string[]
    }
  }
  latestDeployments?: Array<{
    url?: string
  }>
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

async function checkHealth(url: string, name: string): Promise<HealthCheckResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      next: { revalidate: 0 } // No caching for health checks
    })

    clearTimeout(timeoutId)

    const responseTime = Date.now() - startTime

    if (res.ok) {
      return {
        url,
        name,
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString()
      }
    }

    return {
      url,
      name,
      status: 'unhealthy',
      responseTime,
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`Health check failed for ${url}:`, error)

    return {
      url,
      name,
      status: 'unhealthy',
      responseTime,
      lastChecked: new Date().toISOString()
    }
  }
}

export async function GET() {
  try {
    // Fetch all projects from Vercel dynamically
    const vercelProjects = await fetchVercelProjects()

    // Get production URLs for each project
    const healthEndpoints = vercelProjects
      .map(p => {
        const productionUrl = p.targets?.production?.alias?.[0]
          ? `https://${p.targets.production.alias[0]}`
          : p.latestDeployments?.[0]?.url
            ? `https://${p.latestDeployments[0].url}`
            : null

        return productionUrl ? { url: productionUrl, name: p.name } : null
      })
      .filter((endpoint): endpoint is { url: string; name: string } => endpoint !== null)

    const results = await Promise.all(
      healthEndpoints.map(({ url, name }) => checkHealth(url, name))
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error('Health API error:', error)
    return NextResponse.json([])
  }
}
