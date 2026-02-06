import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function safeNextPath(next: string | null) {
  // 기본값
  if (!next) return "/";

  // 공백 제거
  const v = next.trim();

  // 내부 경로만 허용: "/..." 형태만 OK
  // - "http", "https", "//" 등 외부/프로토콜 형태 차단
  if (!v.startsWith("/")) return "/";
  if (v.startsWith("//")) return "/";

  // (선택) 콜백 자체로 무한루프 방지
  if (v.startsWith("/auth/callback")) return "/";

  return v;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=missing_code`, origin));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=exchange_failed`, origin)
    );
  }

  return NextResponse.redirect(new URL(next, origin));
}
