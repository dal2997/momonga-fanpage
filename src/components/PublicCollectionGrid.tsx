"use client";

import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/layout/GlassCard";
import type { CollectionRow } from "@/app/u/[handle]/page";
import OfferModal from "@/components/OfferModal";
import type { BrowseItem } from "@/app/browse/page";

function formatPrice(n: number | null | undefined) {
  if (n == null) return "—";
  return `${n.toLocaleString()}원`;
}

function getMainImage(item: CollectionRow) {
  // 수집완료면 내사진 우선, 없으면 상품이미지
  if (item.status === "collected") return item.my_image ?? item.image ?? null;
  return item.image ?? null;
}

function stopPropagationOnly(e: React.MouseEvent) {
  e.stopPropagation();
}

function stopMouseDown(e: React.MouseEvent) {
  e.stopPropagation();
}

function toOfferItem(item: CollectionRow, ownerHandle: string): BrowseItem {
  return {
    id: item.id,
    title: item.title,
    image: item.image,
    my_image: item.my_image,
    original_price: item.original_price,
    used_price: item.used_price,
    sale_price: item.sale_price,
    status: item.status,
    created_at: item.created_at,
    owner_id: item.owner_id,
    owner_handle: ownerHandle,
    owner_display_name: null,
    cat_name: null,
    cat_emoji: null,
  };
}

export default function PublicCollectionGrid({
  items,
  ownerHandle,
}: {
  items: CollectionRow[];
  ownerHandle: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [offerTarget, setOfferTarget] = useState<BrowseItem | null>(null);
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

  const pill =
    "rounded-full border px-3 py-1.5 text-sm transition " +
    "border-black/10 bg-black/[0.04] text-zinc-800 hover:bg-black/[0.06] hover:border-black/15 " +
    "dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 dark:hover:border-white/20";

  const badge =
    "relative inline-flex items-center overflow-hidden rounded-full px-2.5 py-1 text-xs font-medium " +
    "border border-black/10 bg-black/[0.04] text-zinc-700 " +
    "dark:border-white/10 dark:bg-white/[0.06] dark:text-white/80 " +
    "backdrop-blur-xl backdrop-saturate-150 shadow-[0_10px_28px_rgba(0,0,0,0.14)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.30)]";

  const panel =
    "overflow-hidden rounded-2xl border " +
    "border-black/10 bg-white/60 " +
    "dark:border-white/10 dark:bg-white/5";

  const panelHeader = "border-b px-4 py-3 text-sm border-black/10 text-zinc-600 dark:border-white/10 dark:text-white/60";

  const textTitle = "text-zinc-900 dark:text-white";
  const textSub = "text-zinc-600 dark:text-white/60";
  const textBody = "text-zinc-700 dark:text-white/70";

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item) => {
          const img = getMainImage(item);

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => setOpenId(item.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpenId(item.id); }}
              className={[
                "group text-left cursor-pointer",
                "transition-transform duration-200 ease-out",
                "hover:-translate-y-[2px] active:translate-y-0",
                focusRing,
              ].join(" ")}
            >
              <GlassCard
                className={[
                  "overflow-hidden p-0",
                  "transition-all duration-200 ease-out",
                  "group-hover:shadow-[0_28px_110px_rgba(0,0,0,0.55)] dark:group-hover:shadow-[0_28px_110px_rgba(0,0,0,0.60)]",
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
                    <div className="grid h-full place-items-center text-sm text-zinc-600 dark:text-white/50">
                      이미지 없음
                    </div>
                  )}

                  {/* ✅ 썸네일은 이미지 위라서 흰 텍스트 OK */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/0" />

                  <div
                    className="
                      pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-300
                      bg-[radial-gradient(900px_320px_at_20%_-10%,rgba(255,255,255,0.18),transparent_55%)]
                      group-hover:opacity-100
                    "
                  />

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-white/85">
                      <span
                        className={[
                          "group/badge relative inline-flex items-center overflow-hidden rounded-full px-2.5 py-1 text-xs font-medium",
                          "border border-white/10 bg-white/[0.06] backdrop-blur-xl backdrop-saturate-150",
                          "shadow-[0_10px_28px_rgba(0,0,0,0.28)]",
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
                        <span className="relative text-white/90">
                          {item.status === "collecting" ? "수집중" : "수집완료"}
                        </span>
                      </span>

                      <span className="text-white/75">
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

                  {/* source_type 뱃지 — 카드 좌상단 */}
                  {item.source_type && (
                    <div className={[
                      "pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur",
                      item.source_type === "official"
                        ? "bg-sky-500/80 text-white"
                        : "bg-zinc-700/80 text-white/80",
                    ].join(" ")}>
                      {item.source_type === "official" ? "✅ 공식" : "❓ 출처불명"}
                    </div>
                  )}

                  {/* 💬 제안 버튼 — 카드 우상단, hover시 표시 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOfferTarget(toOfferItem(item, ownerHandle));
                    }}
                    className="
                      absolute right-2 top-2
                      rounded-full border border-white/20 bg-black/50 px-2.5 py-1
                      text-[11px] font-medium text-white/90
                      backdrop-blur-sm transition
                      opacity-0 group-hover:opacity-100
                      hover:bg-black/70
                    "
                  >
                    💬 제안
                  </button>
                </div>
              </GlassCard>
            </div>
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
          {/* ✅ 라이트: 너무 어둡지 않게 / 다크: 기존처럼 깊게 */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm dark:bg-black/70" />

          <div
            className="relative w-full max-w-3xl animate-[modalPop_.16s_ease-out_1]"
            onMouseDown={stopMouseDown}
          >
            {/* ✅ 모달 카드 외곽도 라이트에서 너무 먹지 않게 */}
            <GlassCard className="overflow-hidden p-0">
              {/* header */}
              <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
                <div>
                  <div className="inline-flex flex-wrap items-center gap-2">
                    <span className={badge}>
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

                    {/* source_type 뱃지 */}
                    {selected.source_type && (
                      <span className={[
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                        selected.source_type === "official"
                          ? "bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300"
                          : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700/50 dark:text-zinc-300",
                      ].join(" ")}>
                        {selected.source_type === "official" ? "✅ 공식" : "❓ 출처불명"}
                      </span>
                    )}
                  </div>

                  <div className={`mt-0.5 text-lg font-semibold ${textTitle}`}>
                    {selected.title ?? "제목 없음"}
                  </div>
                </div>

                <button type="button" onClick={() => setOpenId(null)} className={pill}>
                  닫기 ✕
                </button>
              </div>

              {/* images */}
              <div className="grid gap-3 p-5 md:grid-cols-2">
                <div className={panel}>
                  <div className={panelHeader}>상품 이미지</div>
                  <div className="relative aspect-[4/3]">
                    {selected.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selected.image} alt="product" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className={`grid h-full w-full place-items-center ${textSub}`}>없음</div>
                    )}
                  </div>
                </div>

                <div className={panel}>
                  <div className={panelHeader}>내 사진</div>
                  <div className="relative aspect-[4/3]">
                    {selected.my_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selected.my_image} alt="my" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className={`grid h-full w-full place-items-center ${textSub}`}>없음</div>
                    )}
                  </div>
                </div>
              </div>

              {/* details */}
              <div className="border-t border-black/10 px-5 py-4 dark:border-white/10">
                <div className={`flex flex-wrap gap-2 text-sm ${textBody}`}>
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
                  <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-black/10 bg-white/60 p-4 text-sm text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
                    {selected.my_memo}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {/* 💬 가격 제안 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenId(null);
                      setOfferTarget(toOfferItem(selected, ownerHandle));
                    }}
                    className={pill}
                  >
                    💬 가격 제안하기
                  </button>

                  {selected.link ? (
                    <a
                      href={selected.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={stopPropagationOnly}
                      className={pill}
                    >
                      🔗 구매/정보 링크 열기
                    </a>
                  ) : null}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* 가격 제안 모달 */}
      {offerTarget && (
        <OfferModal item={offerTarget} onClose={() => setOfferTarget(null)} />
      )}
    </>
  );
}
