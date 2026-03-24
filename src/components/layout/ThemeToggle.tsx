"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // hydration 안전장치
  if (!mounted) {
    return (
      <button
        type="button"
        className={[
          "relative overflow-hidden rounded-full border px-4 py-2 text-sm",
          "border-black/10 bg-black/[0.04] text-zinc-900",
          "dark:border-white/10 dark:bg-white/[0.06] dark:text-white/85",
          "backdrop-blur-xl backdrop-saturate-150",
        ].join(" ")}
        aria-label="theme toggle"
      >
        테마
      </button>
    );
  }

  const current = (theme === "system" ? resolvedTheme : theme) ?? "light";
  const next = current === "dark" ? "light" : "dark";

  const pill = [
    "relative overflow-hidden rounded-full border px-4 py-2 text-sm transition",
    "border-black/10 bg-black/[0.04] text-zinc-900 hover:bg-black/[0.07]",
    "dark:border-white/10 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/[0.10]",
    "backdrop-blur-xl backdrop-saturate-150",
    "shadow-[0_16px_50px_rgba(0,0,0,0.10)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)]",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/15 dark:focus-visible:ring-white/20",
  ].join(" ");

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className={pill}
      aria-label="toggle theme"
      title={`현재: ${current} → ${next}`}
    >
      {/* glass highlight */}
      <span
        aria-hidden
        className="
          pointer-events-none absolute inset-0 opacity-50
          bg-[radial-gradient(700px_220px_at_20%_-30%,rgba(255,255,255,0.60),transparent_60%)]
          dark:opacity-70
          dark:bg-[radial-gradient(700px_220px_at_20%_-30%,rgba(255,255,255,0.20),transparent_60%)]
        "
      />
      {/* rim */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/12"
      />
      {/* inner shadow */}
      <span
        aria-hidden
        className="
          pointer-events-none absolute inset-0
          [box-shadow:inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-18px_40px_rgba(0,0,0,0.08)]
          dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-26px_55px_rgba(0,0,0,0.30)]
        "
      />

      <span className="relative">
        {current === "dark" ? "☾ 다크" : "☀ 라이트"}
      </span>
    </button>
  );
}
