// src/app/api/offers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { makeSupabase, adminGetUserEmail, sendWithResend, getSiteUrl } from "@/lib/adminUtils";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });

  try {
    const body = await req.json();
    const { collection_id, owner_id, amount, message } = body;

    if (!collection_id || !owner_id || !amount) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
    }
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "금액이 올바르지 않아" }, { status: 400 });
    }

    if (amount > 100_000_000) {
      return NextResponse.json({ error: "금액이 너무 커" }, { status: 400 });
    }

    const supabase = await makeSupabase(res);

    // 로그인 확인
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "로그인이 필요해" }, { status: 401 });
    }
    const fromUserId = userData.user.id;

    // DB에서 실제 owner_id 조회 (클라이언트 값 신뢰 안 함)
    const { data: col, error: colErr } = await supabase
      .from("collections")
      .select("owner_id")
      .eq("id", collection_id)
      .maybeSingle();

    if (colErr || !col) {
      return NextResponse.json({ error: "수집품을 찾을 수 없어" }, { status: 404 });
    }
    const realOwnerId = col.owner_id as string;

    // 자기 자신한테는 제안 불가 (DB 기준)
    if (fromUserId === realOwnerId) {
      return NextResponse.json({ error: "본인 수집품에는 제안할 수 없어" }, { status: 400 });
    }

    // 레이트 리밋: 24시간 내 동일 아이템에 3회 이상 제안 차단
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from("offers")
      .select("id", { count: "exact", head: true })
      .eq("collection_id", collection_id)
      .eq("from_user_id", fromUserId)
      .gte("created_at", since);

    if ((recentCount ?? 0) >= 3) {
      return NextResponse.json(
        { error: "같은 아이템에는 24시간 내 최대 3번까지만 제안할 수 있어" },
        { status: 429 }
      );
    }

    // offers 테이블에 저장 (검증된 realOwnerId 사용)
    const { error: insertErr } = await supabase.from("offers").insert({
      collection_id,
      owner_id: realOwnerId,
      from_user_id: fromUserId,
      amount,
      message: message ?? null,
    });

    if (insertErr) {
      console.error("[offers] insert error:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // 소유자에게 이메일 알림 (실패해도 200 반환)
    try {
      const ownerEmail = await adminGetUserEmail(supabase, realOwnerId);
      const fromEmail = userData.user.email ?? "";
      const siteUrl = getSiteUrl();

      if (ownerEmail) {
        await sendWithResend(
          ownerEmail,
          `💬 새로운 가격 제안이 왔어! — ${amount.toLocaleString()}원`,
          `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="font-size:18px;margin-bottom:8px">💬 가격 제안 알림</h2>
            <p style="color:#666;margin-bottom:16px">누군가 수집품에 가격을 제안했어.</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:6px 0;color:#888;width:80px">제안 금액</td><td style="font-weight:bold">${amount.toLocaleString()}원</td></tr>
              <tr><td style="padding:6px 0;color:#888">제안자</td><td>${fromEmail}</td></tr>
              ${message ? `<tr><td style="padding:6px 0;color:#888;vertical-align:top">메시지</td><td>${message}</td></tr>` : ""}
            </table>
            ${siteUrl ? `<div style="margin-top:20px"><a href="${siteUrl}/my/offers" style="background:#111;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px">제안 확인하기</a></div>` : ""}
          </div>
          `
        );
      }
    } catch (mailErr) {
      console.warn("[offers] email send failed (non-fatal):", mailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[offers] unexpected error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "서버 오류" },
      { status: 500 }
    );
  }
}
