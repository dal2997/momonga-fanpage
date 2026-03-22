/**
 * src/lib/adminUtils.ts
 *
 * Admin API route 공통 유틸 — approval/route.ts, notice/route.ts에서 함께 사용
 * 중복 코드를 여기 한 곳으로 모읍니다.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Admin route handler에서 사용하는 Supabase 클라이언트 */
export type AdminSupabaseClient = SupabaseClient;

/**
 * 서버 사이드 Supabase 클라이언트 생성.
 * res 객체를 받아 쿠키 set 처리를 위임합니다.
 */
export async function makeSupabase(res: NextResponse): Promise<AdminSupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });
}

/**
 * Resend를 통한 이메일 발송.
 * RESEND_API_KEY, MAIL_FROM 환경변수 미설정 시 명시적 에러를 던집니다.
 */
export async function sendWithResend(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!key) throw new Error("RESEND_API_KEY environment variable is not set");
  if (!from) throw new Error("MAIL_FROM environment variable is not set");

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

/**
 * auth.users 이메일을 admin 전용 RPC로 가져옵니다.
 * DB에 admin_get_user_email(p_user_id uuid) RPC가 필요합니다.
 */
export async function adminGetUserEmail(
  supabase: AdminSupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc("admin_get_user_email", {
    p_user_id: userId,
  });
  if (error) throw error;
  return data as string | null;
}

/** 앱 표시 이름 (공지 메일 제목 등에 사용) */
export const APP_NAME = process.env.APP_NAME ?? "Momonga";

/** 사이트 URL (메일 내 링크 생성 등에 사용). 반드시 Vercel 환경 변수로 설정 필요. */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url || url.startsWith("http://localhost")) {
    // 프로덕션에서 localhost가 나오면 잘못된 설정
    console.warn("[adminUtils] NEXT_PUBLIC_SITE_URL이 localhost로 설정되어 있습니다. Vercel 환경 변수를 확인하세요.");
  }
  return url ?? "";
}
