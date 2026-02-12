// src/app/api/admin/approval/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function supabaseServer() {
  const cookieStore = await cookies(); // ✅ Next 버전에 따라 async라 await 필요

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        // route handler에서 세션 갱신 쿠키 set까지 엄밀히 하려면 Response에 set 해야 하는데,
        // 지금 흐름(관리자 세션 확인 + RPC 호출)에서는 읽기만으로도 충분해서 noop 유지
        set() {},
        remove() {},
      },
    }
  );
}

async function sendWithResend(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!key) throw new Error("RESEND_API_KEY is missing");
  if (!from) throw new Error("MAIL_FROM is missing");

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Resend failed: ${resp.status} ${t}`);
  }
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  // 세션 확인
  const { data: u, error: ue } = await supabase.auth.getUser();
  if (ue) return NextResponse.json({ ok: false, error: ue.message }, { status: 401 });
  if (!u.user) return NextResponse.json({ ok: false, error: "no session" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = body?.action as string | undefined;
  const userId = body?.userId as string | undefined;

  if (!action || !userId) {
    return NextResponse.json({ ok: false, error: "missing action/userId" }, { status: 400 });
  }

  try {
    if (action === "issue") {
      // 코드만 발급해서 반환(복사용)
      const { data: code, error } = await supabase.rpc("issue_approval_code", {
        p_user_id: userId,
        p_expires_minutes: 1440,
      });
      if (error) throw error;

      return NextResponse.json({ ok: true, code });
    }

    if (action === "send") {
      // 이메일 조회 (admin only)
      const { data: email, error: e1 } = await supabase.rpc("admin_get_user_email", {
        p_user_id: userId,
      });
      if (e1) throw e1;
      if (!email) throw new Error("target email not found");

      // 코드 발급
      const { data: code, error: e2 } = await supabase.rpc("issue_approval_code", {
        p_user_id: userId,
        p_expires_minutes: 1440,
      });
      if (e2) throw e2;

      // 메일 발송
      const subject = `[${process.env.APP_NAME ?? "Momonga"}] 승인 코드가 도착했어요`;
      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>승인 코드</h2>
          <p>아래 코드를 Redeem 페이지에 입력하면 계정이 활성화됩니다.</p>
          <p style="font-size:20px;font-weight:700;letter-spacing:1px">${code}</p>
          <p style="color:#666">이 코드는 24시간 내 1회만 사용할 수 있어요.</p>
        </div>
      `;
      await sendWithResend(email, subject, html);

      // (선택) 발송 기록 (실패해도 기능은 돌아가게 가볍게)
      try {
        await supabase
          .from("approval_codes")
          .update({ sent_to_email: email, sent_at: new Date().toISOString() })
          .eq("user_id", userId)
          .is("used_at", null)
          .order("created_at", { ascending: false })
          .limit(1);
      } catch {}

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "failed" }, { status: 500 });
  }
}