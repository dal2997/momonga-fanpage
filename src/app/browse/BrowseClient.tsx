"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import type { BrowseItem, UserCard } from "./page";
import OfferModal from "@/components/OfferModal";
import { supabase } from "@/lib/supabase/client";

type SortKey = "popular" | "items";

export default function BrowseClient({ userCards }: { userCards: UserCard[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("popular");
  const [offerTarget, setOfferTarget] = useState<BrowseItem | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user.id ?? null);
    });
  }, []);

  const filtered = useMemo(() => {
    let list = userCards;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.owner_handle.toLowerCase().includes(q) ||
          (c.owner_display_name ?? "").toLowerCase().includes(q) ||
          (c.owner_bio ?? "").toLowerCase().includes(q)
      );
    }
    if (sortKey === "popular") {
      return [...list].sort((a, b) => b.view_count - a.view_count || b.item_count - a.item_count);
    }
    return [...list].sort((a, b) => b.item_count - a.item_count);
  }, [userCards, search, sortKey]);

  return (
    <>
      <main className="mx-auto max-w-5xl px-5 pt-24 pb-32">

        {/* 헤더 */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">탐색</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-white/40">
              다른 유저들의 수집 취향을 구경해봐
            </p>
          </div>
          <Link
            href="/"
            className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition border-black/10 bg-black/[0.04] text-zinc-700 hover:bg-black/[0.08] dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70 dark:hover:bg-white/[0.09]"
          >
            ← 홈
          </Link>
        </div>

        {/* 검색 + 정렬 */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="유저 이름이나 취향으로 검색…"
            className="w-full max-w-xs rounded-full border px-4 py-2 text-sm outline-none transition border-black/10 bg-white/60 text-zinc-900 placeholder-zinc-400 focus:border-black/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder-white/30 dark:focus:border-white/20"
          />
          {/* 정렬 토글 */}
          <div className="flex items-center gap-1.5">
            {(["popular", "items"] as SortKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSortKey(k)}
                className={[
                  "rounded-full border px-3.5 py-1.5 text-xs transition",
                  sortKey === k
                    ? "border-black/20 bg-black/10 text-zinc-900 dark:border-white/20 dark:bg-white/15 dark:text-white"
                    : "border-black/10 bg-black/[0.03] text-zinc-500 hover:bg-black/[0.07] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/40 dark:hover:bg-white/[0.08]",
                ].join(" ")}
              >
                {k === "popular" ? "🔥 인기순" : "📦 수집많은순"}
              </button>
            ))}
          </div>
        </div>

        <p className="mb-5 text-xs text-zinc-400 dark:text-white/25">
          {filtered.length}명의 수집가
        </p>

        {/* 유저 카드 목록 */}
        {filtered.length === 0 ? (
          <div className="mt-16 text-center text-zinc-400 dark:text-white/30">
            아직 공개된 수집가가 없어.
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {filtered.map((card) => (
              <UserCardItem
                key={card.owner_id}
                card={card}
                onOffer={setOfferTarget}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </main>

      {offerTarget && (
        <OfferModal item={offerTarget} onClose={() => setOfferTarget(null)} />
      )}
    </>
  );
}

// ── 유저 카드 ──────────────────────────────────────────────
function UserCardItem({
  card,
  onOffer,
  currentUserId,
}: {
  card: UserCard;
  onOffer: (item: BrowseItem) => void;
  currentUserId: string | null;
}) {
  const isOwnCard = currentUserId === card.owner_id;
  const profileHref = `/u/${encodeURIComponent(card.owner_handle)}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white/60 dark:border-white/8 dark:bg-white/[0.04]">
      {/* 유저 정보 */}
      <div className="flex items-start gap-4 px-5 pt-5 pb-4">
        {/* 아바타 */}
        <Link href={profileHref} className="flex-shrink-0">
          <div className="h-11 w-11 overflow-hidden rounded-xl border border-black/8 bg-black/5 dark:border-white/8 dark:bg-white/5">
            {card.owner_avatar ? (
              <img
                src={card.owner_avatar}
                alt={card.owner_handle}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-lg">🙂</div>
            )}
          </div>
        </Link>

        {/* 이름 + 소개 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Link
              href={profileHref}
              className="text-base font-semibold text-zinc-900 hover:underline dark:text-white"
            >
              {card.owner_display_name || card.owner_handle}
            </Link>
            <span className="text-xs text-zinc-400 dark:text-white/30">
              @{card.owner_handle}
            </span>
            <span className="text-xs text-zinc-400 dark:text-white/30">
              · 수집품 {card.item_count}개
            </span>
            {card.view_count > 0 && (
              <span className="text-xs text-zinc-400 dark:text-white/30">
                · 조회 {card.view_count.toLocaleString()}
              </span>
            )}
          </div>
          {card.owner_bio && (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-white/50">
              {card.owner_bio}
            </p>
          )}
        </div>

        {/* 전체 보기 버튼 */}
        <div className="flex flex-shrink-0 self-start items-center gap-2">
          {isOwnCard && (
            <span className="rounded-full border border-black/10 bg-black/[0.05] px-2.5 py-1 text-[11px] font-medium text-zinc-500 dark:border-white/10 dark:bg-white/[0.07] dark:text-white/40">
              내 컬렉션
            </span>
          )}
          <Link
            href={profileHref}
            className="rounded-full border border-black/10 bg-black/[0.03] px-3.5 py-1.5 text-xs text-zinc-600 transition hover:bg-black/[0.07] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50 dark:hover:bg-white/[0.08]"
          >
            전체 보기 →
          </Link>
        </div>
      </div>

      {/* 수집품 이미지 5개 */}
      {card.preview_items.length > 0 && (
        <div className="grid grid-cols-5 gap-0.5 px-5 pb-5">
          {card.preview_items.map((item) => {
            const img =
              item.status === "collected"
                ? (item.my_image ?? item.image)
                : item.image;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => !isOwnCard && onOffer(item)}
                title={isOwnCard ? "내 아이템" : (item.title ?? "")}
                className={`group relative aspect-square overflow-hidden rounded-xl bg-black/5 dark:bg-white/5 first:rounded-l-xl last:rounded-r-xl hover:z-10 ${isOwnCard ? "cursor-default" : ""}`}
              >
                {img ? (
                  <img
                    src={img}
                    alt={item.title ?? ""}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-2xl">
                    {item.cat_emoji ?? "📦"}
                  </div>
                )}

                {/* hover 오버레이 — 본인 아이템은 제안 없이 제목만 */}
                <div className="absolute inset-0 flex flex-col justify-end bg-black/0 p-2 opacity-0 transition group-hover:bg-black/50 group-hover:opacity-100">
                  <p className="line-clamp-2 text-[10px] font-medium leading-tight text-white">
                    {item.title ?? "제목 없음"}
                  </p>
                  {!isOwnCard && (
                    <p className="mt-0.5 text-[9px] text-white/70">
                      💬 제안
                    </p>
                  )}
                </div>

                {/* 수집중 배지 */}
                {item.status === "collecting" && (
                  <span className="absolute left-1 top-1 rounded-full bg-amber-500/80 px-1.5 py-0.5 text-[8px] font-medium text-white">
                    수집중
                  </span>
                )}
              </button>
            );
          })}

          {/* 남은 수 표시 */}
          {card.item_count > 5 && (
            <Link
              href={profileHref}
              className="relative aspect-square overflow-hidden rounded-xl bg-black/[0.04] dark:bg-white/[0.05] flex items-center justify-center text-zinc-500 dark:text-white/40 text-xs font-medium hover:bg-black/[0.08] dark:hover:bg-white/[0.09] transition col-span-1"
              style={{ display: card.preview_items.length >= 5 ? "none" : "flex" }}
            >
              +{card.item_count - card.preview_items.length}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
