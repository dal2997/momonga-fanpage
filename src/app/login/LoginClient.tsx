"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function safeNextPath(next: string | null) {
  if (!next) return "/";
  const v = next.trim();
  if (!v.startsWith("/")) return "/";
  if (v.startsWith("//")) return "/";
  if (v.startsWith("/auth/callback")) return "/";
  return v;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const force = searchParams.get("force");
  const next = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams]
  );

  // 쿨다운 타이머
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // 매직링크 hash 처리
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash?.replace(/^#/, "");
    if (!hash) return;
    const p = new URLSearchParams(hash);
    const access_token = p.get("access_token");
    const refresh_token = p.get("refresh_token");
    if (!access_token || !refresh_token) return;

    (async () => {
      setLoading(true);
      setMsg(null);
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      setLoading(false);
      if (error) {
        setMsg("로그인 세션 설정 실패. 다시 시도해줘.");
        return;
      }
      router.replace(next);
    })();
  }, [router, next]);

  // 이미 로그인 돼 있으면 next로
  useEffect(() => {
    if (force === "1") return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next);
    });
  }, [router, next, force]);

  async function sendLink() {
    if (cooldown > 0) return;
    setLoading(true);
    setMsg(null);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    setLoading(false);

    if (error) {
      const m = (error.message || "").toLowerCase();
      if (m.includes("rate limit")) {
        setMsg("요청이 많아 잠시 후 다시 시도해줘.");
        setCooldown(60);
        return;
      }
      setMsg(error.message);
      return;
    }

    setSent(true);
    setCooldown(60);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* 로고 */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-3">
            <img src="/logo-momonga-light.svg" alt="모몽가" className="block h-14 w-auto dark:hidden" />
            <img src="/logo-momonga-dark.svg"  alt="모몽가" className="hidden h-14 w-auto dark:block" />
          </div>
          <p className="mt-2 text-sm text-zinc-500 dark:text-white/45">
            이메일로 로그인 링크를 보내줄게
          </p>
        </div>

        {/* 카드 */}
        <div className="rounded-3xl border border-black/10 bg-white/70 p-7 shadow-[0_8px_40px_rgba(0,0,0,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)]">

          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📬</div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                메일 보냈어!
              </p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-white/50">
                <span className="font-medium text-zinc-700 dark:text-white/70">{email}</span>
                <br />
                받은 편지함에서 링크 눌러줘.
              </p>
              <p className="mt-4 text-xs text-zinc-400 dark:text-white/30">
                안 보이면 스팸함도 확인해봐.
              </p>
              {cooldown > 0 && (
                <p className="mt-3 text-xs text-zinc-400 dark:text-white/30">
                  다시 보내기 가능까지 {cooldown}초
                </p>
              )}
              <button
                type="button"
                onClick={() => { setSent(false); setCooldown(0); setMsg(null); }}
                className="mt-5 text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-800 dark:text-white/40 dark:hover:text-white/70"
              >
                이메일 다시 입력
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && email) sendLink(); }}
                className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-black/20 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/25"
              />

              <button
                type="button"
                disabled={loading || !email.includes("@") || cooldown > 0}
                onClick={sendLink}
                className="w-full rounded-xl border border-black/15 bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white dark:text-zinc-900 dark:hover:bg-white/90"
              >
                {cooldown > 0
                  ? `다시 보내기 (${cooldown}s)`
                  : loading
                  ? "처리중…"
                  : "로그인 링크 받기"}
              </button>

              {msg && (
                <p className="text-sm text-red-600 dark:text-red-400">{msg}</p>
              )}
            </div>
          )}
        </div>

        {/* 홈 돌아가기 */}
        <div className="mt-5 text-center">
          <a
            href="/"
            className="text-sm text-zinc-400 hover:text-zinc-700 dark:text-white/30 dark:hover:text-white/60 transition"
          >
            ← 홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
