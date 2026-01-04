import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const TOPIC = "devops-dashboard-users";

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: Request) {
  try {
    const { title, body, url, type = "general", projectId } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Firebase Admin not configured" },
        { status: 500 }
      );
    }

    // 토픽으로 푸시 발송
    const result = await admin.messaging().send({
      topic: TOPIC,
      data: {
        title,
        body,
        url: url || "/",
        type,
        projectId: projectId || "",
      },
      webpush: {
        fcmOptions: {
          link: url || "/",
        },
        notification: {
          title,
          body,
          icon: "/icon-192.png",
        },
      },
    });

    // 발송 이력 저장
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from("notifications").insert({
          title,
          body,
          url,
          type,
          project_id: projectId,
          message_id: result,
          sent_at: new Date().toISOString(),
        });
      } catch {
        console.log("Notifications table not found, skipping history save");
      }
    }

    return NextResponse.json({
      success: true,
      messageId: result,
    });
  } catch (error) {
    console.error("FCM send error:", error);
    return NextResponse.json(
      { error: "Failed to send push notification" },
      { status: 500 }
    );
  }
}
