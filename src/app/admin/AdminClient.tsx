"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Row = {
  id: string;
  handle: string | null;
  display_name: string | null;
  is_public: boolean;
  created_at: string;
  is_admin: boolean;
  is_approved: boolean;
  is_banned: boolean;
  approved_at: string | null;
  banned_at: string | null;
  ban_reason: string | null;
};

export default function AdminClient() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase.rpc("admin_list_profiles");
    if (error) {
      setErr(error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function approve(id: string, v: boolean) {
    const { error } = await supabase.rpc("admin_set_approval", {
      target_id: id,
      approve: v,
    });
    if (error) return alert(error.message);
    await reload();
  }

  async function ban(id: string, v: boolean) {
    const reason = v ? prompt("밴 사유(선택)") ?? null : null;
    const { error } = await supabase.rpc("admin_set_ban", {
      target_id: id,
      ban: v,
      reason,
    });
    if (error) return alert(error.message);
    await reload();
  }

  if (loading) return <div className="p-6 text-sm">불러오는 중…</div>;
  if (err)
    return (
      <div className="p-6 space-y-3">
        <div className="text-sm text-red-400">에러: {err}</div>
        <div className="text-xs text-white/50">
          admin 계정이 아니면 여기서 막히는 게 정상임.
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <div className="text-sm text-white/60">승인 / 밴 관리</div>
        </div>
        <button
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm"
          onClick={reload}
        >
          새로고침
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-semibold">
                  {r.display_name ?? "(no name)"}{" "}
                  <span className="text-white/40">@{r.handle ?? "—"}</span>
                </div>
                <div className="text-xs text-white/50">
                  {r.id} · created {new Date(r.created_at).toLocaleString()}
                </div>
                <div className="text-xs text-white/60">
                  approved: {String(r.is_approved)} / banned: {String(r.is_banned)} / admin:{" "}
                  {String(r.is_admin)}
                </div>
              </div>

              <div className="flex gap-2">
                {r.is_approved ? (
                  <button
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm"
                    onClick={() => approve(r.id, false)}
                  >
                    승인 해제
                  </button>
                ) : (
                  <button
                    className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm"
                    onClick={() => approve(r.id, true)}
                  >
                    승인
                  </button>
                )}

                {r.is_banned ? (
                  <button
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm"
                    onClick={() => ban(r.id, false)}
                  >
                    밴 해제
                  </button>
                ) : (
                  <button
                    className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-100"
                    onClick={() => ban(r.id, true)}
                  >
                    밴
                  </button>
                )}
              </div>
            </div>

            {r.ban_reason ? (
              <div className="mt-2 text-xs text-red-200/80">
                ban_reason: {r.ban_reason}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
