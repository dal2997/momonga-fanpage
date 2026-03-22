// src/app/api/admin/notice/route.ts
import { NextResponse } from "next/server";
import { makeSupabase, sendWithResend, APP_NAME } from "@/lib/adminUtils";

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });
  const supabase = await makeSupabase(res);

  // 세션 확인
  const { data: u, error: ue } = await supabase.auth.getUser();
  if (ue) return NextResponse.json({ ok: false, error: ue.message }, { status: 401 });
  if (!u.user) return NextResponse.json({ ok: false, error: "no session" }, { status: 401 });

  // admin 체크
  const { data: me, error: meErr } = await supabase
    .from("profiles")
    .select("id,is_admin")
    .eq("id", u.user.id)
    .maybeSingle();

  if (meErr) return NextResponse.json({ ok: false, error: meErr.message }, { status: 403 });
  if (!me?.is_admin) return NextResponse.json({ ok: false, error: "not admin" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const subject = (body?.subject as string | undefined)?.trim();
  const content = (body?.content as string | undefined)?.trim();

  if (!subject || !content) {
    return NextResponse.json({ ok: false, error: "missing subject/content" }, { status: 400 });
  }

  // 승인된 유저 전체 이메일 목록 (admin RPC)
  const { data: emails, error: e0 } = await supabase.rpc("admin_list_approved_emails");
  if (e0) return NextResponse.json({ ok: false, error: e0.message }, { status: 500 });

  const list = (emails as string[] | null) ?? [];
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>${subject}</h2>
      <div style="white-space:pre-wrap">${content.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</div>
      <p style="color:#666;font-size:12px;margin-top:24px">${APP_NAME} 공지</p>
    </div>
  `;

  try {
    for (const to of list) {
      await sendWithResend(to, `[${APP_NAME}] ${subject}`, html);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "mail send failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sent: list.length });
}
