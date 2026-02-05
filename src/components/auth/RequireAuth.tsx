"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function RequireAuth({
  children,
  redirectTo = "/login",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = redirectTo;
        return;
      }
      setReady(true);
    })();
  }, [redirectTo]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-white/60">
        로그인 확인 중…
      </div>
    );
  }

  return <>{children}</>;
}
