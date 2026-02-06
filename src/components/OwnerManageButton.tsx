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

  // 깜빡임 방지: 체크되기 전엔 아무것도 안 보여줌
  if (!checked) return null;

  // 본인 아니면 버튼 숨김
  if (!isOwner) return null;

  return (
    <Link
      href="/collection"
      className="ml-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
    >
      내 컬렉션 관리
    </Link>
  );
}
