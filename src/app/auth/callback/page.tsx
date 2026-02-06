// src/app/auth/callback/page.tsx
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

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = useMemo(() => safeNextPath(sp.get("next")), [sp]);
  const [msg, setMsg] = useState("로그인 처리 중…");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // ✅ hash(#access_token...) / code(?code=...) 둘 다 처리 가능
        const { data, error } = await supabase.auth.getSessionFromUrl({
          storeSession: true,
        });

        if (!alive) return;

        if (error) {
          setMsg(`로그인 실패: ${error.message}`);
          // 실패 시 로그인으로 보내고 싶으면:
          router.replace(`/login?error=callback_failed&next=${encodeURIComponent(next)}`);
          return;
        }

        // 세션이 저장됐으면 원하는 페이지로
        if (data.session) {
          router.replace(next);
          return;
        }

        // 세션이 안 잡히면 로그인으로
        router.replace(`/login?error=no_session&next=${encodeURIComponent(next)}`);
      } catch (e: any) {
        if (!alive) return;
        router.replace(`/login?error=callback_exception&next=${encodeURIComponent(next)}`);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, next]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-white/60">
      {msg}
    </div>
  );
}
