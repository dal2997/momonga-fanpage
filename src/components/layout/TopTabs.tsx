"use client";

import { useEffect, useState } from "react";
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

  if (!email) {
    return (
      <a
        href="/login"
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
      >
        로그인
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/60">{email}</span>
      <button
        type="button"
        onClick={logout}
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
      >
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
  return (
    <header className="fixed inset-x-0 top-0 z-50">
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

        {/* RIGHT: 로그인/로그아웃 */}
        <div className="ml-auto">
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
