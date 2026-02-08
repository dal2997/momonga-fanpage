"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function OwnerManageButton({ ownerId }: { ownerId: string }) {
  const [isOwner, setIsOwner] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      if (!alive) return;
      setIsOwner(uid === ownerId);
      setChecked(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setIsOwner(uid === ownerId);
      setChecked(true);
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
        "text-white/85",
        // glass base
        "bg-white/[0.06] backdrop-blur-xl backdrop-saturate-150",
        // border + depth
        "border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
        // hover
        "transition will-change-transform",
        "hover:bg-white/[0.10] hover:border-white/20 hover:text-white",
        "hover:-translate-y-[1px] active:translate-y-0",
        // focus
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
      ].join(" ")}
    >
      {/* 하이라이트(유리 반사) */}
      <span
        aria-hidden
        className="
          pointer-events-none absolute inset-0 opacity-0 transition-opacity
          group-hover:opacity-100
        "
      >
        <span
          className="
            absolute -top-10 left-[-30%] h-24 w-[70%] rotate-12 rounded-full
            bg-white/20 blur-xl
          "
        />
        <span
          className="
            absolute inset-0
            bg-[radial-gradient(900px_220px_at_20%_-10%,rgba(255,255,255,0.18),transparent_55%)]
          "
        />
      </span>

      {/* 텍스트 */}
      <span className="relative">내 컬렉션 관리</span>

      {/* 미세한 chevron */}
      <span className="relative text-white/50 transition group-hover:translate-x-[1px] group-hover:text-white/70">
        →
      </span>
    </Link>
  );
}
