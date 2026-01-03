import { NextResponse } from 'next/server'
import type { HealthCheckResult } from '@/types/project'

// Configure health check endpoints
const HEALTH_ENDPOINTS = [
  'https://web-bbibbi.vercel.app',
  'https://fitmate.vercel.app',
  'https://daily-ok.vercel.app'
]

async function checkHealth(url: string): Promise<HealthCheckResult> {
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
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString()
      }
    }

    return {
      url,
      status: 'unhealthy',
      responseTime,
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`Health check failed for ${url}:`, error)

    return {
      url,
      status: 'unhealthy',
      responseTime,
      lastChecked: new Date().toISOString()
    }
  }
}

export async function GET() {
  try {
    const results = await Promise.all(
      HEALTH_ENDPOINTS.map((url) => checkHealth(url))
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error('Health API error:', error)
    return NextResponse.json([])
  }
}
