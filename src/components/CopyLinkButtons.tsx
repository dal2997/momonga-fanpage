"use client";

import { useState } from "react";

export default function CopyLinkButtons({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);

  function getUrl() {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/u/${encodeURIComponent(handle)}`;
  }

  async function copy() {
    const url = getUrl();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      window.prompt("복사해서 공유해줘", url);
    }
  }

  function open() {
    const url = getUrl();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={copy} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
        {copied ? "✅ 복사됨" : "🔗 링크 복사"}
      </button>

      <button type="button" onClick={open} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
        ↗ 새 탭에서 보기
      </button>
    </div>
  );
}
