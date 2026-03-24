// src/app/redeem/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  is_approved: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  approved_at: string | null;
  is_admin: boolean;
};

export default function RedeemPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadProfile() {
    setLoading(true);
    setErr(null);

    try {
      const { data: u, error: ue } = await supabase.auth.getUser();
      if (ue) throw ue;

      const uid = u.user?.id;
      if (!uid) {
        router.push("/login?next=/redeem");
        return;
      }

      // ✅ approved_at/ban_reason까지 같이 가져와야 아래 UI가 제대로 돈다
      const { data, error: qErr } = await supabase
        .from("profiles")
        .select("id,is_approved,is_banned,ban_reason,approved_at,is_admin")
        .eq("id", uid)
        .maybeSingle();

      if (qErr) throw qErr;

      // data가 null이어도 여기서 끝내지 말고, redeem 폼을 보여줘야 함
      setProfile((data as any) ?? null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setSubmitting(true);

    try {
      const { data: u, error: ue } = await supabase.auth.getUser();
      if (ue) throw ue;
      if (!u.user) {
        router.push("/login?next=/redeem");
        return;
      }

      // ✅ 핵심: redeem RPC 호출
      const { error } = await supabase.rpc("redeem_profile", { p_code: code.trim() });
      if (error) throw error;

      setMsg("승인 완료! 이제 수집 기능을 사용할 수 있어요.");
      await loadProfile(); // 상태 갱신
      setTimeout(() => router.push("/?tab=collection"), 600);
    } catch (e: any) {
      setErr(e?.message ?? "redeem failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-6 text-sm">확인 중…</div>;
  if (err) return <div className="p-6 text-sm text-red-400">에러: {err}</div>;

  // ✅ 프로필이 있든 없든, banned만 아니면 redeem 폼은 떠야 한다.
  if (profile?.is_banned) {
    return (
      <div className="p-6 space-y-3">
        <h1 className="text-xl font-semibold">계정이 제한됐어요</h1>
        <div className="text-sm text-white/70">
          사유: {profile.ban_reason ?? "사유 없음"}
        </div>
        <div className="text-xs text-white/50">문의가 필요하면 운영자에게 연락해줘.</div>
      </div>
    );
  }

  // ✅ 승인된 유저면 안내만
  if (profile?.is_approved) {
    return (
      <div className="p-6 space-y-3">
        <h1 className="text-xl font-semibold">승인 완료 ✅</h1>
        <div className="text-sm text-white/70">승인 시각: {profile.approved_at ?? "—"}</div>
        <button
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm"
          onClick={() => router.push("/?tab=collection")}
        >
          수집하러 가기
        </button>
      </div>
    );
  }

  // ✅ (프로필이 없거나) 미승인 유저: redeem 폼 보여주기
  return (
    <main className="mx-auto max-w-md px-5 pt-24">
      <h1 className="text-2xl font-semibold">Redeem</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-white/60">
        승인 코드를 입력하면 계정이 활성화됩니다.
        {profile ? "" : " (현재 profiles row가 없거나 보이지 않을 수 있어요. 그래도 승인 시도는 가능합니다.)"}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          className="w-full rounded-xl border px-4 py-3 bg-transparent"
          placeholder="예: MOMONGA-2026"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          disabled={submitting || !code.trim()}
          className="w-full rounded-xl px-4 py-3 border bg-black text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {submitting ? "처리 중..." : "승인 받기"}
        </button>
      </form>

      {msg && <div className="mt-4 text-sm text-emerald-400">{msg}</div>}
      {err && <div className="mt-4 text-sm text-red-400">에러: {err}</div>}
    </main>
  );
}
