// src/app/api/offers/[id]/route.ts
// 오퍼 수락 / 거절 / 완료 처리
import { NextRequest, NextResponse } from "next/server";
import { makeSupabase } from "@/lib/adminUtils";

type Status = "accepted" | "rejected" | "completed";
const VALID_STATUSES: Status[] = ["accepted", "rejected", "completed"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = NextResponse.json({ ok: true });

  try {
    const body = await req.json();
    const status = body?.status as string | undefined;

    if (!status || !VALID_STATUSES.includes(status as Status)) {
      return NextResponse.json(
        { error: "status는 accepted / rejected / completed 중 하나여야 해" },
        { status: 400 }
      );
    }

    const supabase = await makeSupabase(res);

    // 로그인 확인
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "로그인이 필요해" }, { status: 401 });
    }
    const uid = userData.user.id;

    // 오퍼 존재 + 소유권 확인
    const { data: offer, error: fetchErr } = await supabase
      .from("offers")
      .select("id, status, owner_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !offer) {
      return NextResponse.json({ error: "제안을 찾을 수 없어" }, { status: 404 });
    }
    if (offer.owner_id !== uid) {
      return NextResponse.json({ error: "본인 수집품의 제안만 처리할 수 있어" }, { status: 403 });
    }

    // 이미 처리된 오퍼는 completed로만 변경 가능
    if (offer.status !== "pending" && status !== "completed") {
      return NextResponse.json(
        { error: `이미 ${offer.status} 상태야. completed로만 변경할 수 있어.` },
        { status: 400 }
      );
    }

    const { error: updateErr } = await supabase
      .from("offers")
      .update({ status })
      .eq("id", id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true, status });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "서버 오류" },
      { status: 500 }
    );
  }
}
