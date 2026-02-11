"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function OwnerManageButton({ ownerId }: { ownerId: string }) {
  const [isOwner, setIsOwner] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;

    const apply = (uid: string | null) => {
      if (!alive) return;
      setIsOwner(uid === ownerId);
      setChecked(true);
    };

    // 1) 최초 체크
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          // 보통 세션 없으면 error 없이 user=null이지만,
          // 혹시 모를 케이스는 안전하게 "비소유자"로 처리
          apply(null);
          return;
        }
        apply(data.user?.id ?? null);
      } catch {
        apply(null);
      }
    })();

    // 2) auth 변화 반영
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // ✅ 언마운트 이후 setState 방지
      apply(session?.user?.id ?? null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [ownerId]);

  if (!checked) return null;
  if (!isOwner) return null;

  return (
    <Link
      href="/collection"
      className={[
        "group relative ml-2 inline-flex items-center gap-2 overflow-hidden rounded-full px-4 py-2 text-sm",

        // ✅ 라이트/다크 텍스트
        "text-zinc-800 hover:text-zinc-950 dark:text-white/85 dark:hover:text-white",

        // ✅ glass base (라이트는 살짝 어둡게 깔아야 유리 느낌이 살아남)
        "bg-black/[0.04] dark:bg-white/[0.06]",
        "backdrop-blur-xl backdrop-saturate-150",

        // ✅ border
        "border border-black/10 dark:border-white/10",

        // ✅ depth
        "shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",

        // hover
        "transition will-change-transform",
        "hover:bg-black/[0.06] hover:border-black/20 dark:hover:bg-white/[0.10] dark:hover:border-white/20",
        "hover:-translate-y-[1px] active:translate-y-0",

        // focus
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/15 dark:focus-visible:ring-white/30",
      ].join(" ")}
    >
      {/* ✅ 하이라이트(유리 반사) : 라이트/다크 분리 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
      >
        {/* 큰 번짐 */}
        <span
          className="
            absolute -top-10 left-[-30%] h-24 w-[70%] rotate-12 rounded-full blur-xl
            bg-white/25 dark:bg-white/20
          "
        />
        {/* 림 스펙큘러 */}
        <span
          className="
            absolute inset-0
            bg-[radial-gradient(900px_220px_at_20%_-10%,rgba(255,255,255,0.35),transparent_55%)]
            dark:bg-[radial-gradient(900px_220px_at_20%_-10%,rgba(255,255,255,0.18),transparent_55%)]
          "
        />
      </span>

      <span className="relative">내 컬렉션 관리</span>

      {/* ✅ chevron도 라이트/다크 대비 */}
      <span className="relative text-zinc-500 transition group-hover:translate-x-[1px] group-hover:text-zinc-700 dark:text-white/50 dark:group-hover:text-white/70">
        →
      </span>
    </Link>
  );
}
