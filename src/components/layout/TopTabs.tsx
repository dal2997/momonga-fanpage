"use client";

import React from "react";

type TabKey = "home" | "gallery" | "collection" | "profile";

const TABS: { key: TabKey; label: string }[] = [
  { key: "home", label: "홈" },
  { key: "gallery", label: "순간" },
  { key: "collection", label: "수집" },
  { key: "profile", label: "프로필" },
];

export default function TopTabs({
  value,
  onChange,
}: {
  value: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* 상단 배경 */}
      <div className="pointer-events-none absolute inset-0 border-b border-white/10 bg-black/30 backdrop-blur-xl" />

      <div className="relative mx-auto flex h-16 max-w-6xl items-center px-5">
        {/* LEFT: 로고 */}
        <button
          type="button"
          onClick={() => onChange("home")}
          className="z-10 text-sm font-semibold tracking-wide text-white/90 hover:text-white"
          aria-label="Go Home"
        >
          MOMONGA
        </button>

        {/* CENTER: 탭 */}
        <nav className="absolute left-1/2 -translate-x-1/2">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur">
            {TABS.map((t) => {
              const active = value === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => onChange(t.key)}
                  className={[
                    "rounded-full px-4 py-2 text-sm transition",
                    active
                      ? "bg-white/12 text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white/80",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* RIGHT: (비워둠) 나중에 로그인/설정 자리 */}
        <div className="ml-auto w-[120px]" />
      </div>
    </header>
  );
}
