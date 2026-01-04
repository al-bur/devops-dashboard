import { NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export interface WorkflowInfo {
  id: number;
  name: string;
  path: string;
  state: string;
}

export async function GET(request: Request) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");

  if (!repo) {
    return NextResponse.json(
      { error: "Repository is required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ workflows: [] });
      }
      return NextResponse.json(
        { error: "Failed to fetch workflows" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const workflows: WorkflowInfo[] = (data.workflows || [])
      .filter((w: { state: string }) => w.state === "active")
      .map((w: { id: number; name: string; path: string; state: string }) => ({
        id: w.id,
        name: w.name,
        path: w.path,
        state: w.state,
      }));

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error("GitHub workflows API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
