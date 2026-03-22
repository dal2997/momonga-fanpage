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

type Tab = "pending" | "approved" | "banned";

const PROFILE_SELECT =
  "id,handle,display_name,avatar_url,is_public,is_admin,is_approved,is_banned,ban_reason,approved_at";

export default function AdminClient() {
  const router = useRouter();

  const [me, setMe] = useState<ProfileRow | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [tab, setTab] = useState<Tab>("pending");

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // 공지/알림 메일용 (승인된 유저 전체)
  const [noticeSubject, setNoticeSubject] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [sendingNotice, setSendingNotice] = useState(false);

  function clearFlash() {
    setMsg(null);
    setErr(null);
  }

  async function loadMeAndGuard() {
    setLoadingMe(true);
    clearFlash();

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
      .select(PROFILE_SELECT)
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

  async function loadList(nextTab: Tab = tab) {
    setLoadingList(true);
    clearFlash();

    let q = supabase.from("profiles").select(PROFILE_SELECT);

    if (nextTab === "pending") {
      q = q
        .eq("is_approved", false)
        .eq("is_banned", false)
        .order("handle", { ascending: true });
    } else if (nextTab === "approved") {
      // ✅ updated_at 같은 컬럼 쓰면 DB에 없어서 터질 수 있음
      q = q
        .eq("is_approved", true)
        .eq("is_banned", false)
        .order("approved_at", { ascending: false })
        .order("handle", { ascending: true });
    } else {
      q = q.eq("is_banned", true).order("handle", { ascending: true });
    }

    const { data, error } = await q;

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
      await loadList("pending");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approveUser(userId: string) {
    clearFlash();

    // 낙관적 UI
    setRows((prev) => prev.filter((r) => r.id !== userId));

    // ✅ 승인 + 승인메일(1회) 자동발송은 route.ts에서 처리하는 게 정답
    const resp = await fetch("/api/admin/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "approve", userId }),
    });

    const j = await resp.json().catch(() => null);

    if (!resp.ok || !j?.ok) {
      setErr(j?.error ?? `approve failed (${resp.status})`);
      await loadList();
      return;
    }

    setMsg("승인 완료 ✅ (승인메일은 1회 자동 발송)");
  }

  async function banUser(userId: string) {
    const reason = window.prompt("밴 사유(선택)") ?? "";
    clearFlash();

    setRows((prev) => prev.filter((r) => r.id !== userId));

    // ✅ 여기서도 DB 직접 update 말고 admin API로 보내는 게 안전 (RLS/권한/로그)
    const resp = await fetch("/api/admin/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "ban", userId, reason: reason.trim() || null }),
    });

    const j = await resp.json().catch(() => null);

    if (!resp.ok || !j?.ok) {
      setErr(j?.error ?? `ban failed (${resp.status})`);
      await loadList();
      return;
    }

    setMsg("밴 처리 완료 ✅");
  }

  async function unbanUser(userId: string) {
    clearFlash();

    setRows((prev) => prev.filter((r) => r.id !== userId));

    const resp = await fetch("/api/admin/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "unban", userId }),
    });

    const j = await resp.json().catch(() => null);

    if (!resp.ok || !j?.ok) {
      setErr(j?.error ?? `unban failed (${resp.status})`);
      await loadList();
      return;
    }

    setMsg("언밴 완료 ✅");
  }

  async function issueCode(userId: string) {
    clearFlash();

    const resp = await fetch("/api/admin/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "issue", userId }),
    });

    const j = await resp.json().catch(() => null);

    if (!resp.ok || !j?.ok) {
      setErr(j?.error ?? `issue failed (${resp.status})`);
      return;
    }

    const code = j.code as string;
    await navigator.clipboard.writeText(code);
    setMsg(`코드 발급/복사됨: ${code}`);
  }

  async function sendCodeMail(userId: string) {
    clearFlash();

    const resp = await fetch("/api/admin/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "send", userId }),
    });

    const j = await resp.json().catch(() => null);

    if (!resp.ok || !j?.ok) {
      setErr(j?.error ?? `send failed (${resp.status})`);
      return;
    }

    setMsg("메일 발송 완료 ✅");
  }

  async function sendNoticeToApproved() {
    if (!noticeSubject.trim() || !noticeBody.trim()) {
      setErr("공지 제목/내용을 입력해줘.");
      return;
    }

    const ok = window.confirm(
      "공지메일은 '승인된 유저 전체'에게 발송됩니다.\n(같은 유저가 여러 번 받을 수 있어요)\n진행할까요?"
    );
    if (!ok) return;

    setSendingNotice(true);
    clearFlash();

    const resp = await fetch("/api/admin/notice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        subject: noticeSubject.trim(),
        content: noticeBody.trim(), // ✅ route.ts가 content로 받게 맞춰두는 걸 추천
      }),
    });

    const j = await resp.json().catch(() => null);

    setSendingNotice(false);

    if (!resp.ok || !j?.ok) {
      setErr(j?.error ?? `notice failed (${resp.status})`);
      return;
    }

    setMsg(`공지메일 발송 완료 ✅ (대상 ${j.sent ?? "?"}명)`);
    setNoticeSubject("");
    setNoticeBody("");
  }

  const title = useMemo(() => {
    if (loadingMe) return "Admin";
    if (!me) return "Admin";
    return `Admin (${me.handle})`;
  }, [loadingMe, me]);

  if (loadingMe) return <div className="p-6 text-sm">관리자 확인 중…</div>;
  if (err) return <div className="p-6 text-sm text-red-400">에러: {err}</div>;
  if (!me) return <div className="p-6 text-sm">세션 없음</div>;

  const tabLabel = tab === "pending" ? "승인 대기" : tab === "approved" ? "승인됨" : "밴됨";

  return (
    <main className="mx-auto max-w-4xl px-5 pt-14 pb-20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-white/60">
            승인코드 발급/메일 발송, 승인/밴/언밴, 공지메일 발송
          </p>
        </div>

        <button
          onClick={() => loadList()}
          className="rounded-full border border-black/10 bg-black/5 px-4 py-2 text-sm dark:border-white/10 dark:bg-white/10"
        >
          새로고침
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["pending", "approved", "banned"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={async () => {
              setTab(t);
              await loadList(t);
            }}
            className={[
              "rounded-full border px-4 py-2 text-sm",
              t === tab
                ? "border-white/20 bg-white/15"
                : "border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/10",
            ].join(" ")}
          >
            {t === "pending" ? "승인 대기" : t === "approved" ? "승인됨" : "밴됨"}
          </button>
        ))}
      </div>

      {msg && <div className="mt-4 text-sm text-emerald-400">{msg}</div>}
      {err && <div className="mt-4 text-sm text-red-400">에러: {err}</div>}

      {/* 공지메일: 승인됨 탭에서만 노출 */}
      {tab === "approved" && (
        <section className="mt-8 rounded-2xl border border-black/10 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-semibold">공지/알림 메일 (승인된 유저 전체)</h2>
          <p className="mt-1 text-xs text-zinc-600 dark:text-white/60">
            승인된 유저에게 일괄 공지메일. (동일 유저가 여러 번 받을 수 있음)
          </p>

          <div className="mt-3 space-y-2">
            <input
              className="w-full rounded-xl border px-4 py-3 bg-transparent"
              placeholder="제목"
              value={noticeSubject}
              onChange={(e) => setNoticeSubject(e.target.value)}
            />
            <textarea
              className="w-full min-h-[120px] rounded-xl border px-4 py-3 bg-transparent"
              placeholder="내용"
              value={noticeBody}
              onChange={(e) => setNoticeBody(e.target.value)}
            />
            <button
              disabled={sendingNotice}
              onClick={sendNoticeToApproved}
              className="rounded-xl border bg-black px-4 py-3 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {sendingNotice ? "발송 중..." : "공지메일 발송"}
            </button>
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{tabLabel}</h2>
          <div className="text-sm text-zinc-600 dark:text-white/60">
            {loadingList ? "불러오는 중…" : `${rows.length}명`}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {!loadingList && rows.length === 0 && (
            <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-sm dark:border-white/10 dark:bg-white/10">
              목록 없음
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
                  {r.is_banned && (
                    <div className="mt-1 text-xs text-red-300/90">
                      밴 사유: {r.ban_reason ?? "—"}
                    </div>
                  )}
                  {r.is_approved && (
                    <div className="mt-1 text-xs text-emerald-300/90">
                      승인시각: {r.approved_at ?? "—"}
                    </div>
                  )}
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

                  {/* 승인대기 탭에서만 코드발급/메일/승인 */}
                  {tab === "pending" && (
                    <>
                      <button
                        onClick={() => issueCode(r.id)}
                        className="rounded-full border border-black/10 bg-black/5 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/10"
                      >
                        코드 발급(복사)
                      </button>
                      <button
                        onClick={() => sendCodeMail(r.id)}
                        className="rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-2 text-xs text-blue-700 dark:text-blue-200"
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
                    </>
                  )}

                  {/* 승인됨 탭: 밴 가능 */}
                  {tab === "approved" && (
                    <button
                      onClick={() => banUser(r.id)}
                      className="rounded-full border border-red-500/30 bg-red-500/15 px-3 py-2 text-xs text-red-700 dark:text-red-200"
                    >
                      밴
                    </button>
                  )}

                  {/* 밴됨 탭: 언밴 가능 */}
                  {tab === "banned" && (
                    <button
                      onClick={() => unbanUser(r.id)}
                      className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-200"
                    >
                      언밴
                    </button>
                  )}
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
