"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // ✅ /login?force=1 이면 자동 리다이렉트 막기
      const force = new URLSearchParams(window.location.search).get("force");
      if (force === "1") return;

      const { data } = await supabase.auth.getUser();
      if (data.user) {
        window.location.href = "/";
      }
    })();
  }, []);

  async function sendOtp() {
    try {
      setMsg(null);
      const v = email.trim();
      if (!v) {
        setMsg("이메일을 입력해줘.");
        return;
      }

      setLoading(true);

      const { error } = await supabase.auth.signInWithOtp({
        email: v,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setSent(true);
      setMsg("메일 보냈어. 받은 메일에서 링크를 눌러 로그인해줘.");
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message ?? "OTP 발송 실패");
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
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30 focus:border-white/20"
        />

        <button
          type="button"
          onClick={sendOtp}
          disabled={loading}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white hover:bg-white/15 disabled:opacity-60"
        >
          {loading ? "보내는 중..." : "로그인 링크 보내기"}
        </button>

        {sent && (
          <div className="mt-4 text-xs text-white/60">
            메일이 안 오면 스팸함도 확인해봐. (가끔 1~2분 걸릴 수 있음)
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={logout}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            로그아웃
          </button>
          <a
            href="/login?force=1"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            강제로 로그인 페이지 보기
          </a>
        </div>

        {msg && <div className="mt-4 text-sm text-white/80">{msg}</div>}
      </div>
    </main>
  );
}

