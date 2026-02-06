"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function RequireAuth({
  children,
  redirectTo = "/login",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    async function check() {
      // 1) 세션이 있으면 바로 통과 (가장 빠르고 안정적)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!alive) return;

      if (sessionData.session) {
        setReady(true);
        return;
      }

      // 2) 세션이 없으면 로그인으로 (원래 위치도 넘겨줌)
      const next = encodeURIComponent(pathname || "/");
      router.replace(`${redirectTo}?next=${next}`);
    }

    check();

    // 3) 인증 상태 변화도 감지해서, 중간 로그아웃/만료 대응
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;

      if (session) {
        setReady(true);
      } else {
        const next = encodeURIComponent(pathname || "/");
        router.replace(`${redirectTo}?next=${next}`);
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router, redirectTo, pathname]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-white/60">
        로그인 확인 중…
      </div>
    );
  }

  return <>{children}</>;
}
