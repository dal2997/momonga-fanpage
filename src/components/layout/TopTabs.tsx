"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

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

  // ✅ 공통 pill 스타일 (라이트/다크 둘 다)
  const pill =
    "rounded-full border px-4 py-2 text-sm transition " +
    "border-black/10 bg-black/5 text-zinc-800 hover:bg-black/10 " +
    "dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10";

  if (!email) {
    return (
      <a href="/login" className={pill}>
        로그인
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[220px] truncate text-xs text-zinc-600 dark:text-white/60 sm:inline">
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
      // ✅ 수집: 로그아웃이면 공개 페이지로 보내기
      if (key === "collection" && !isAuthed) {
        window.location.href = publicCollectionHref;
        return;
      }

      // ✅ 프로필: 로그아웃이면 로그인으로 보내기
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
      {/* ✅ 헤더 배경(라이트/다크 분리) */}
      <div
        className="
          pointer-events-none absolute inset-0 border-b
          border-black/10 bg-white/55 backdrop-blur-xl
          dark:border-white/10 dark:bg-black/30
        "
      />

      <div className="relative mx-auto flex h-16 max-w-6xl items-center px-5">
        {/* LEFT: 로고 */}
        <button
          type="button"
          onClick={() => handleTabClick("home")}
          className="
            z-10 text-sm font-semibold tracking-wide transition
            text-zinc-900 hover:text-black
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
              border-black/10 bg-black/5
              dark:border-white/10 dark:bg-white/5
            "
          >
            {/* ✅ glass highlight 한 겹(밋밋함 제거) */}
            <div
              aria-hidden
              className="
                pointer-events-none absolute inset-0 rounded-full
                bg-[radial-gradient(600px_160px_at_20%_-30%,rgba(255,255,255,0.55),transparent_60%)]
                opacity-35
                dark:bg-[radial-gradient(600px_160px_at_20%_-30%,rgba(255,255,255,0.22),transparent_60%)]
                dark:opacity-60
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
                    active
                      ? "bg-black/10 text-zinc-900 dark:bg-white/10 dark:text-white"
                      : "text-zinc-600 hover:bg-black/10 hover:text-zinc-900 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white/80",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* RIGHT: 로그인/로그아웃 */}
        <div className="ml-auto">
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
