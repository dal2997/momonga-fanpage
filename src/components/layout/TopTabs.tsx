"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import ThemeToggle from "@/components/layout/ThemeToggle";

type TabKey = "home" | "gallery" | "collection" | "profile";

const TABS: { key: TabKey; label: string }[] = [
  { key: "home", label: "홈" },
  { key: "gallery", label: "순간" },
  { key: "collection", label: "수집" },
  { key: "profile", label: "프로필" },
];

export function AuthButtons() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  // ✅ 라이트 기본: zinc, 다크: white
  const pill =
    "rounded-full border px-4 py-2 text-sm transition " +
    "border-black/10 bg-black/[0.04] text-zinc-900 hover:bg-black/[0.07] " +
    "dark:border-white/10 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/[0.10]";

  if (!email) {
    return (
      <a href="/login" className={pill}>
        로그인
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[220px] truncate text-xs text-zinc-700 dark:text-white/60 sm:inline">
        {email}
      </span>
      <button type="button" onClick={logout} className={pill}>
        로그아웃
      </button>
    </div>
  );
}

export default function TopTabs({
  value,
  onChange,
}: {
  value: TabKey;
  onChange: (t: TabKey) => void;
}) {
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  // ✅ 여기만 바꾸면 공개 수집 주인 변경 가능
  const publicHandle = "dal2997";
  const publicCollectionHref = `/u/${encodeURIComponent(publicHandle)}`;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthed(!!data.user);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleTabClick = useCallback(
    (key: TabKey) => {
      if (key === "collection" && !isAuthed) {
        window.location.href = publicCollectionHref;
        return;
      }
      if (key === "profile" && !isAuthed) {
        window.location.href = "/login";
        return;
      }
      onChange(key);
    },
    [isAuthed, onChange, publicCollectionHref]
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* ✅ 헤더 유리 레이어 (flat 방지: rim + inner shadow + highlight) */}
      <div
        className="
          pointer-events-none absolute inset-0 border-b
          border-black/10 bg-white/55 backdrop-blur-xl
          dark:border-white/10 dark:bg-black/30
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0
          [box-shadow:inset_0_1px_0_rgba(255,255,255,0.40),inset_0_-20px_50px_rgba(0,0,0,0.06)]
          dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-30px_70px_rgba(0,0,0,0.35)]
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0 opacity-60
          bg-[radial-gradient(900px_260px_at_20%_-40%,rgba(255,255,255,0.55),transparent_60%)]
          dark:opacity-70
          dark:bg-[radial-gradient(900px_260px_at_20%_-40%,rgba(255,255,255,0.18),transparent_60%)]
        "
      />

      <div className="relative mx-auto flex h-16 max-w-6xl items-center px-5">
        {/* LEFT: 로고 */}
        <button
          type="button"
          onClick={() => handleTabClick("home")}
          className="
            z-10 text-sm font-semibold tracking-wide transition
            text-zinc-900 hover:text-zinc-950
            dark:text-white/90 dark:hover:text-white
          "
          aria-label="Go Home"
        >
          MOMONGA
        </button>

        {/* CENTER: 탭 */}
        <nav className="absolute left-1/2 -translate-x-1/2">
          <div
            className="
              relative inline-flex items-center gap-1 rounded-full border p-1 backdrop-blur
              border-black/10 bg-black/[0.04]
              dark:border-white/10 dark:bg-white/[0.06]
              shadow-[0_18px_60px_rgba(0,0,0,0.10)]
              dark:shadow-[0_22px_80px_rgba(0,0,0,0.45)]
            "
          >
            {/* ✅ glass highlight 한 겹 */}
            <div
              aria-hidden
              className="
                pointer-events-none absolute inset-0 rounded-full
                bg-[radial-gradient(600px_160px_at_20%_-30%,rgba(255,255,255,0.65),transparent_60%)]
                opacity-35
                dark:bg-[radial-gradient(600px_160px_at_20%_-30%,rgba(255,255,255,0.22),transparent_60%)]
                dark:opacity-70
              "
            />
            {/* ✅ rim */}
            <div
              aria-hidden
              className="
                pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset
                ring-black/5 dark:ring-white/12
              "
            />

            {TABS.map((t) => {
              const active = value === t.key;

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleTabClick(t.key)}
                  className={[
                    "relative rounded-full px-4 py-2 text-sm transition",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/15 dark:focus-visible:ring-white/20",
                    active
                      ? [
                          "bg-black/[0.08] text-zinc-900",
                          "dark:bg-white/[0.12] dark:text-white",
                          "shadow-[0_10px_30px_rgba(0,0,0,0.10)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.45)]",
                        ].join(" ")
                      : [
                          "text-zinc-700 hover:bg-black/[0.06] hover:text-zinc-900",
                          "dark:text-white/65 dark:hover:bg-white/[0.10] dark:hover:text-white/85",
                        ].join(" "),
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* RIGHT: 테마 토글 + 로그인/로그아웃 */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
