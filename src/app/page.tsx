"use client";

import { useCallback, useState } from "react";
import TopTabs from "@/components/layout/TopTabs";

import Hero from "@/components/sections/Hero";
import Gallery from "@/components/sections/Gallery";
import Profile from "@/components/sections/Profile";
import Collection from "@/components/sections/Collection";

type TabKey = "home" | "gallery" | "profile" | "collection";

export default function Page() {
  const [tab, setTab] = useState<TabKey>("home");

  const onChange = useCallback((t: TabKey) => setTab(t), []);

  return (
    <main className="relative">
      <TopTabs value={tab} onChange={onChange} />

      {/* 상단 탭 높이만큼 여백 */}
      <div className="mx-auto max-w-6xl px-5 pt-24 pb-24">
        {tab === "home" && (
          <div className="space-y-16">
            <Hero />
            {/* 홈에서도 순간/프로필 일부를 보여주고 싶으면 여기에 넣어도 됨 */}
          </div>
        )}

        {tab === "gallery" && (
          <div className="space-y-16">
            <Gallery />
          </div>
        )}

        {tab === "profile" && (
          <div className="space-y-16">
            <Profile />
          </div>
        )}

        {tab === "collection" && (
          <div className="space-y-16">
            <Collection />
          </div>
        )}
      </div>
    </main>
  );
}
