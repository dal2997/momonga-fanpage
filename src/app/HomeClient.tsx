"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import TopTabs from "@/components/layout/TopTabs";
import Hero from "@/components/sections/Hero";
import Gallery from "@/components/sections/Gallery";
import Profile from "@/components/sections/Profile";
import Collection from "@/components/sections/Collection";

import GlassCard from "@/components/layout/GlassCard";
import { gallery } from "@/data/gallery";

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
  // ✅ 수집완료면 내사진(my_image)이 우선, 없으면 image
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

  // ✅ 최초 탭을 URL 기준으로(예: /?tab=collection)
  const [tab, setTab] = useState<TabKey>(() => safeHomeTab(searchParams.get("tab")));

  // ✅ 뒤로가기/앞으로가기 등으로 URL이 바뀌면 탭도 따라가게
  useEffect(() => {
    const nextTab = safeHomeTab(searchParams.get("tab"));
    setTab(nextTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const onChange = useCallback(
    (t: TabKey) => {
      setTab(t);
      const qs = new URLSearchParams(Array.from(searchParams.entries()));
      if (t === "home") qs.delete("tab");
      else qs.set("tab", t);
      const q = qs.toString();
      router.replace(q ? `/?${q}` : "/", { scroll: false });
    },
    [router, searchParams]
  );

  const galleryPreview = useMemo(() => gallery.slice(0, 4), []);
  const publicCollectionHref = `/u/${encodeURIComponent(publicHandle)}?tab=all`;

  return (
    <main className="relative">
      <TopTabs value={tab} onChange={onChange} />

      <div className="mx-auto max-w-6xl px-5 pt-24 pb-24">
        {tab === "home" && (
          <div className="space-y-16">
            <Hero />

            {/* 순간 미리보기 */}
            <section className="scroll-mt-24">
              <div className="flex items-end justify-between">
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  순간 미리보기
                </h2>
                <button
                  type="button"
                  onClick={() => onChange("gallery")}
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white"
                >
                  전체 보기 →
                </button>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {galleryPreview.map((item) => (
                  <GlassCard key={item.id} className="overflow-hidden p-0">
                    <div className="relative h-[200px] w-full overflow-hidden rounded-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.title}
                        className="block h-full w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/0" />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <div
                          className="
                            inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur
                            border-white/10 bg-white/10 text-white/80
                          "
                        >
                          {item.tag}
                        </div>
                        <div className="mt-3 text-lg font-semibold text-white">{item.title}</div>
                        <div className="mt-1 text-sm text-white/70">{item.subtitle}</div>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </section>

            {/* 수집 미리보기 */}
            <section className="scroll-mt-24">
              <div className="flex items-end justify-between">
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  수집 미리보기
                </h2>
                <Link
                  href={publicCollectionHref}
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white"
                >
                  모몽가 수집(공개) →
                </Link>
              </div>

              {/* ✅ 미리보기 이미지 그리드 */}
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {collectionPreview.slice(0, 3).map((item) => {
                  const img = pickPreviewImage(item);
                  return (
                    <GlassCard key={item.id} className="overflow-hidden p-0">
                      <div className="relative h-[200px] w-full overflow-hidden rounded-2xl">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt={item.title ?? "item"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-sm text-zinc-600 dark:text-white/50">
                            이미지 없음
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/0" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="text-xs text-white/70">
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

              {/* ✅ 버튼 2개(공개/내관리) */}
              <div className="mt-6">
                <GlassCard className="p-6">
                  <div className="text-sm text-zinc-600 dark:text-white/60">TIP</div>

                  <div className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">
                    수집중 → 수집완료로 옮기면서 내 굿즈 아카이브를 쌓자
                  </div>

                  <div className="mt-3 text-sm text-zinc-600 dark:text-white/60">
                    원가/중고가를 (선택)으로 기록해두면, 나중에 판매 기능 붙일 때 바로 자산/거래 데이터로 이어짐.
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={publicCollectionHref}
                      className="
                        rounded-full border px-4 py-2 text-sm transition
                        border-black/10 bg-black/5 text-zinc-800 hover:bg-black/10
                        dark:border-white/10 dark:bg-white/10 dark:text-white/90 dark:hover:bg-white/15
                      "
                    >
                      공개 수집 보기
                    </Link>

                    <button
                      type="button"
                      onClick={() => onChange("collection")}
                      className="
                        rounded-full border px-4 py-2 text-sm transition
                        border-black/10 bg-black/5 text-zinc-800 hover:bg-black/10
                        dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10
                      "
                    >
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
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  프로필 미리보기
                </h2>
                <button
                  type="button"
                  onClick={() => onChange("profile")}
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white"
                >
                  전체 보기 →
                </button>
              </div>

              <div className="mt-4">
                <GlassCard className="p-6">
                  <div className="text-sm text-zinc-600 dark:text-white/60">나의 덕질 상태</div>

                  <div className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">
                    좋아하는 포인트 / 취향 태그를 정리해두면 기록이 더 재밌어짐
                  </div>

                  <button
                    type="button"
                    onClick={() => onChange("profile")}
                    className="
                      mt-5 rounded-full border px-4 py-2 text-sm transition
                      border-black/10 bg-black/5 text-zinc-800 hover:bg-black/10
                      dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10
                    "
                  >
                    프로필 수정하러 가기
                  </button>
                </GlassCard>
              </div>
            </section>
          </div>
        )}

        {tab === "gallery" && <Gallery />}
        {tab === "collection" && <Collection />}
        {tab === "profile" && <Profile />}
      </div>
    </main>
  );
}
