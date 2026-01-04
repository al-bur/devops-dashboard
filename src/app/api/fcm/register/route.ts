import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

const TOPIC = "devops-dashboard-users";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "FCM token is required" },
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

    // 토픽 구독
    await admin.messaging().subscribeToTopic(token, TOPIC);

    return NextResponse.json({
      success: true,
      topic: TOPIC,
    });
  } catch (error) {
    console.error("FCM register error:", error);
    return NextResponse.json(
      { error: "Failed to register FCM token" },
      { status: 500 }
    );
  }
}
