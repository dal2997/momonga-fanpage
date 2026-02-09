"use client";

import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/layout/GlassCard";
import { gallery, type GalleryItem } from "@/data/gallery";

export default function Gallery() {
  const [open, setOpen] = useState<GalleryItem | null>(null);

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const list = useMemo(() => gallery, []);

  const title = "text-zinc-900 dark:text-white";
  const subtle = "text-zinc-600 dark:text-white/45";

  const overlayTag =
    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur " +
    "border-white/12 bg-white/10 text-white/85";

  const modalDim = "absolute inset-0 bg-white/40 backdrop-blur-sm dark:bg-black/70";

  const modalFooterText = "text-sm text-zinc-600 dark:text-white/55";
  const modalCloseBtn =
    "rounded-full border px-4 py-2 text-sm transition " +
    "border-black/10 bg-black/[0.04] text-zinc-800 hover:bg-black/[0.08] " +
    "dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10";

  return (
    <section id="gallery" className="scroll-mt-24">
      <div className="flex items-end justify-between">
        <h2 className={`text-2xl font-semibold ${title}`}>팬들이 좋아하는 순간</h2>
        <p className={`text-sm ${subtle}`}>hover 해봐</p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {list.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpen(item)}
            className="text-left"
            aria-label={item.title}
          >
            <GlassCard className="group overflow-hidden p-0">
              {/* 이미지 */}
              <div className="relative h-[220px] w-full overflow-hidden rounded-2xl">
                {/* 핵심: img에 block -> 아래 틈 제거 */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="block h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                  draggable={false}
                />

                {/* 상단 유리막 */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/0" />

                {/* 텍스트 오버레이 (이미지 위라서 라이트/다크 상관없이 흰 텍스트 유지) */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className={overlayTag}>{item.tag}</div>

                  <div className="mt-3 text-lg font-semibold text-white">{item.title}</div>
                  <div className="mt-1 text-sm text-white/75">{item.subtitle}</div>
                </div>
              </div>

              {/* 카드 하단 아주 미세한 highlight */}
              <div className="pointer-events-none h-12 w-full bg-white/[0.02] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </GlassCard>
          </button>
        ))}
      </div>

      {/* 모달 */}
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center px-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => setOpen(null)}
        >
          {/* dim */}
          <div className={modalDim} />

          <div className="relative w-full max-w-3xl" onMouseDown={(e) => e.stopPropagation()}>
            <GlassCard className="overflow-hidden p-0">
              <div className="relative h-[360px] w-full overflow-hidden">
                <img
                  src={open.image}
                  alt={open.title}
                  className="block h-full w-full object-cover"
                  draggable={false}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/0" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className={overlayTag}>{open.tag}</div>
                  <div className="mt-3 text-2xl font-semibold text-white">{open.detailTitle}</div>
                  <div className="mt-2 text-white/80">{open.detailBody}</div>
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4">
                <p className={modalFooterText}>ESC로 닫기</p>
                <button type="button" onClick={() => setOpen(null)} className={modalCloseBtn}>
                  닫기
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </section>
  );
}
