// src/app/HomeClient.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import TopTabs from "@/components/layout/TopTabs";
import Hero from "@/components/sections/Hero";
import Gallery from "@/components/sections/Gallery";
import Profile from "@/components/sections/Profile";
import Collection from "@/components/sections/Collection";
import Footer from "@/components/sections/Footer";

import GlassCard from "@/components/layout/GlassCard";

import {
  CHARACTERS,
  CHARACTER_MAP,
  safeCharId,
  type CharacterId,
  type CharacterDef,
} from "@/data/characters";

type TabKey = "home" | "gallery" | "collection" | "profile";

type CollectionPreviewRow = {
  id: string;
  title: string | null;
  status: "collecting" | "collected";
  image: string | null;
  my_image: string | null;
  created_at: string;
};

function safeHomeTab(v: string | null): TabKey {
  if (v === "gallery" || v === "collection" || v === "profile" || v === "home") return v;
  return "home";
}

function pickPreviewImage(item: CollectionPreviewRow) {
  if (item.status === "collected") return item.my_image ?? item.image;
  return item.image ?? item.my_image;
}

export default function HomeClient({
  publicHandle,
  collectionPreview,
}: {
  publicHandle: string;
  collectionPreview: CollectionPreviewRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<TabKey>(() => safeHomeTab(searchParams.get("tab")));
  const [charId, setCharId] = useState<CharacterId>(() => safeCharId(searchParams.get("char")));

  // URL 파라미터 동기화
  useEffect(() => {
    setTab(safeHomeTab(searchParams.get("tab")));
    setCharId(safeCharId(searchParams.get("char")));
  }, [searchParams]);

  const character: CharacterDef = CHARACTER_MAP[charId];

  // 탭 변경 — char 파라미터 유지
  const onChange = useCallback(
    (t: TabKey) => {
      setTab(t);
      const qs = new URLSearchParams(Array.from(searchParams.entries()));
      if (t === "home") qs.delete("tab");
      else qs.set("tab", t);
      router.replace(qs.toString() ? `/?${qs}` : "/", { scroll: false });
    },
    [router, searchParams]
  );

  // 캐릭터 변경 — tab 파라미터 유지
  const onCharChange = useCallback(
    (id: CharacterId) => {
      setCharId(id);
      const qs = new URLSearchParams(Array.from(searchParams.entries()));
      qs.set("char", id);
      router.replace(`/?${qs}`, { scroll: false });
    },
    [router, searchParams]
  );

  const galleryPreview = useMemo(() => character.gallery.slice(0, 4), [character]);
  const publicCollectionHref = `/u/${encodeURIComponent(publicHandle)}?char=${charId}`;

  // ─── 스타일 토큰 ────────────────────────────────────────
  const imageTagPill =
    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur " +
    "border-white/15 bg-black/25 text-white/90 shadow-[0_10px_24px_rgba(0,0,0,0.25)] " +
    "dark:border-white/10 dark:bg-white/10 dark:text-white/80";

  const title = "text-zinc-900 dark:text-white";
  const sub = "text-zinc-600 dark:text-white/60";

  const pill =
    "relative overflow-hidden rounded-full border px-4 py-2 text-sm transition " +
    "border-black/10 bg-black/[0.04] text-zinc-900 hover:bg-black/[0.07] " +
    "dark:border-white/10 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/[0.10] " +
    "backdrop-blur-xl backdrop-saturate-150 " +
    "shadow-[0_16px_50px_rgba(0,0,0,0.10)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)]";

  const linkText = "text-sm text-zinc-600 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white";

  return (
    <main className="relative">
      <TopTabs value={tab} onChange={onChange} />

      <div className="mx-auto max-w-6xl px-5 pt-24 pb-24">

        {/* ── 캐릭터 스위처 ─────────────────────────────── */}
        <div className="mb-8 flex items-center gap-2 flex-wrap">
          {CHARACTERS.map((c) => {
            const active = c.id === charId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onCharChange(c.id)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition",
                  active
                    ? "border-black/20 bg-black/10 text-zinc-900 dark:border-white/20 dark:bg-white/12 dark:text-white"
                    : "border-black/10 bg-black/[0.04] text-zinc-600 hover:bg-black/[0.07] hover:text-zinc-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55 dark:hover:bg-white/[0.08] dark:hover:text-white/85",
                ].join(" ")}
              >
                <span>{c.emoji}</span>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>

        {/* ── 탭 콘텐츠 ──────────────────────────────────── */}
        {tab === "home" && (
          <div className="space-y-16">
            <Hero character={character} />

            {/* 순간 미리보기 */}
            <section className="scroll-mt-24">
              <div className="flex items-end justify-between">
                <h2 className={`text-2xl font-semibold ${title}`}>순간 미리보기</h2>
                <button type="button" onClick={() => onChange("gallery")} className={linkText}>
                  전체 보기 →
                </button>
              </div>

              {galleryPreview.length === 0 ? (
                <div className={`mt-6 rounded-2xl border border-black/10 bg-black/[0.03] p-8 text-center text-sm ${sub} dark:border-white/10 dark:bg-white/[0.03]`}>
                  아직 등록된 순간이 없어. 이미지를 추가하면 여기 나타나.
                </div>
              ) : (
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {galleryPreview.map((item) => (
                    <GlassCard key={item.id} className="overflow-hidden p-0">
                      <div className="relative h-[200px] w-full overflow-hidden rounded-2xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.title} className="block h-full w-full object-cover" />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/0" />
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <div className={imageTagPill}>{item.tag}</div>
                          <div className="mt-3 text-lg font-semibold text-white">{item.title}</div>
                          <div className="mt-1 text-sm text-white/75">{item.subtitle}</div>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </section>

            {/* 수집 미리보기 */}
            <section className="scroll-mt-24">
              <div className="flex items-end justify-between">
                <h2 className={`text-2xl font-semibold ${title}`}>수집 미리보기</h2>
                <Link href={publicCollectionHref} className={linkText}>
                  {character.name} 수집(공개) →
                </Link>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {collectionPreview.slice(0, 3).map((item) => {
                  const img = pickPreviewImage(item);
                  return (
                    <GlassCard key={item.id} className="overflow-hidden p-0">
                      <div className="relative h-[200px] w-full overflow-hidden rounded-2xl">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={item.title ?? "item"} className="h-full w-full object-cover" />
                        ) : (
                          <div className={`grid h-full place-items-center text-sm ${sub}`}>이미지 없음</div>
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/0" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="text-xs text-white/75">
                            {item.status === "collecting" ? "수집중" : "수집완료"}
                          </div>
                          <div className="mt-1 line-clamp-1 text-base font-semibold text-white">
                            {item.title ?? "제목 없음"}
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>

              <div className="mt-6">
                <GlassCard className="p-6">
                  <div className={`text-sm ${sub}`}>TIP</div>
                  <div className={`mt-2 text-lg font-semibold ${title}`}>
                    수집중 → 수집완료로 옮기면서 내 굿즈 아카이브를 쌓자
                  </div>
                  <div className={`mt-3 text-sm ${sub}`}>
                    원가/중고가를 (선택)으로 기록해두면, 나중에 판매 기능 붙일 때 바로 자산/거래 데이터로 이어짐.
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link href={publicCollectionHref} className={pill}>
                      공개 수집 보기
                    </Link>
                    <button type="button" onClick={() => onChange("collection")} className={pill}>
                      내 수집 관리(로그인)
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-zinc-500 dark:text-white/45">
                    공개 페이지는 누구나 볼 수 있고, 수정/추가는 로그인한 본인만 가능해.
                  </div>
                </GlassCard>
              </div>
            </section>

            {/* 프로필 미리보기 */}
            <section className="scroll-mt-24">
              <div className="flex items-end justify-between">
                <h2 className={`text-2xl font-semibold ${title}`}>프로필 미리보기</h2>
                <button type="button" onClick={() => onChange("profile")} className={linkText}>
                  전체 보기 →
                </button>
              </div>
              <div className="mt-4">
                <GlassCard className="p-6">
                  <div className={`text-sm ${sub}`}>나의 덕질 상태</div>
                  <div className={`mt-2 text-lg font-semibold ${title}`}>
                    좋아하는 포인트 / 취향 태그를 정리해두면 기록이 더 재밌어짐
                  </div>
                  <button type="button" onClick={() => onChange("profile")} className={`mt-5 ${pill}`}>
                    프로필 수정하러 가기
                  </button>
                </GlassCard>
              </div>
            </section>
          </div>
        )}

        {tab === "gallery" && <Gallery items={character.gallery} characterName={character.name} />}
        {tab === "collection" && <Collection character={charId} onCharChange={onCharChange} />}
        {tab === "profile" && <Profile />}
      </div>
      <Footer />
    </main>
  );
}
