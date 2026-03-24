"use client";

/**
 * ShareButton — 현재 페이지 URL을 Web Share API로 공유하거나 클립보드 복사
 */
import { useState } from "react";

type Props = {
  url: string;
  title?: string;
  text?: string;
};

export default function ShareButton({
  url,
  title = "momonga 수집 페이지",
  text = "momonga.app에서 내 수집품을 구경해봐 🐿️",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    // Web Share API 지원 여부 확인
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // 취소 등 무시 → 클립보드 폴백
      }
    }

    // 폴백: 클립보드 복사
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 구형 브라우저 최후 폴백
      prompt("링크를 복사하세요:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
        copied
          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
          : "border-black/10 bg-black/5 text-zinc-700 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10",
      ].join(" ")}
    >
      {copied ? "✅ 복사됨!" : "🔗 공유하기"}
    </button>
  );
}
