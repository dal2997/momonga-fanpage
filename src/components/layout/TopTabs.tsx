"use client";

import { useEffect, useMemo, useState } from "react";

type TabKey = "home" | "gallery" | "profile" | "collection";

const TABS: { key: TabKey; label: string }[] = [
  { key: "home", label: "홈" },
  { key: "gallery", label: "순간" },
  { key: "profile", label: "프로필" },
  { key: "collection", label: "수집" },
];

export default function TopTabs({
  value,
  onChange,
}: {
  value: TabKey;
  onChange: (key: TabKey) => void;
}) {
  const [mounted, setMounted] = useState(false);

  // hash <-> tab 동기화 (배포 링크에서 #collection 같은 것도 가능)
  useEffect(() => {
    setMounted(true);

    const fromHash = () => {
      const h = window.location.hash.replace("#", "");
      const ok = TABS.some((t) => t.key === h);
      if (ok) onChange(h as TabKey);
    };

    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [onChange]);

  const activeIndex = useMemo(() => TABS.findIndex((t) => t.key === value), [value]);

  return (
    <div className="fixed left-0 right-0 top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="text-sm font-semibold tracking-wide text-white/90">MOMONGA</div>

        <div className="relative rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur">
          {/* 슬라이딩 배경 */}
          {mounted && (
            <div
              className="absolute top-1 h-[34px] rounded-full bg-white/10 transition-all duration-250"
              style={{
                left: `calc(${activeIndex} * 72px + 4px)`,
                width: "68px",
              }}
            />
          )}

          <div className="relative flex">
            {TABS.map((tab) => {
              const active = tab.key === value;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={[
                    "h-[34px] w-[72px] rounded-full text-xs transition-colors",
                    active ? "text-white" : "text-white/70 hover:text-white/90",
                  ].join(" ")}
                  onClick={() => {
                    onChange(tab.key);
                    // 해시도 바꿔서 링크 공유 가능
                    window.location.hash = tab.key;
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 상단 얇은 그라데이션 */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
