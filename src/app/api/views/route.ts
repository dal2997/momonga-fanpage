// POST /api/views
// 프로필 조회수 1 증가 (Supabase RPC 호출)
// 봇 방어: Next.js Edge에서 처리하지 않고 서버 함수로 위임
import { NextRequest, NextResponse } from "next/server";
import { makeSupabase } from "@/lib/adminUtils";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });

  try {
    const { handle } = await req.json().catch(() => ({}));
    if (!handle || typeof handle !== "string") {
      return NextResponse.json({ error: "handle 필요" }, { status: 400 });
    }

    const supabase = await makeSupabase(res);

    // 현재 로그인 사용자 (없으면 null — 익명 방문자)
    const { data: userData } = await supabase.auth.getUser();
    const viewerId = userData?.user?.id ?? null;

    // RPC 호출 — 본인 방문 제외, 원자적 증가
    const { error } = await supabase.rpc("increment_profile_view", {
      p_handle: handle,
      p_viewer_id: viewerId,
    });

    if (error) {
      console.error("[views] rpc error:", error);
      // 카운트 실패는 사용자에게 노출하지 않음 (non-fatal)
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[views] unexpected error:", e);
    return NextResponse.json({ ok: true }); // 항상 200 반환 (사용자에겐 무관한 오류)
  }
}
