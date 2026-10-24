import type { NextConfig } from "next";

/**
 * 보안 헤더
 * - 클릭재킹 방지(frame-ancestors / X-Frame-Options)
 * - MIME 스니핑 방지, HTTPS 강제(HSTS), 리퍼러 최소화, 불필요한 브라우저 권한 차단
 * (스크립트 CSP는 Supabase/Next 인라인 스크립트와 충돌할 수 있어 frame-ancestors 등만 적용)
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
