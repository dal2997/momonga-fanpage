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
                // ✅ hover 시 살짝 떠오르는 손맛
                "transition-transform duration-200 ease-out",
                "hover:-translate-y-[2px] active:translate-y-0",
                // 포커스도 깔끔하게
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-0",
              ].join(" ")}
            >
              <GlassCard
                className={[
                  "overflow-hidden p-0",
                  // ✅ 카드 자체도 hover 때 더 선명해지게
                  "transition-all duration-200 ease-out",
                  "group-hover:shadow-[0_28px_110px_rgba(0,0,0,0.60)]",
                  // border는 GlassCard 내부에 있지만 체감용으로 한 번 더 올려줌(과하면 지워도 됨)
                  "group-hover:after:ring-white/20",
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
                    <div className="grid h-full place-items-center text-sm text-white/50">
                      이미지 없음
                    </div>
                  )}

                  {/* ✅ 홈과 동일한 딥 오버레이 */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/0" />

                  {/* ✅ 글래스 하이라이트 (hover시 더 살아남) */}
                  <div
                    className="
                      pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-300
                      bg-[radial-gradient(900px_320px_at_20%_-10%,rgba(255,255,255,0.18),transparent_55%)]
                      group-hover:opacity-100
                    "
                  />

                  {/* ✅ 추가: hover 시 글로우 한 겹 더 (과한 맛) */}
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
                        {/* 광택(hover 때 더 살아남) */}
                        <span
                          aria-hidden
                          className="
                            pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-300
                            bg-[radial-gradient(700px_220px_at_20%_-20%,rgba(255,255,255,0.22),transparent_55%)]
                            group-hover:opacity-100
                          "
                        />

                        {/* 상태별 텍스처 */}
                        <span
                          aria-hidden
                          className={[
                            "absolute inset-0 opacity-70",
                            item.status === "collecting"
                              ? "bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_0,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.00)_50%,rgba(255,255,255,0.00)_100%)] [background-size:10px_100%]"
                              : "bg-white/[0.02]",
                          ].join(" ")}
                        />

                        {/* ✅ shine sweep (hover 시 1회) */}
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
                      <div className="mt-1 line-clamp-1 text-xs text-white/70">
                        {item.my_memo}
                      </div>
                    ) : null}
                  </div>

                  {/* ✅ 아주 얇은 상단 유리 테두리 느낌 */}
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

          {/* ✅ 모달 pop 애니메이션 */}
          <div
            className="relative w-full max-w-3xl animate-[modalPop_.16s_ease-out_1]"
            onMouseDown={stopMouseDown}
          >
            <GlassCard className="overflow-hidden p-0">
              {/* header */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <div className="inline-flex">
                    <span
                      className={[
                        "group/badge relative inline-flex items-center overflow-hidden rounded-full px-2.5 py-1 text-xs font-medium",
                        "border border-white/10 bg-white/[0.06] backdrop-blur-xl backdrop-saturate-150",
                        "shadow-[0_10px_28px_rgba(0,0,0,0.30)]",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden
                        className="
                          pointer-events-none absolute inset-0 opacity-70
                          bg-[radial-gradient(700px_220px_at_20%_-20%,rgba(255,255,255,0.22),transparent_55%)]
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

                      {/* ✅ 모달에서도 shine sweep (열릴 때 1회) */}
                      <span
                        aria-hidden
                        className="
                          pointer-events-none absolute top-0 left-0 h-full w-1/2 opacity-0
                          bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.45)_50%,transparent_100%)]
                          animate-[glassShineSweep_.8s_ease-out_1]
                        "
                      />

                      <span className="relative text-white/80">
                        {selected.status === "collecting" ? "수집중" : "수집완료"}
                      </span>
                    </span>
                  </div>

                  <div className="mt-0.5 text-lg font-semibold text-white">
                    {selected.title ?? "제목 없음"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  className="
                    rounded-full border px-3 py-1.5 text-sm transition
                    border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20
                  "
                >
                  닫기 ✕
                </button>
              </div>

              {/* images */}
              <div className="grid gap-3 p-5 md:grid-cols-2">
                {/* left: 상품 이미지 */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <div className="border-b border-white/10 px-4 py-3 text-sm text-white/70">
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
                      <div className="grid h-full w-full place-items-center text-white/50">
                        없음
                      </div>
                    )}
                  </div>
                </div>

                {/* right: 내 사진 */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <div className="border-b border-white/10 px-4 py-3 text-sm text-white/70">
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
                      <div className="grid h-full w-full place-items-center text-white/50">
                        없음
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* details */}
              <div className="border-t border-white/10 px-5 py-4">
                <div className="flex flex-wrap gap-2 text-sm text-white/70">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    원가 {formatPrice(selected.original_price)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    중고 {formatPrice(selected.used_price)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    {new Date(selected.created_at).toLocaleString()}
                  </span>
                </div>

                {selected.my_memo ? (
                  <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
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
                        border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20
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
