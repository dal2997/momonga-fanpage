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

  // ✅ 쿨다운(초): 성공/에러(특히 rate limit) 시 재전송 연타 방지
  const [cooldown, setCooldown] = useState(0);

  const force = searchParams.get("force");
  const next = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams]
  );

  // ✅ 쿨다운 타이머 (1초씩 감소)
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // ✅ 1) 매직링크가 "#access_token=..." 형태로 오는 경우 처리
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

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      setLoading(false);

      if (error) {
        console.error("[login] setSession error:", error);
        setMsg("로그인 세션 설정 실패. 다시 시도해줘.");
        return;
      }

      // 해시/에러 파라미터 깔끔히 제거하고 next로 이동
      router.replace(next);
    })();
  }, [router, next]);

  // ✅ 2) 이미 로그인 돼 있으면 next로
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

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
          next
        )}`,
      },
    });

    setLoading(false);

    if (error) {
      console.error("[login] signInWithOtp error:", error);

      const m = (error.message || "").toLowerCase();

      // ✅ rate limit 안내 + 강제 쿨다운
      if (m.includes("rate limit")) {
        setMsg("요청이 많아 잠시 후 다시 시도해줘.");
        setCooldown(60);
        return;
      }

      setMsg(error.message);
      return;
    }

    // ✅ 성공해도 연타 방지용 쿨다운
    setSent(true);
    setCooldown(60);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-bold mb-2">로그인 (OTP)</h1>
      <p className="text-sm opacity-70 mb-6">
        이메일로 로그인 링크를 보내줄게. 링크 누르면 자동 로그인돼.
      </p>

      <div className="space-y-3">
        <input
          className="w-full rounded-md border border-white/10 bg-white/5 p-3"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          className="w-full rounded-md bg-white/10 p-3 disabled:opacity-50"
          disabled={loading || !email || cooldown > 0}
          onClick={sendLink}
        >
          {cooldown > 0
            ? `다시 보내기 (${cooldown}s)`
            : loading
            ? "처리중..."
            : "로그인 링크 보내기"}
        </button>

        <div className="flex gap-2">
          <button
            className="rounded-md bg-white/10 px-3 py-2"
            onClick={logout}
          >
            로그아웃
          </button>

          <button
            className="rounded-md bg-white/10 px-3 py-2"
            onClick={() =>
              router.replace(
                `/login?force=1&next=${encodeURIComponent(next)}`
              )
            }
          >
            강제로 로그인 페이지 보기
          </button>

          <button
            className="rounded-md bg-white/10 px-3 py-2"
            onClick={() => router.replace(next)}
          >
            원래 페이지로
          </button>
        </div>

        {sent && (
          <div className="text-sm opacity-80">
            메일 보냈어. 받은 메일 링크 눌러봐.
          </div>
        )}
        {msg && <div className="text-sm text-red-400">{msg}</div>}
      </div>
    </div>
  );
}
