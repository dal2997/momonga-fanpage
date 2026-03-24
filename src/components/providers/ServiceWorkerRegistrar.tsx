"use client";

import { useEffect } from "react";

/**
 * 서비스워커 등록 — 클라이언트 전용, 조용히 실패
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // 새 버전 감지 시 자동 업데이트
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              // 새 SW 설치 완료 — 페이지 리로드로 반영
              // (옵션: 토스트 "새 버전이 있어요. 새로고침할까요?" 추가 가능)
              console.info("[SW] 새 버전 설치됨. 새로고침 후 적용됩니다.");
            }
          });
        });
      })
      .catch((err) => {
        // 개발 환경 등에서 조용히 무시
        console.debug("[SW] 등록 실패:", err);
      });
  }, []);

  return null;
}
