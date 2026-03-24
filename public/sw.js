/**
 * momonga — Minimal Service Worker
 *
 * 전략: Network First (항상 네트워크 우선, 실패 시 캐시 폴백)
 * - Next.js 앱 특성상 HTML/데이터는 항상 최신을 보여줘야 하므로 Network First
 * - 정적 자산(_next/static)은 Cache First로 효율화
 */

const CACHE_NAME = "momonga-v1";

// 정적 자산 패턴 (Cache First)
const STATIC_PATTERNS = [
  /\/_next\/static\//,
  /\/icons\//,
  /\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)$/,
];

// 캐시 제외 패턴
const SKIP_PATTERNS = [
  /\/api\//,
  /\/__nextjs/,
  /chrome-extension:/,
];

function isStatic(url) {
  return STATIC_PATTERNS.some((p) => p.test(url));
}

function shouldSkip(url) {
  return SKIP_PATTERNS.some((p) => p.test(url));
}

// ── Install: 핵심 셸 프리캐시 ─────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        "/",
        "/icons/icon-192.png",
        "/icons/icon-512.png",
      ]).catch(() => {
        // 오프라인 상태에서 설치 시 무시
      })
    )
  );
  self.skipWaiting();
});

// ── Activate: 구버전 캐시 정리 ───────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: 요청 인터셉트 ─────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  // GET 요청만 처리
  if (request.method !== "GET") return;
  if (shouldSkip(url)) return;

  if (isStatic(url)) {
    // Cache First: 정적 자산
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
  } else {
    // Network First: 동적 페이지
    event.respondWith(
      fetch(request)
        .then((response) => {
          // HTML 페이지만 캐시에 저장
          if (response.ok && request.headers.get("accept")?.includes("text/html")) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(async () => {
          // 오프라인: 캐시 폴백
          const cached = await caches.match(request);
          return cached ?? caches.match("/");
        })
    );
  }
});
