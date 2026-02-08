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

export default function PublicCollectionGrid({
  items,
}: {
  items: CollectionRow[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const selected = useMemo(
    () => items.find((x) => x.id === openId) ?? null,
    [items, openId]
  );

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
              className="text-left"
            >
              <GlassCard className="overflow-hidden p-0">
                <div className="relative h-[220px]">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={item.title ?? ""}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-zinc-600 dark:text-white/50">
                      이미지 없음
                    </div>
                  )}

                  {/* 이미지 위 오버레이(라이트/다크 공통으로 충분히 어둡게) */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="text-sm text-white/80">
                      {item.status === "collecting" ? "수집중" : "수집완료"} · 원가{" "}
                      {formatPrice(item.original_price)}
                      {item.used_price != null ? (
                        <span className="text-white/60">
                          {" "}
                          / 중고 {formatPrice(item.used_price)}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1 line-clamp-1 font-semibold text-white">
                      {item.title ?? "제목 없음"}
                    </div>

                    {item.my_memo ? (
                      <div className="mt-1 line-clamp-1 text-xs text-white/70">
                        {item.my_memo}
                      </div>
                    ) : null}
                  </div>
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
            className="relative w-full max-w-3xl"
            onMouseDown={stopMouseDown}
          >
            <GlassCard className="overflow-hidden p-0">
              {/* header */}
              <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
                <div>
                  <div className="text-sm text-zinc-600 dark:text-white/60">
                    {selected.status === "collecting" ? "수집중" : "수집완료"}
                  </div>
                  <div className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {selected.title ?? "제목 없음"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  className="
                    rounded-full border px-3 py-1.5 text-sm transition
                    border-black/10 bg-black/5 text-zinc-700 hover:bg-black/10
                    dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10
                  "
                >
                  닫기 ✕
                </button>
              </div>

              {/* images */}
              <div className="grid gap-3 p-5 md:grid-cols-2">
                {/* left: 상품 이미지 */}
                <div className="overflow-hidden rounded-2xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-black/20">
                  <div className="border-b border-black/10 px-4 py-3 text-sm text-zinc-600 dark:border-white/10 dark:text-white/70">
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
                      <div className="grid h-full w-full place-items-center text-zinc-600 dark:text-white/50">
                        없음
                      </div>
                    )}
                  </div>
                </div>

                {/* right: 내 사진 */}
                <div className="overflow-hidden rounded-2xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-black/20">
                  <div className="border-b border-black/10 px-4 py-3 text-sm text-zinc-600 dark:border-white/10 dark:text-white/70">
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
                      <div className="grid h-full w-full place-items-center text-zinc-600 dark:text-white/50">
                        없음
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* details */}
              <div className="border-t border-black/10 px-5 py-4 dark:border-white/10">
                <div className="flex flex-wrap gap-2 text-sm text-zinc-700 dark:text-white/70">
                  <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 dark:border-white/10 dark:bg-white/5">
                    원가 {formatPrice(selected.original_price)}
                  </span>
                  <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 dark:border-white/10 dark:bg-white/5">
                    중고 {formatPrice(selected.used_price)}
                  </span>
                  <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 dark:border-white/10 dark:bg-white/5">
                    {new Date(selected.created_at).toLocaleString()}
                  </span>
                </div>

                {selected.my_memo ? (
                  <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-black/10 bg-black/5 p-4 text-sm text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
                    {selected.my_memo}
                  </div>
                ) : null}

                {selected.link ? (
                  <div className="mt-4 flex justify-end">
                    {/* ✅ 외부 링크: preventDefault 금지, stopPropagation만 */}
                    <a
                      href={selected.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={stopPropagationOnly}
                      className="
                        rounded-full border px-4 py-2 text-sm transition
                        border-black/10 bg-black/5 text-zinc-800 hover:bg-black/10
                        dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10
                      "
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
