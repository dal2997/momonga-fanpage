"use client";

import { useMemo, useState } from "react";

export default function CopyLinkButtons({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    // 브라우저에서만 안전하게 생성
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/u/${encodeURIComponent(handle)}`;
  }, [handle]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard 막히는 환경 대비: prompt fallback
      window.prompt("복사해서 공유해줘", url);
    }
  }

  function open() {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
      >
        {copied ? "✅ 복사됨" : "🔗 링크 복사"}
      </button>

      <button
        type="button"
        onClick={open}
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
      >
        ↗ 새 탭에서 보기
      </button>
    </div>
  );
}
