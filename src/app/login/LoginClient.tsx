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
  const next = useMemo(
    () => searchParams.get("next") || "/?tab=collection",
    [searchParams]
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    (async () => {
      if (force === "1") return;
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace(next);
    })();
  }, [force, next, router]);

  function normalizeEmail(v: string) {
    return v.trim().toLowerCase();
  }

  function humanizeAuthError(e: any) {
    const m = (e?.message ?? "").toLowerCase();
    if (m.includes("rate limit"))
      return "메일 발송 한도에 걸렸어. 잠깐 뒤에 다시 시도해줘.";
    if (m.includes("invalid email"))
      return "이메일 형식이 이상해. 다시 확인해줘.";
    if (m.includes("failed to fetch"))
      return "네트워크 문제야. 인터넷 연결 확인해줘.";
    return e?.message ?? "OTP 발송 실패";
  }

  async function sendOtp() {
    try {
      setMsg(null);
      const v = normalizeEmail(email);
      if (!v) return setMsg("이메일을 입력해줘.");

      if (loading || cooldown > 0) return;
      setLoading(true);

      const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(
        next
      )}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: v,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) throw error;

      setSent(true);
      setCooldown(60);
      setMsg("메일 보냈어. 받은 메일에서 링크를 눌러줘.");
    } catch (e: any) {
      setMsg(humanizeAuthError(e));
      if ((e?.message ?? "").toLowerCase().includes("rate limit"))
        setCooldown(5 * 60);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setMsg("로그아웃 완료.");
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-white">로그인 (OTP)</h1>
      <p className="mt-2 text-sm text-white/60">
        이메일로 로그인 링크를 보내줄게.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
        />

        <button
          onClick={sendOtp}
          disabled={loading || cooldown > 0}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3"
        >
          {loading
            ? "보내는 중..."
            : cooldown > 0
            ? `다시 보내기 (${cooldown}s)`
            : sent
            ? "다시 보내기"
            : "로그인 링크 보내기"}
        </button>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={logout} className="btn-secondary">
            로그아웃
          </button>
          <a href={next} className="btn-secondary">
            원래 페이지로
          </a>
        </div>

        {msg && <div className="mt-4 text-sm text-white/80">{msg}</div>}
      </div>
    </main>
  );
}
