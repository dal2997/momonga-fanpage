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
      const { data: rpcData, error: rpcErr } = await supabase.rpc(
        "admin_issue_invite_code",
        { p_issued_to: userId, p_expires_days: null }
      );
      if (rpcErr) throw rpcErr;

      const result = rpcData as { success: boolean; code?: string; error?: string };
      if (!result.success) {
        return NextResponse.json({ ok: false, error: result.error ?? "코드 발급 실패" }, { status: 400 });
      }

      return NextResponse.json({ ok: true, code: result.code });
    }

    // ── 초대코드 메일 발송 ───────────────────────────────────────────────
    if (action === "send") {
      // 해당 유저에게 발급된 최신 미사용 코드 조회
      const { data: invite, error: invErr } = await supabase
        .from("invite_codes")
        .select("code")
        .eq("issued_to", userId)
        .is("used_by", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (invErr) throw invErr;
      if (!invite?.code) {
        return NextResponse.json(
          { ok: false, error: "발급된 초대 코드가 없어. 먼저 코드를 발급해줘." },
          { status: 404 }
        );
      }

      const email = await adminGetUserEmail(supabase, userId);
      if (!email) {
        return NextResponse.json({ ok: false, error: "이메일 주소를 찾을 수 없어." }, { status: 404 });
      }

      const siteUrl = getSiteUrl();
      const subject = `[${APP_NAME}] 초대 코드가 도착했어요`;
      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:480px">
          <h2 style="font-size:20px">Momonga 초대 코드 🐿️</h2>
          <p>아래 코드를 입력하면 수집 기능을 사용할 수 있어요.</p>
          <div style="margin:20px 0;padding:16px 24px;background:#f4f4f4;border-radius:12px;font-size:22px;font-weight:bold;letter-spacing:2px;text-align:center">
            ${invite.code}
          </div>
          ${siteUrl ? `<div style="margin-top:20px"><a href="${siteUrl}/redeem" style="background:#111;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px">코드 입력하러 가기</a></div>` : ""}
          <p style="color:#999;font-size:12px;margin-top:24px">이 메일은 관리자가 발송했습니다.</p>
        </div>
      `;

      await sendWithResend(email, subject, html);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
