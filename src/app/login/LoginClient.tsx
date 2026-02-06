// src/app/login/LoginClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [cooldown, setCooldown] = useState(0);

  const force = searchParams.get("force");
  const next = useMemo(() => searchParams.get("next") || "/", [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    (async () => {
      if (force === "1") return;

      const { data, error } = await supabase.auth.getSession();
      if (error) return;
      if (data.session) router.replace(next);
    })();
  }, [force, next, router]);

  function normalizeEmail(v: string) {
    return v.trim().toLowerCase();
  }

  function humanizeAuthError(e: any) {
    const message = (e?.message ?? "").toLowerCase();
    if (message.includes("email rate limit exceeded")) {
      return "메일 발송 한도에 걸렸어. (현재 프로젝트 설정이 시간당 2회) 잠깐 뒤에 다시 시도해줘.";
    }
    if (message.includes("invalid email")) return "이메일 형식이 이상해. 다시 확인해줘.";
    if (message.includes("failed to fetch")) return "네트워크 문제로 실패했어. 인터넷 연결 확인하고 다시 시도해줘.";
    return e?.message ?? "OTP 발송 실패";
  }

  async function sendOtp() {
    try {
      setMsg(null);

      const v = normalizeEmail(email);
      if (!v) {
        setMsg("이메일을 입력해줘.");
        return;
      }

      if (loading) return;
      if (cooldown > 0) {
        setMsg(`잠깐만. ${cooldown}초 뒤에 다시 보낼 수 있어.`);
        return;
      }

      setLoading(true);

      // ✅ env 대신 현재 origin 기준으로 redirectTo 생성 (preview/localhost에서도 안 꼬임)
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: v,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;

      setSent(true);
      setCooldown(60);
      setMsg("메일 보냈어. 받은 메일에서 링크를 눌러 로그인해줘.");
    } catch (e: any) {
      console.error(e);
      setMsg(humanizeAuthError(e));
      const m = (e?.message ?? "").toLowerCase();
      if (m.includes("rate limit")) setCooldown(5 * 60);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setMsg("로그아웃 완료. 다시 시도해줘.");
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-white">로그인 (OTP)</h1>
      <p className="mt-2 text-sm text-white/60">
        이메일로 로그인 링크를 보내줄게. 링크 누르면 자동 로그인돼.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-sm text-white/70">이메일</div>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          inputMode="email"
          autoComplete="email"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30 focus:border-white/20"
        />

        <button
          type="button"
          onClick={sendOtp}
          disabled={loading || cooldown > 0}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white hover:bg-white/15 disabled:opacity-60"
        >
          {loading
            ? "보내는 중..."
            : cooldown > 0
            ? `다시 보내기 (${cooldown}s)`
            : sent
            ? "로그인 링크 다시 보내기"
            : "로그인 링크 보내기"}
        </button>

        {sent && (
          <div className="mt-4 space-y-1 text-xs text-white/60">
            <div>메일이 안 오면 스팸함도 확인해봐. (가끔 1~2분 걸릴 수 있음)</div>
            <div>
              ⚠️ 현재 Supabase Rate Limit이 <b>시간당 2회</b>라서 테스트 중엔 발송을 아껴야 해.
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={logout}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            로그아웃
          </button>

          <a
            href={`/login?force=1&next=${encodeURIComponent(next)}`}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            강제로 로그인 페이지 보기
          </a>

          <a
            href={next}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            원래 페이지로
          </a>
        </div>

        {msg && <div className="mt-4 text-sm text-white/80">{msg}</div>}
      </div>
    </main>
  );
}
