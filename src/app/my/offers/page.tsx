"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type OfferRow = {
  id: string;
  amount: number;
  message: string | null;
  status: string;
  created_at: string;
  collection_id: string;
  collections: {
    title: string | null;
    image: string | null;
  } | null;
  from_profile: {
    handle: string;
    display_name: string | null;
  } | null;
};

function formatPrice(n: number) {
  return `${n.toLocaleString()}원`;
}

type BadgeInfo = { text: string; cls: string };

function statusLabel(s: string): BadgeInfo {
  if (s === "accepted")  return { text: "수락됨",   cls: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-300 dark:border-green-400/20 dark:bg-green-400/10" };
  if (s === "rejected")  return { text: "거절됨",   cls: "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-300 dark:border-red-400/20 dark:bg-red-400/10" };
  if (s === "completed") return { text: "거래완료", cls: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300 dark:border-blue-400/20 dark:bg-blue-400/10" };
  return { text: "대기중", cls: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300 dark:border-amber-400/20 dark:bg-amber-400/10" };
}

export default function MyOffersPage() {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null); // offer id

  async function load(uid: string) {
    const { data, error } = await supabase
      .from("offers")
      .select(
        `id, amount, message, status, created_at, collection_id,
         collections(title, image),
         from_profile:profiles!offers_from_user_id_fkey(handle, display_name)`
      )
      .eq("owner_id", uid)
      .order("created_at", { ascending: false });

    if (error) console.error("[my/offers] fetch error:", error);
    setOffers((data as unknown as OfferRow[]) ?? []);
  }

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setAuthed(false);
        setLoading(false);
        return;
      }
      setAuthed(true);
      await load(userData.user.id);
      setLoading(false);
    })();
  }, []);

  async function updateStatus(offerId: string, status: "accepted" | "rejected" | "completed") {
    if (actionPending) return;
    setActionPending(offerId);
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "처리 실패. 다시 시도해줘.");
        return;
      }
      // 로컬 상태 업데이트
      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, status } : o))
      );
    } catch (e) {
      console.error(e);
      alert("네트워크 오류가 발생했어.");
    } finally {
      setActionPending(null);
    }
  }

  const pill =
    "inline-flex items-center rounded-full border px-4 py-2 text-sm transition " +
    "border-black/10 bg-black/[0.04] text-zinc-800 hover:bg-black/[0.07] " +
    "dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80 dark:hover:bg-white/[0.09]";

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-5 pt-28 pb-32">
        <p className="text-sm text-zinc-400 dark:text-white/30">불러오는 중…</p>
      </main>
    );
  }

  if (authed === false) {
    return (
      <main className="mx-auto max-w-2xl px-5 pt-28 pb-32 text-center">
        <p className="mb-4 text-sm text-zinc-500 dark:text-white/40">
          로그인 후 받은 제안을 확인할 수 있어.
        </p>
        <a href="/login" className={pill}>
          로그인하기 →
        </a>
      </main>
    );
  }

  const pendingCount = offers.filter((o) => o.status === "pending").length;

  return (
    <main className="mx-auto max-w-2xl px-5 pt-24 pb-32">
      {/* 헤더 */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">받은 제안</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-white/40">
            {pendingCount > 0
              ? `${pendingCount}개의 새 제안이 기다리고 있어`
              : "다른 사람이 내 수집품에 보낸 가격 제안이야."}
          </p>
        </div>
        <Link href="/" className={`flex-shrink-0 ${pill}`}>
          ← 홈
        </Link>
      </div>

      {offers.length === 0 ? (
        <div className="mt-16 text-center text-zinc-400 dark:text-white/30">
          아직 받은 제안이 없어.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {offers.map((offer) => {
            const badge = statusLabel(offer.status);
            const img = offer.collections?.image ?? null;
            const title = offer.collections?.title ?? "제목 없음";
            const fromHandle = offer.from_profile?.handle ?? "알 수 없음";
            const fromName = offer.from_profile?.display_name;
            const isPending = offer.status === "pending";
            const isAccepted = offer.status === "accepted";
            const isActing = actionPending === offer.id;

            return (
              <div
                key={offer.id}
                className={`rounded-2xl border p-4 transition ${
                  isPending
                    ? "border-amber-400/30 bg-amber-50/50 dark:border-amber-400/15 dark:bg-amber-400/[0.04]"
                    : "border-black/8 bg-white/60 dark:border-white/8 dark:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* 수집품 썸네일 */}
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
                    {img ? (
                      <img src={img} alt={title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xl">📦</div>
                    )}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                        {title}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}
                      >
                        {badge.text}
                      </span>
                    </div>

                    <p className="text-base font-bold text-zinc-900 dark:text-white">
                      {formatPrice(offer.amount)}
                    </p>

                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-white/40">
                      @{fromHandle}
                      {fromName ? ` (${fromName})` : ""}
                      {" · "}
                      {new Date(offer.created_at).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>

                    {offer.message && (
                      <p className="mt-2 rounded-xl border border-black/8 bg-black/[0.03] px-3 py-2 text-xs text-zinc-700 dark:border-white/8 dark:bg-white/[0.03] dark:text-white/60">
                        {offer.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                {isPending && (
                  <div className="mt-3 flex gap-2 border-t border-black/5 pt-3 dark:border-white/5">
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => updateStatus(offer.id, "accepted")}
                      className="flex-1 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-500/20 disabled:opacity-40 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-300 dark:hover:bg-green-400/20"
                    >
                      {isActing ? "처리중…" : "✓ 수락"}
                    </button>
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => updateStatus(offer.id, "rejected")}
                      className="flex-1 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-500/15 disabled:opacity-40 dark:border-red-400/15 dark:bg-red-400/[0.07] dark:text-red-300 dark:hover:bg-red-400/15"
                    >
                      {isActing ? "처리중…" : "✕ 거절"}
                    </button>
                  </div>
                )}

                {isAccepted && (
                  <div className="mt-3 flex gap-2 border-t border-black/5 pt-3 dark:border-white/5">
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => updateStatus(offer.id, "completed")}
                      className="rounded-xl border border-blue-500/25 bg-blue-500/[0.08] px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-500/15 disabled:opacity-40 dark:border-blue-400/20 dark:bg-blue-400/[0.08] dark:text-blue-300 dark:hover:bg-blue-400/15"
                    >
                      {isActing ? "처리중…" : "🤝 거래 완료로 표시"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
