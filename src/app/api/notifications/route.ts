import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: "Supabase not configured",
      });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type"); // 'push' | 'github_action' | null (all)

    // GitHub Actions 이력
    let actionsHistory: unknown[] = [];
    try {
      const { data } = await supabase
        .from("github_actions")
        .select("*")
        .order("triggered_at", { ascending: false })
        .limit(limit);

      actionsHistory = (data || []).map((item) => ({
        ...item,
        type: "github_action",
      }));
    } catch {
      // 테이블 없으면 무시
    }

    // 푸시 알림 이력
    let pushHistory: unknown[] = [];
    try {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(limit);

      pushHistory = (data || []).map((item) => ({
        ...item,
        type: "push",
      }));
    } catch {
      // 테이블 없으면 무시
    }

    // 타입별 필터링 또는 전체 병합
    let result;
    if (type === "push") {
      result = pushHistory;
    } else if (type === "github_action") {
      result = actionsHistory;
    } else {
      // 전체 병합 후 시간순 정렬
      result = [...actionsHistory, ...pushHistory].sort((a, b) => {
        const aTime =
          (a as { triggered_at?: string; sent_at?: string }).triggered_at ||
          (a as { triggered_at?: string; sent_at?: string }).sent_at ||
          "";
        const bTime =
          (b as { triggered_at?: string; sent_at?: string }).triggered_at ||
          (b as { triggered_at?: string; sent_at?: string }).sent_at ||
          "";
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    }

    return NextResponse.json({
      success: true,
      data: result.slice(0, limit),
      total: result.length,
    });
  } catch (error) {
    console.error("Notifications API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
