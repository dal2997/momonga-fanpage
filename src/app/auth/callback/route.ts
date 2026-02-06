import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function safeNextPath(next: string | null) {
  if (!next) return "/";
  const v = next.trim();
  if (!v.startsWith("/")) return "/";
  if (v.startsWith("//")) return "/";
  if (v.startsWith("/auth/callback")) return "/";
  return v;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  // code가 없으면 로그인으로
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
