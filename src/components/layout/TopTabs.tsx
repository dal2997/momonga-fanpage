"use client";

import { useEffect, useMemo, useState } from "react";

const tabs = [
  { id: "hero", label: "홈" },
  { id: "gallery", label: "갤러리" },
  { id: "profile", label: "프로필" },
];

export default function TopTabs() {
  const [active, setActive] = useState("hero");

  const ids = useMemo(() => tabs.map((t) => t.id), []);

  useEffect(() => {
    const handler = () => {
      // 가장 위에 가까운 섹션을 active로
      let current = "hero";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= 140) current = id;
      }
      setActive(current);
    };

    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [ids]);

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-3">
        <div className="mr-4 text-sm font-semibold tracking-wide">MOMONGA</div>

        <nav className="flex gap-2">
          {tabs.map((t) => {
            const isActive = active === t.id;
            return (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={[
                  "rounded-full border px-4 py-1 text-sm transition",
                  isActive
                    ? "border-white/30 bg-white/25"
                    : "border-white/10 bg-white/10 hover:bg-white/20",
                ].join(" ")}
              >
                {t.label}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
