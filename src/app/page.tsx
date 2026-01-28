"use client";

import { useCallback, useMemo, useState } from "react";
import TopTabs from "@/components/layout/TopTabs";

import Hero from "@/components/sections/Hero";
import Gallery from "@/components/sections/Gallery";
import Profile from "@/components/sections/Profile";
import Collection from "@/components/sections/Collection";

import GlassCard from "@/components/layout/GlassCard";
import { gallery } from "@/data/gallery";

type TabKey = "home" | "gallery" | "collection" | "profile";

export default function Page() {
  const [tab, setTab] = useState<TabKey>("home");
  const onChange = useCallback((t: TabKey) => setTab(t), []);

  const galleryPreview = useMemo(() => gallery.slice(0, 4), []);

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
                  <GlassCard key={item.id} className="p-0 overflow-hidden">
                    <div className="relative h-[200px] w-full overflow-hidden rounded-2xl">
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
                <button
                  type="button"
                  onClick={() => setTab("collection")}
                  className="text-sm text-white/60 hover:text-white"
                >
                  전체 보기 →
                </button>
              </div>

              <div className="mt-4">
                <GlassCard className="p-6">
                  <div className="text-sm text-white/60">TIP</div>
                  <div className="mt-2 text-lg font-semibold">수집중 → 수집완료로 옮기면서 내 굿즈 아카이브를 쌓자</div>
                  <div className="mt-3 text-sm text-white/60">
                    원가/중고가를 (선택)으로 기록해두면, 나중에 판매 기능 붙일 때 바로 자산/거래 데이터로 이어짐.
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab("collection")}
                    className="mt-5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                  >
                    수집 보러가기
                  </button>
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
                  <div className="mt-2 text-lg font-semibold">좋아하는 포인트 / 취향 태그를 정리해두면 기록이 더 재밌어짐</div>
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
