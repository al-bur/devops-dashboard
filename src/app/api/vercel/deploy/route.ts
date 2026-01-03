import { NextResponse } from 'next/server'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

export async function POST(request: Request) {
  if (!VERCEL_TOKEN) {
    return NextResponse.json(
      { error: 'Vercel token not configured' },
      { status: 500 }
    )
  }

  try {
    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Get the latest deployment to redeploy
    const teamParam = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : ''
    const deploymentsRes = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/deployments?limit=1${teamParam}`,
      {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
      }
    )

    if (!deploymentsRes.ok) {
      const errorData = await deploymentsRes.json()
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to fetch deployments' },
        { status: deploymentsRes.status }
      )
    }

    const deploymentsData = await deploymentsRes.json()
    const lastDeployment = deploymentsData.deployments?.[0]

    if (!lastDeployment) {
      return NextResponse.json(
        { error: 'No previous deployments found' },
        { status: 404 }
      )
    }

    // Create a new deployment (redeploy)
    const redeployRes = await fetch(
      `https://api.vercel.com/v13/deployments${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: lastDeployment.name,
          project: projectId,
          target: lastDeployment.target || 'production',
          gitSource: lastDeployment.gitSource
        })
      }
    )

    if (!redeployRes.ok) {
      const errorData = await redeployRes.json()
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to trigger deployment' },
        { status: redeployRes.status }
      )
    }

    const deployment = await redeployRes.json()

    return NextResponse.json({
      success: true,
      deploymentId: deployment.id,
      url: deployment.url
    })
  } catch (error) {
    console.error('Deploy API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
