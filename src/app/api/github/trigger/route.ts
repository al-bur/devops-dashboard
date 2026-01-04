import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const TOPIC = "devops-dashboard-users";

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: Request) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 }
    );
  }

  try {
    const {
      repo,
      workflow: requestedWorkflow,
      ref = "main",
      inputs = {},
      sendPush = true,
    } = await request.json();

    if (!repo) {
      return NextResponse.json(
        { error: "Repository is required" },
        { status: 400 }
      );
    }

    // 워크플로우가 지정되지 않으면 자동 감지
    let workflow = requestedWorkflow;
    if (!workflow) {
      const workflowsRes = await fetch(
        `https://api.github.com/repos/${repo}/actions/workflows`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json();
        const activeWorkflows = workflowsData.workflows?.filter(
          (w: { state: string }) => w.state === "active"
        );
        if (activeWorkflows?.length > 0) {
          // 첫 번째 활성 워크플로우 사용
          workflow = activeWorkflows[0].path.split("/").pop();
        }
      }

      if (!workflow) {
        return NextResponse.json(
          { error: "No active workflows found in repository" },
          { status: 404 }
        );
      }
    }

    // Trigger the workflow using workflow_dispatch
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref,
          inputs,
        }),
      }
    );

    if (res.status === 204) {
      const projectName = repo.split("/")[1] || repo;

      // 이력 저장
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from("github_actions").insert({
            repo,
            workflow,
            ref,
            status: "triggered",
            triggered_at: new Date().toISOString(),
          });
        } catch {
          console.log("github_actions table not found");
        }
      }

      // 푸시 알림 발송 (옵션)
      if (sendPush) {
        const admin = getFirebaseAdmin();
        if (!admin) {
          console.log("Push notification skipped: Firebase Admin not configured");
        } else {
          try {
            await admin.messaging().send({
              topic: TOPIC,
              data: {
                title: `🚀 ${projectName}`,
                body: `Workflow "${workflow}" triggered`,
                url: `https://github.com/${repo}/actions`,
                type: "github_action",
                projectId: repo,
              },
              webpush: {
                fcmOptions: {
                  link: `https://github.com/${repo}/actions`,
                },
                notification: {
                  title: `🚀 ${projectName}`,
                  body: `Workflow "${workflow}" triggered`,
                  icon: "/icon-192.png",
                },
              },
            });
          } catch (pushError) {
            console.log("Push notification failed:", pushError);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Workflow ${workflow} triggered on ${repo}`,
        pushSent: sendPush,
      });
    }

    if (res.status === 404) {
      return NextResponse.json(
        { error: "Workflow not found or not configured for workflow_dispatch" },
        { status: 404 }
      );
    }

    const errorData = await res.json();
    return NextResponse.json(
      { error: errorData.message || "Failed to trigger workflow" },
      { status: res.status }
    );
  } catch (error) {
    console.error("GitHub trigger API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
