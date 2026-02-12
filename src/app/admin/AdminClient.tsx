// src/app/admin/AdminClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  is_public: boolean;
  is_admin: boolean;
  is_approved: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  approved_at: string | null;
};

export default function AdminClient() {
  const router = useRouter();

  const [me, setMe] = useState<ProfileRow | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function loadMeAndGuard() {
    setLoadingMe(true);
    setErr(null);

    const { data: u, error: ue } = await supabase.auth.getUser();
    if (ue) {
      setErr(ue.message);
      setLoadingMe(false);
      return;
    }

    const uid = u.user?.id;
    if (!uid) {
      router.push("/login?next=/admin");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,handle,display_name,avatar_url,is_public,is_admin,is_approved,is_banned,ban_reason,approved_at"
      )
      .eq("id", uid)
      .maybeSingle();

    if (error) {
      setErr(error.message);
      setLoadingMe(false);
      return;
    }

    if (!data?.is_admin) {
      router.replace("/");
      return;
    }

    setMe(data as ProfileRow);
    setLoadingMe(false);
  }

  async function loadPending() {
    setLoadingList(true);
    setErr(null);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,handle,display_name,avatar_url,is_public,is_admin,is_approved,is_banned,ban_reason,approved_at"
      )
      .eq("is_approved", false)
      .eq("is_banned", false)
      .order("handle", { ascending: true });

    if (error) {
      setErr(error.message);
      setLoadingList(false);
      return;
    }

    setRows((data as ProfileRow[]) ?? []);
    setLoadingList(false);
  }

  useEffect(() => {
    (async () => {
      await loadMeAndGuard();
      await loadPending();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approveUser(userId: string) {
    setMsg(null);
    setErr(null);

    // 낙관적 UI
    setRows((prev) => prev.filter((r) => r.id !== userId));

    const { error } = await supabase
      .from("profiles")
      .update({
        is_approved: true,
        approved_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      setErr(error.message);
      await loadPending();
      return;
    }

    setMsg("승인 완료 ✅");
  }

  async function banUser(userId: string) {
    const reason = window.prompt("밴 사유(선택)");
    setMsg(null);
    setErr(null);

    setRows((prev) => prev.filter((r) => r.id !== userId));

    const { error } = await supabase
      .from("profiles")
      .update({
        is_banned: true,
        ban_reason: (reason ?? "").trim() || null,
      })
      .eq("id", userId);

    if (error) {
      setErr(error.message);
      await loadPending();
      return;
    }

    setMsg("밴 처리 완료 ✅");
  }

  async function issueCode(userId: string) {
    setMsg(null);
    setErr(null);

    try {
      const res = await fetch("/api/admin/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "issue", userId }),
      });

      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error ?? "issue failed");

      await navigator.clipboard.writeText(j.code);
      setMsg(`승인코드 발급됨 (클립보드 복사): ${j.code}`);
    } catch (e: any) {
      setErr(e?.message ?? "issue failed");
    }
  }

  async function sendCodeEmail(userId: string) {
    setMsg(null);
    setErr(null);

    try {
      const res = await fetch("/api/admin/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", userId }),
      });

      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error ?? "send failed");

      setMsg("메일 발송 완료 ✅");
    } catch (e: any) {
      setErr(e?.message ?? "send failed");
    }
  }

  const title = useMemo(() => {
    if (loadingMe) return "Admin";
    if (!me) return "Admin";
    return `Admin (${me.handle})`;
  }, [loadingMe, me]);

  if (loadingMe) return <div className="p-6 text-sm">관리자 확인 중…</div>;
  if (err) return <div className="p-6 text-sm text-red-400">에러: {err}</div>;
  if (!me) return <div className="p-6 text-sm">세션 없음</div>;

  return (
    <main className="mx-auto max-w-3xl px-5 pt-14 pb-20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-white/60">
            승인 대기 유저에게 1회용 승인코드를 발급/메일 발송하거나, 승인/밴 처리합니다.
          </p>
        </div>

        <button
          onClick={loadPending}
          className="rounded-full border border-black/10 bg-black/5 px-4 py-2 text-sm dark:border-white/10 dark:bg-white/10"
        >
          새로고침
        </button>
      </div>

      {msg && <div className="mt-4 text-sm text-emerald-400">{msg}</div>}
      {err && <div className="mt-4 text-sm text-red-400">에러: {err}</div>}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">승인 대기</h2>
          <div className="text-sm text-zinc-600 dark:text-white/60">
            {loadingList ? "불러오는 중…" : `${rows.length}명`}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {!loadingList && rows.length === 0 && (
            <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-sm dark:border-white/10 dark:bg-white/10">
              승인 대기 유저 없음
            </div>
          )}

          {rows.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {r.display_name ?? r.handle}{" "}
                    <span className="text-xs text-zinc-500 dark:text-white/50">
                      @{r.handle}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-white/50 break-all">
                    {r.id}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(r.id);
                      setMsg("UUID 복사됨");
                    }}
                    className="rounded-full border border-black/10 bg-black/5 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/10"
                  >
                    UUID 복사
                  </button>

                  <button
                    onClick={() => issueCode(r.id)}
                    className="rounded-full border border-black/10 bg-black/5 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/10"
                  >
                    코드 발급(복사)
                  </button>

                  <button
                    onClick={() => sendCodeEmail(r.id)}
                    className="rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-200"
                  >
                    메일 발송
                  </button>

                  <button
                    onClick={() => approveUser(r.id)}
                    className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-200"
                  >
                    승인
                  </button>

                  <button
                    onClick={() => banUser(r.id)}
                    className="rounded-full border border-red-500/30 bg-red-500/15 px-3 py-2 text-xs text-red-700 dark:text-red-200"
                  >
                    밴
                  </button>
                </div>
              </div>

              <div className="text-xs text-zinc-600 dark:text-white/60">
                공개: {r.is_public ? "ON" : "OFF"} · admin: {r.is_admin ? "YES" : "NO"}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}