import { NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN

export async function POST(request: Request) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: 'GitHub token not configured' },
      { status: 500 }
    )
  }

  try {
    const { repo, workflow, ref = 'main', inputs = {} } = await request.json()

    if (!repo || !workflow) {
      return NextResponse.json(
        { error: 'Repository and workflow are required' },
        { status: 400 }
      )
    }

    // Trigger the workflow using workflow_dispatch
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref,
          inputs
        })
      }
    )

    if (res.status === 204) {
      // Success - workflow dispatch doesn't return a body
      return NextResponse.json({
        success: true,
        message: `Workflow ${workflow} triggered on ${repo}`
      })
    }

    if (res.status === 404) {
      return NextResponse.json(
        { error: 'Workflow not found or not configured for workflow_dispatch' },
        { status: 404 }
      )
    }

    const errorData = await res.json()
    return NextResponse.json(
      { error: errorData.message || 'Failed to trigger workflow' },
      { status: res.status }
    )
  } catch (error) {
    console.error('GitHub trigger API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
