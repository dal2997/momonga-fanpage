/**
 * src/lib/config.ts
 *
 * 앱 전역 상수 — 환경변수 기반으로 관리합니다.
 * Vercel 환경변수 또는 .env.local 에서 설정하세요.
 */

/**
 * 공개 프로필 핸들.
 * 홈 화면 및 네비게이션의 "수집" 탭에서 공개 페이지로 연결되는 기준 핸들입니다.
 * Vercel → Settings → Environment Variables → NEXT_PUBLIC_OWNER_HANDLE
 */
export const PUBLIC_HANDLE =
  process.env.NEXT_PUBLIC_OWNER_HANDLE ?? "dal2997";

/**
 * 사이트 기본 URL.
 * 이메일 링크, OG 태그 등에 사용됩니다.
 * Vercel → Settings → Environment Variables → NEXT_PUBLIC_SITE_URL
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://momonga.app";
