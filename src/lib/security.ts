/**
 * src/lib/security.ts
 *
 * 공통 보안 유틸
 * - escapeHtml: 메일 HTML 등에 사용자 입력을 넣을 때 반드시 사용
 * - safeExternalUrl: 사용자가 입력한 링크를 href로 쓸 때 http(s)만 허용
 */

export function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** http/https 링크만 통과. javascript:, data: 등은 null */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  // "www.example.com" 처럼 스킴 없이 입력한 경우 https:// 를 붙여줌
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return null;
  } catch {
    return null;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}
