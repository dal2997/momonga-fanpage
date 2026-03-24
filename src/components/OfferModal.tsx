"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { BrowseItem } from "@/app/browse/page";

function fmt(n: number | null | undefined) {
  if (!n) return null;
  return `${n.toLocaleString()}원`;
}

type OwnerProfile = {
  shipping_method: string | null;
  min_offer_multiplier: number | null;
};

const SHIPPING_LABEL: Record<string, string> = {
  direct: "직접 거래",
  delivery: "택배",
  both: "직거래 · 택배 둘 다",
};

export default function OfferModal({
  item,
  onClose,
}: {
  item: BrowseItem;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 인증 확인
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthed(!!data.user);
      setAuthChecked(true);
    });
    // 판매자 프로필 (배송방식, 최소제안배수)
    supabase
      .from("profiles")
      .select("shipping_method, min_offer_multiplier")
      .eq("id", item.owner_id)
      .maybeSingle<OwnerProfile>()
      .then(({ data }) => setOwnerProfile(data));
  }, [item.owner_id]);

  useEffect(() => {
    if (authChecked && isAuthed) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [authChecked, isAuthed]);

  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseInt(amount.replace(/,/g, ""), 10);
    if (!parsed || parsed <= 0) { setError("금액을 올바르게 입력해줘."); return; }
    if (minAmount && parsed < minAmount) {
      setError(`최소 ${minAmount.toLocaleString()}원 이상 제안해야 해.`);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collection_id: item.id,
        owner_id: item.owner_id,
        amount: parsed,
        message: message.trim() || null,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "제안 전송 실패. 다시 시도해줘.");
      return;
    }

    setDone(true);
  }

  // 지정 판매가 없으면 중고가 → 원가 순으로 fallback
  const displayPrice = item.sale_price || item.used_price || item.original_price || null;
  const isDesignatedPrice = !!item.sale_price;

  // 최소 제안 금액 계산 (지정가 없으면 fallback 가격 기준)
  const minAmount =
    ownerProfile?.min_offer_multiplier && displayPrice
      ? Math.ceil(displayPrice * ownerProfile.min_offer_multiplier)
      : null;

  const img = item.status === "collected" ? (item.my_image ?? item.image) : item.image;
  const shippingLabel = ownerProfile?.shipping_method
    ? (SHIPPING_LABEL[ownerProfile.shipping_method] ?? ownerProfile.shipping_method)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-3xl border border-black/10 bg-white/95 p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:text-zinc-600 dark:text-white/30 dark:hover:text-white/60 transition"
        >
          ✕
        </button>

        {done ? (
          <div className="py-6 text-center">
            <div className="mb-3 text-4xl">✅</div>
            <p className="text-base font-semibold text-zinc-900 dark:text-white">제안이 전송됐어!</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-white/40">
              @{item.owner_handle}에게 알림이 갈 거야.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-full border border-black/10 bg-black/5 px-6 py-2 text-sm transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            {/* 아이템 미리보기 */}
            <div className="mb-4 flex items-center gap-3">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
                {img ? (
                  <img src={img} alt={item.title ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xl">{item.cat_emoji ?? "📦"}</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                  {item.title ?? "제목 없음"}
                </p>
                <p className="text-xs text-zinc-400 dark:text-white/35">
                  @{item.owner_handle}
                  {item.original_price ? ` · 정가 ${fmt(item.original_price)}` : ""}
                </p>
              </div>
            </div>

            {/* 판매 정보 박스 */}
            {(displayPrice || shippingLabel || ownerProfile?.min_offer_multiplier) && (
              <div className="mb-4 space-y-1.5 rounded-2xl border border-black/8 bg-black/[0.03] px-4 py-3 dark:border-white/8 dark:bg-white/[0.04]">
                {displayPrice && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-white/45">
                      {isDesignatedPrice ? "판매 희망가" : item.used_price ? "중고 시세" : "원가"}
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{fmt(displayPrice)}</span>
                  </div>
                )}
                {ownerProfile?.min_offer_multiplier && displayPrice && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-white/45">최소 수락 금액</span>
                    <span className="font-medium text-amber-700 dark:text-amber-300">
                      {fmt(minAmount)} 이상 ({ownerProfile.min_offer_multiplier}배)
                    </span>
                  </div>
                )}
                {shippingLabel && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-white/45">배송 방식</span>
                    <span className="text-zinc-700 dark:text-white/70">{shippingLabel}</span>
                  </div>
                )}
              </div>
            )}

            {!authChecked ? (
              <p className="text-sm text-zinc-400">확인 중…</p>
            ) : !isAuthed ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                가격 제안은 로그인 후 가능해.{" "}
                <a href="/login" className="underline underline-offset-2">로그인하기 →</a>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-white/40">
                    제안 금액 (원) *
                    {minAmount && (
                      <span className="ml-1 text-amber-600 dark:text-amber-400">
                        최소 {minAmount.toLocaleString()}원
                      </span>
                    )}
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    placeholder={minAmount ? `최소 ${minAmount.toLocaleString()}원` : "예: 15000"}
                    value={amount}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, "");
                      setAmount(v ? parseInt(v, 10).toLocaleString() : "");
                    }}
                    className="w-full rounded-xl border border-black/10 bg-black/5 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-white/5"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-white/40">
                    메시지 (선택)
                  </label>
                  <textarea
                    placeholder="간단한 메시지를 남겨도 돼"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    maxLength={200}
                    className="w-full resize-none rounded-xl border border-black/10 bg-black/5 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !amount}
                  className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-white/90"
                >
                  {loading ? "전송 중…" : "가격 제안 보내기"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
