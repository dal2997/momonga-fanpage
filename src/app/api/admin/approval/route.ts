// src/app/api/admin/approval/route.ts
import { NextResponse } from "next/server";
import {
  makeSupabase,
  sendWithResend,
  adminGetUserEmail,
  APP_NAME,
  getSiteUrl,
} from "@/lib/adminUtils";

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });
  const supabase = await makeSupabase(res);

  // 1) 세션 확인
  const { data: u, error: ue } = await supabase.auth.getUser();
  if (ue) return NextResponse.json({ ok: false, error: ue.message }, { status: 401 });
  if (!u.user) return NextResponse.json({ ok: false, error: "no session" }, { status: 401 });

  // 2) 관리자 체크 (profiles.is_admin)
  const { data: me, error: meErr } = await supabase
    .from("profiles")
    .select("id,is_admin")
    .eq("id", u.user.id)
    .maybeSingle();

  if (meErr) return NextResponse.json({ ok: false, error: meErr.message }, { status: 403 });
  if (!me?.is_admin) return NextResponse.json({ ok: false, error: "not admin" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const action = body?.action as string | undefined;
  const userId = body?.userId as string | undefined;

  if (!action || !userId) {
    return NextResponse.json({ ok: false, error: "missing action/userId" }, { status: 400 });
  }

  try {
    // ── 승인 ──────────────────────────────────────────────────────────────
    if (action === "approve") {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ is_approved: true, approved_at: new Date().toISOString() })
        .eq("id", userId);

      if (upErr) throw upErr;

      // 승인메일 1회만: approval_mail_sent_at이 null인 경우에만 발송 권한 획득
      const { data: mark, error: markErr } = await supabase
        .from("profiles")
        .update({ approval_mail_sent_at: new Date().toISOString() })
        .eq("id", userId)
        .is("approval_mail_sent_at", null)
        .select("id")
        .maybeSingle();

      if (markErr) throw markErr;

      if (mark?.id) {
        const email = await adminGetUserEmail(supabase, userId);
        if (email) {
          const subject = `[${APP_NAME}] 승인 완료 안내`;
          const html = `
            <div style="font-family:Arial,sans-serif;line-height:1.6">
              <h2>승인 완료 ✅</h2>
              <p>이제 Momonga 수집 기능을 사용할 수 있어요.</p>
              <p><a href="${getSiteUrl()}/?tab=collection">수집하러 가기</a></p>
              <p style="color:#666;font-size:12px">이 메일은 승인 시 1회만 발송됩니다.</p>
            </div>
          `;
          await sendWithResend(email, subject, html);
        }
      }

      return NextResponse.json({ ok: true });
    }

    // ── 밴 ────────────────────────────────────────────────────────────────
    if (action === "ban") {
      const reason = (body?.reason as string | undefined)?.trim() || null;

      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: true, ban_reason: reason })
        .eq("id", userId);

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // ── 언밴 ──────────────────────────────────────────────────────────────
    if (action === "unban") {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: false, ban_reason: null })
        .eq("id", userId);

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // ── 초대코드 발급 ────────────────────────────────────────────────────
    if (action === "issue") {
      // TODO: invite_codes 테이블 스키마 확정 후 구현
      // 예시: INSERT INTO invite_codes (code, issued_to, issued_by) VALUES (...)
      // const code = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
      // const { error } = await supabase.from("invite_codes").insert({ code, issued_to: userId, issued_by: u.user.id });
      return NextResponse.json(
        { ok: false, error: "issue action: invite_codes 테이블 스키마 확정 후 구현 필요" },
        { status: 501 }
      );
    }

    // ── 초대코드 메일 발송 ───────────────────────────────────────────────
    if (action === "send") {
      // TODO: invite_codes 테이블에서 해당 유저의 최근 코드를 조회 후 메일 발송
      // const { data: invite } = await supabase.from("invite_codes").select("code").eq("issued_to", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      // if (!invite) return NextResponse.json({ ok: false, error: "발급된 코드 없음" }, { status: 404 });
      // const email = await adminGetUserEmail(supabase, userId);
      // await sendWithResend(email, `[${APP_NAME}] 초대 코드`, `코드: ${invite.code}`);
      return NextResponse.json(
        { ok: false, error: "send action: invite_codes 테이블 스키마 확정 후 구현 필요" },
        { status: 501 }
      );
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
