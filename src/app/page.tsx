"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import TopTabs from "@/components/layout/TopTabs";

import Hero from "@/components/sections/Hero";
import Gallery from "@/components/sections/Gallery";
import Profile from "@/components/sections/Profile";
import Collection from "@/components/sections/Collection";

import GlassCard from "@/components/layout/GlassCard";
import { gallery } from "@/data/gallery";
import { supabase } from "@/lib/supabase/client";

type TabKey = "home" | "gallery" | "collection" | "profile";

type CollectionRow = {
  id: string;
  owner_id: string;
  title: string | null;
  image: string | null;
  my_image: string | null;
  status: "collecting" | "collected";
  original_price: number | null;
  created_at: string;
};

export default function Page() {
  const [tab, setTab] = useState<TabKey>("home");
  const onChange = useCallback((t: TabKey) => setTab(t), []);

  const galleryPreview = useMemo(() => gallery.slice(0, 4), []);

  // ✅ 여기만 바꿔서 나중에 핸들/경로 바뀌어도 한 군데만 수정
  const publicHandle = "dal2997";
  const publicCollectionHref = `/u/${encodeURIComponent(publicHandle)}`;

  // ✅ 수집 미리보기 데이터
  const [collectPreview, setCollectPreview] = useState<CollectionRow[]>([]);
  const [collectLoading, setCollectLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      setCollectLoading(true);

      // 1) handle -> profile.id 조회
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("id, is_public")
        .eq("handle", publicHandle)
        .maybeSingle<{ id: string; is_public: boolean }>();

      if (!alive) return;
      if (pErr || !profile || !profile.is_public) {
        setCollectPreview([]);
        setCollectLoading(false);
        return;
      }

      // 2) 공개 컬렉션 4개 뽑기
      const { data: rows, error: cErr } = await supabase
        .from("collections")
        .select("id, owner_id, title, image, my_image, status, original_price, created_at")
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(4)
        .returns<CollectionRow[]>();

      if (!alive) return;
      if (cErr) {
        console.error("collect preview fetch error:", cErr);
        setCollectPreview([]);
      } else {
        setCollectPreview(rows ?? []);
      }

      setCollectLoading(false);
    }

    run();
    return () => {
      alive = false;
    };
  }, [publicHandle]);

  function pickThumb(item: CollectionRow) {
    // 수집완료면 내사진(my_image)을 우선, 없으면 상품이미지(image)
    if (item.status === "collected") return item.my_image || item.image;
    return item.image || item.my_image;
  }

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
                <h2 className="text-2xl font-semibold">순간 미리보기</h2>
                <button
                  type="button"
                  onClick={() => setTab("gallery")}
                  className="text-sm text-white/60 hover:text-white"
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
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
                          {item.tag}
                        </div>
                        <div className="mt-3 text-lg font-semibold">{item.title}</div>
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
                <h2 className="text-2xl font-semibold">수집 미리보기</h2>

                <Link
                  href={publicCollectionHref}
                  className="text-sm text-white/60 hover:text-white"
                >
                  모몽가 수집(공개) →
                </Link>
              </div>

              {/* ✅ 미리보기 그리드 */}
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {collectLoading ? (
                  <GlassCard className="p-6 text-white/60 md:col-span-2">
                    불러오는 중…
                  </GlassCard>
                ) : collectPreview.length === 0 ? (
                  <GlassCard className="p-6 text-white/60 md:col-span-2">
                    아직 공개 수집 카드가 없어.
                  </GlassCard>
                ) : (
                  collectPreview.map((it) => {
                    const thumb = pickThumb(it);
                    return (
                      <Link key={it.id} href={publicCollectionHref}>
                        <GlassCard className="overflow-hidden p-0 group">
                          <div className="relative h-[200px] w-full overflow-hidden rounded-2xl">
                            {thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={thumb}
                                alt={it.title ?? "item"}
                                className="block h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                              />
                            ) : (
                              <div className="grid h-full place-items-center text-white/40 bg-white/5">
                                이미지 없음
                              </div>
                            )}

                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/0" />
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                              <div className="text-xs text-white/70">
                                {it.status === "collecting" ? "수집중" : "수집완료"}
                              </div>
                              <div className="mt-1 text-lg font-semibold line-clamp-1">
                                {it.title ?? "제목 없음"}
                              </div>
                            </div>
                          </div>
                        </GlassCard>
                      </Link>
                    );
                  })
                )}
              </div>

              {/* ✅ 기존 TIP 카드도 유지 */}
              <div className="mt-6">
                <GlassCard className="p-6">
                  <div className="text-sm text-white/60">TIP</div>
                  <div className="mt-2 text-lg font-semibold">
                    수집중 → 수집완료로 옮기면서 내 굿즈 아카이브를 쌓자
                  </div>
                  <div className="mt-3 text-sm text-white/60">
                    원가/중고가를 (선택)으로 기록해두면, 나중에 판매 기능 붙일 때
                    바로 자산/거래 데이터로 이어짐.
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={publicCollectionHref}
                      className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/15"
                    >
                      모몽가 수집 보러가기(공개)
                    </Link>

                    <button
                      type="button"
                      onClick={() => setTab("collection")}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                    >
                      내 수집 관리(로그인)
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-white/45">
                    공개 페이지는 누구나 볼 수 있고, 수정/추가는 로그인한 본인만 가능해.
                  </div>
                </GlassCard>
              </div>
            </section>

            {/* 프로필 미리보기 */}
            <section className="scroll-mt-24">
              <div className="flex items-end justify-between">
                <h2 className="text-2xl font-semibold">프로필 미리보기</h2>
                <button
                  type="button"
                  onClick={() => setTab("profile")}
                  className="text-sm text-white/60 hover:text-white"
                >
                  전체 보기 →
                </button>
              </div>

              <div className="mt-4">
                <GlassCard className="p-6">
                  <div className="text-sm text-white/60">나의 덕질 상태</div>
                  <div className="mt-2 text-lg font-semibold">
                    좋아하는 포인트 / 취향 태그를 정리해두면 기록이 더 재밌어짐
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab("profile")}
                    className="mt-5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
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
