"use client";

import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/layout/GlassCard";
import type { CollectionRow } from "@/app/u/[handle]/page";

function formatPrice(n: number | null | undefined) {
  if (n == null) return "—";
  return `${n.toLocaleString()}원`;
}

function getMainImage(item: CollectionRow) {
  // 수집완료면 내사진 우선, 없으면 상품이미지
  if (item.status === "collected") return item.my_image ?? item.image ?? null;
  return item.image ?? null;
}

// ✅ 모달 내부 클릭이 배경(onMouseDown)으로 전파되지 않게만 막는다
function stopPropagationOnly(e: React.MouseEvent) {
  e.stopPropagation();
}

// ✅ 모달 카드 영역에서 마우스다운이 배경으로 전파되지 않게 막는다
function stopMouseDown(e: React.MouseEvent) {
  e.stopPropagation();
}

export default function PublicCollectionGrid({ items }: { items: CollectionRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const selected = useMemo(() => items.find((x) => x.id === openId) ?? null, [items, openId]);

  // ESC 닫기 + body scroll lock
  useEffect(() => {
    if (!openId) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [openId]);

  // ✅ 공통 스타일(라이트/다크)
  const focusRing =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-0 " +
    "dark:focus-visible:ring-white/20";

  const modalPill =
    "rounded-full border px-3 py-1.5 text-sm transition " +
    "border-black/10 bg-black/[0.04] text-zinc-800 hover:bg-black/[0.06] " +
    "dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10";

  const modalBadge =
    "relative inline-flex items-center overflow-hidden rounded-full px-2.5 py-1 text-xs font-medium " +
    "border border-black/10 bg-black/[0.04] text-zinc-700 " +
    "dark:border-white/10 dark:bg-white/[0.06] dark:text-white/80 " +
    "backdrop-blur-xl backdrop-saturate-150 shadow-[0_10px_28px_rgba(0,0,0,0.18)]";

  const modalTextTitle = "text-zinc-900 dark:text-white";
  const modalTextSub = "text-zinc-600 dark:text-white/60";
  const modalTextBody = "text-zinc-700 dark:text-white/70";

  const modalPanel =
    "border border-black/10 bg-black/[0.02] " +
    "dark:border-white/10 dark:bg-white/5";

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item) => {
          const img = getMainImage(item);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpenId(item.id)}
              className={[
                "group text-left",
                "transition-transform duration-200 ease-out",
                "hover:-translate-y-[2px] active:translate-y-0",
                focusRing,
              ].join(" ")}
            >
              <GlassCard
                className={[
                  "overflow-hidden p-0",
                  "transition-all duration-200 ease-out",
                  "group-hover:shadow-[0_28px_110px_rgba(0,0,0,0.60)]",
                ].join(" ")}
              >
                <div className="relative h-[220px] w-full overflow-hidden rounded-2xl">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={item.title ?? ""}
                      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : (
                    // ✅ 라이트/다크 모두 보이게
                    <div className="grid h-full place-items-center text-sm text-zinc-600 dark:text-white/50">
                      이미지 없음
                    </div>
                  )}

                  {/* ✅ 썸네일 영역은 '이미지 위'라서 흰 텍스트 유지해도 OK */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/0" />

                  <div
                    className="
                      pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-300
                      bg-[radial-gradient(900px_320px_at_20%_-10%,rgba(255,255,255,0.18),transparent_55%)]
                      group-hover:opacity-100
                    "
                  />

                  <div
                    className="
                      pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300
                      group-hover:opacity-100
                      [background:radial-gradient(260px_260px_at_52%_45%,rgba(255,255,255,0.12),transparent_60%)]
                    "
                  />

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
                      <span
                        className={[
                          "group/badge relative inline-flex items-center overflow-hidden rounded-full px-2.5 py-1 text-xs font-medium",
                          "border border-white/10 bg-white/[0.06] backdrop-blur-xl backdrop-saturate-150",
                          "shadow-[0_10px_28px_rgba(0,0,0,0.30)]",
                          "transition-transform duration-200 ease-out",
                          "group-hover:-translate-y-[1px]",
                        ].join(" ")}
                      >
                        <span
                          aria-hidden
                          className="
                            pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-300
                            bg-[radial-gradient(700px_220px_at_20%_-20%,rgba(255,255,255,0.22),transparent_55%)]
                            group-hover:opacity-100
                          "
                        />
                        <span
                          aria-hidden
                          className={[
                            "absolute inset-0 opacity-70",
                            item.status === "collecting"
                              ? "bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_0,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.00)_50%,rgba(255,255,255,0.00)_100%)] [background-size:10px_100%]"
                              : "bg-white/[0.02]",
                          ].join(" ")}
                        />
                        <span
                          aria-hidden
                          className="
                            pointer-events-none absolute top-0 left-0 h-full w-1/2 opacity-0
                            bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.45)_50%,transparent_100%)]
                            group-hover:animate-[glassShineSweep_.8s_ease-out_1]
                          "
                        />
                        <span className="relative text-white/85">
                          {item.status === "collecting" ? "수집중" : "수집완료"}
                        </span>
                      </span>

                      <span className="text-white/70">
                        · 원가 {formatPrice(item.original_price)}
                        {item.used_price != null ? (
                          <span className="text-white/55"> / 중고 {formatPrice(item.used_price)}</span>
                        ) : null}
                      </span>
                    </div>

                    <div className="mt-1 line-clamp-1 font-semibold text-white">
                      {item.title ?? "제목 없음"}
                    </div>

                    {item.my_memo ? (
                      <div className="mt-1 line-clamp-1 text-xs text-white/70">{item.my_memo}</div>
                    ) : null}
                  </div>

                  <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/0 transition group-hover:ring-white/10" />
                </div>
              </GlassCard>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 grid place-items-center px-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => setOpenId(null)}
        >
          {/* 배경 */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <div
            className="relative w-full max-w-3xl animate-[modalPop_.16s_ease-out_1]"
            onMouseDown={stopMouseDown}
          >
            <GlassCard className="overflow-hidden p-0">
              {/* header */}
              <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
                <div>
                  <div className="inline-flex">
                    <span className={modalBadge}>
                      <span
                        aria-hidden
                        className="
                          pointer-events-none absolute inset-0 opacity-60
                          bg-[radial-gradient(700px_220px_at_20%_-20%,rgba(255,255,255,0.18),transparent_55%)]
                        "
                      />
                      <span
                        aria-hidden
                        className={[
                          "absolute inset-0 opacity-70",
                          selected.status === "collecting"
                            ? "bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_0,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.00)_50%,rgba(255,255,255,0.00)_100%)] [background-size:10px_100%]"
                            : "bg-white/[0.02]",
                        ].join(" ")}
                      />
                      <span
                        aria-hidden
                        className="
                          pointer-events-none absolute top-0 left-0 h-full w-1/2 opacity-0
                          bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.35)_50%,transparent_100%)]
                          animate-[glassShineSweep_.8s_ease-out_1]
                        "
                      />
                      <span className="relative">
                        {selected.status === "collecting" ? "수집중" : "수집완료"}
                      </span>
                    </span>
                  </div>

                  <div className={`mt-0.5 text-lg font-semibold ${modalTextTitle}`}>
                    {selected.title ?? "제목 없음"}
                  </div>
                </div>

                <button type="button" onClick={() => setOpenId(null)} className={modalPill}>
                  닫기 ✕
                </button>
              </div>

              {/* images */}
              <div className="grid gap-3 p-5 md:grid-cols-2">
                {/* left: 상품 이미지 */}
                <div className={`overflow-hidden rounded-2xl ${modalPanel}`}>
                  <div className={`border-b border-black/10 px-4 py-3 text-sm ${modalTextSub} dark:border-white/10`}>
                    상품 이미지
                  </div>
                  <div className="relative aspect-[4/3]">
                    {selected.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selected.image}
                        alt="product"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className={`grid h-full w-full place-items-center ${modalTextSub}`}>없음</div>
                    )}
                  </div>
                </div>

                {/* right: 내 사진 */}
                <div className={`overflow-hidden rounded-2xl ${modalPanel}`}>
                  <div className={`border-b border-black/10 px-4 py-3 text-sm ${modalTextSub} dark:border-white/10`}>
                    내 사진
                  </div>
                  <div className="relative aspect-[4/3]">
                    {selected.my_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selected.my_image}
                        alt="my"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className={`grid h-full w-full place-items-center ${modalTextSub}`}>없음</div>
                    )}
                  </div>
                </div>
              </div>

              {/* details */}
              <div className="border-t border-black/10 px-5 py-4 dark:border-white/10">
                <div className={`flex flex-wrap gap-2 text-sm ${modalTextBody}`}>
                  <span className="rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 dark:border-white/10 dark:bg-white/5">
                    원가 {formatPrice(selected.original_price)}
                  </span>
                  <span className="rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 dark:border-white/10 dark:bg-white/5">
                    중고 {formatPrice(selected.used_price)}
                  </span>
                  <span className="rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 dark:border-white/10 dark:bg-white/5">
                    {new Date(selected.created_at).toLocaleString()}
                  </span>
                </div>

                {selected.my_memo ? (
                  <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-black/10 bg-black/[0.03] p-4 text-sm text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
                    {selected.my_memo}
                  </div>
                ) : null}

                {selected.link ? (
                  <div className="mt-4 flex justify-end">
                    <a
                      href={selected.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={stopPropagationOnly}
                      className={modalPill}
                    >
                      🔗 구매/정보 링크 열기
                    </a>
                  </div>
                ) : null}
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </>
  );
}
