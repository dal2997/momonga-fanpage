"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import TopTabs from "@/components/layout/TopTabs";
import Hero from "@/components/sections/Hero";
import Gallery from "@/components/sections/Gallery";
import Profile from "@/components/sections/Profile";
import Collection from "@/components/sections/Collection";
import GlassCard from "@/components/layout/GlassCard";
import { gallery } from "@/data/gallery";

type TabKey = "home" | "gallery" | "collection" | "profile";

export default function HomeClient() {
  const searchParams = useSearchParams();

  /** ✅ URL 기준 초기 탭 */
  const initialTab = (searchParams.get("tab") as TabKey) ?? "home";
  const [tab, setTab] = useState<TabKey>(initialTab);

  const onChange = useCallback((t: TabKey) => setTab(t), []);
  const galleryPreview = useMemo(() => gallery.slice(0, 4), []);

  const publicHandle = "dal2997";
  const publicCollectionHref = `/u/${encodeURIComponent(publicHandle)}`;

  return (
    <main className="relative">
      <TopTabs value={tab} onChange={onChange} />

      <div className="mx-auto max-w-6xl px-5 pt-24 pb-24">
        {tab === "home" && (
          <div className="space-y-16">
            <Hero />

            {/* 순간 미리보기 */}
            <section>
              <div className="flex justify-between items-end">
                <h2 className="text-2xl font-semibold">순간 미리보기</h2>
                <button
                  onClick={() => setTab("gallery")}
                  className="text-sm text-white/60 hover:text-white"
                >
                  전체 보기 →
                </button>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {galleryPreview.map((item) => (
                  <GlassCard key={item.id} className="overflow-hidden p-0">
                    <div className="relative h-[200px]">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </GlassCard>
                ))}
              </div>
            </section>

            {/* 수집 미리보기 */}
            <section>
              <div className="flex justify-between items-end">
                <h2 className="text-2xl font-semibold">수집 미리보기</h2>
                <Link
                  href={publicCollectionHref}
                  className="text-sm text-white/60 hover:text-white"
                >
                  모몽가 수집(공개) →
                </Link>
              </div>

              <GlassCard className="mt-4 p-6">
                <div className="mt-5 flex gap-2">
                  <Link
                    href={publicCollectionHref}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm"
                  >
                    공개 수집 보기
                  </Link>

                  <button
                    onClick={() => setTab("collection")}
                    className="rounded-full bg-white/5 px-4 py-2 text-sm"
                  >
                    내 수집 관리
                  </button>
                </div>
              </GlassCard>
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
