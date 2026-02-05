"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("로그인 처리 중…");

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        // ✅ magic link / OTP: code가 있으면 교환
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // 교환 후 세션 확인
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session) {
          setMsg("로그인 완료. 이동 중…");
          window.location.href = "/";
          return;
        }

        setMsg("세션이 확인되지 않아 홈으로 이동할게.");
        window.location.href = "/";
      } catch (e) {
        console.error(e);
        setMsg("로그인 처리 실패. 홈으로 이동할게.");
        window.location.href = "/";
      }
    })();
  }, []);

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80">
        {msg}
      </div>
    </main>
  );
}
