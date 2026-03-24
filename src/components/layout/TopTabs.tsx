"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { PUBLIC_HANDLE } from "@/lib/config";

type TabKey = "home" | "gallery" | "collection" | "profile";

const TABS: { key: TabKey; label: string }[] = [
  { key: "home", label: "홈" },
  { key: "gallery", label: "순간" },
  { key: "collection", label: "수집" },
  { key: "profile", label: "프로필" },
];

export function AuthButtons() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingOffers, setPendingOffers] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      setUserId(data.user?.id ?? null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      setUserId(session?.user?.id ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // 미읽음 오퍼 카운트 (30초 폴링)
  useEffect(() => {
    if (!userId) { setPendingOffers(0); return; }

    async function fetchCount() {
      const { count } = await supabase
        .from("offers")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId!)
        .eq("status", "pending");
      setPendingOffers(count ?? 0);
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [userId]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

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
      <span className="hidden max-w-[180px] truncate text-xs text-zinc-700 dark:text-white/60 sm:inline">
        {email}
      </span>

      {/* 제안 알림 버튼 */}
      <a href="/my/offers" className={`relative ${pill}`}>
        📬
        {pendingOffers > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">
            {pendingOffers > 9 ? "9+" : pendingOffers}
          </span>
        )}
      </a>

      <button type="button" onClick={logout} className={pill}>
        로그아웃
      </button>
    </div>
  );
}

export default function TopTabs({
  value,
  onChange,
  todayVisits = 0,
}: {
  value: TabKey;
  onChange: (t: TabKey) => void;
  todayVisits?: number;
}) {
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isBrowse = pathname === "/browse";

  // char 파라미터를 유지한 채로 공개 수집 페이지로 이동
  const publicCollectionHref = `/u/${encodeURIComponent(PUBLIC_HANDLE)}?char=${searchParams.get("char") ?? "momonga"}`;

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
        suppressHydrationWarning
        className="
          pointer-events-none absolute inset-0 border-b
          border-pink-200/30 bg-white/60 backdrop-blur-2xl backdrop-saturate-200
          dark:border-white/[0.08] dark:bg-black/35
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
          pointer-events-none absolute inset-0 opacity-70
          bg-[radial-gradient(900px_260px_at_20%_-40%,rgba(255,210,225,0.60),transparent_60%)]
          dark:opacity-80
          dark:bg-[radial-gradient(900px_260px_at_20%_-40%,rgba(255,140,180,0.18),transparent_60%)]
        "
      />

      <div className="relative mx-auto flex h-16 max-w-6xl items-center px-5">
        {/* LEFT: 로고 + 방문자 배지 */}
        <div className="z-10 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleTabClick("home")}
            className="
              text-sm font-semibold tracking-wide transition
              text-zinc-900 hover:text-zinc-950
              dark:text-white/90 dark:hover:text-white
            "
            aria-label="Go Home"
          >
            MOMONGA
          </button>

          <span className={[
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
            "border-pink-300/40 bg-pink-400/10 text-pink-700/80",
            "dark:border-pink-400/25 dark:bg-pink-400/[0.12] dark:text-pink-300/70",
            "backdrop-blur-sm transition-opacity",
            todayVisits > 0 ? "opacity-100" : "opacity-0 pointer-events-none",
          ].join(" ")}>
            👀 {todayVisits > 0 ? todayVisits.toLocaleString() : ""}
          </span>
        </div>

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
              const active = !isBrowse && value === t.key;

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

            {/* 탐색 — 별도 페이지 링크 */}
            <Link
              href="/browse"
              className={[
                "relative rounded-full px-4 py-2 text-sm transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/15 dark:focus-visible:ring-white/20",
                isBrowse
                  ? "bg-black/[0.08] text-zinc-900 dark:bg-white/[0.12] dark:text-white shadow-[0_10px_30px_rgba(0,0,0,0.10)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.45)]"
                  : "text-zinc-700 hover:bg-black/[0.06] hover:text-zinc-900 dark:text-white/65 dark:hover:bg-white/[0.10] dark:hover:text-white/85",
              ].join(" ")}
            >
              탐색
            </Link>
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
