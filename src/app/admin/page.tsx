"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function RedeemPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?next=/redeem");
        return;
      }

      const { data, error } = await supabase.rpc("redeem_profile", {
        p_code: code.trim(),
      });
      if (error) throw error;

      if (!data?.ok) {
        throw new Error("redeem failed");
      }

      setMsg("승인 완료! 이제 수집 기능을 사용할 수 있어요.");
      setTimeout(() => router.push("/?tab=collection"), 600);
    } catch (err: any) {
      setMsg(err?.message ?? "redeem failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 pt-24">
      <h1 className="text-2xl font-semibold">Redeem</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-white/60">
        승인 코드를 입력하면 계정이 활성화됩니다.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          className="w-full rounded-xl border px-4 py-3 bg-transparent"
          placeholder="예: MOMONGA-2026"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          disabled={loading || !code.trim()}
          className="w-full rounded-xl px-4 py-3 border bg-black text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {loading ? "처리 중..." : "승인 받기"}
        </button>
      </form>

      {msg && <div className="mt-4 text-sm">{msg}</div>}
    </main>
  );
}
