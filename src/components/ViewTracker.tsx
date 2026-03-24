"use client";

import { useEffect } from "react";

/**
 * 프로필 페이지 방문 시 조회수 1 증가
 *
 * 중복 방지: sessionStorage에 본 핸들 저장 → 같은 탭/세션에서 재방문은 카운트 안 함
 * (새 탭, 새 세션, 다른 기기는 각각 카운트)
 */
export default function ViewTracker({ handle }: { handle: string }) {
  useEffect(() => {
    if (!handle) return;

    const key = `viewed:${handle}`;

    // 이미 이 세션에서 봤으면 스킵
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // 프라이빗 브라우징 등 sessionStorage 차단 환경 → 그냥 진행
    }

    // 약간의 딜레이: 실제로 페이지를 본 방문자만 카운트 (즉시 이탈 봇 방어)
    const timer = setTimeout(() => {
      fetch("/api/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      }).catch(() => {
        // 네트워크 오류는 조용히 무시
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [handle]);

  return null;
}
