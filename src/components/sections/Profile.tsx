"use client";

import { useMemo, useState } from "react";
import GlassCard from "@/components/layout/GlassCard";

type Chip = {
  id: string;
  label: string;
  bubble: string;
};

export default function Profile() {
  const likes: Chip[] = useMemo(
    () => [
      { id: "snack", label: "간식", bubble: "간식 앞에서는 표정이 더 솔직해짐." },
      { id: "quiet", label: "조용한 시간", bubble: "가만히 있어도 이미 힐링임." },
      { id: "blanket", label: "담요", bubble: "담요는 이동 속도를 0으로 만들지." },
      { id: "sparkle", label: "칭찬", bubble: "칭찬 한 번이면 하루치 충전 완료." },
    ],
    []
  );

  const dislikes: Chip[] = useMemo(
    () => [
      { id: "loud", label: "시끄러움", bubble: "시끄러우면 눈이 가늘어짐(경계)." },
      { id: "rush", label: "급한 재촉", bubble: "재촉하면 사다다닥 도망감." },
      { id: "stress", label: "스트레스", bubble: "표정이 먼저 무너진다." },
      { id: "rain", label: "축축함", bubble: "꼬리가 무거워지는 기분." },
    ],
    []
  );

  const [active, setActive] = useState<string | null>(likes[0]?.id ?? null);
  const [bubble, setBubble] = useState(likes[0]?.bubble ?? "…");

  const onClickChip = (c: Chip) => {
    setActive(c.id);
    setBubble(c.bubble);
  };

  return (
    <section id="profile" className="scroll-mt-24">
      <GlassCard className="p-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold">모몽가 프로필</h2>
            <p className="mt-2 text-white/60">
              클릭해서 모몽가의 반응을 확인해봐
            </p>
          </div>

          {/* 말풍선 */}
          <div className="relative max-w-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white/80">
              {bubble}
            </div>
            <div className="absolute -left-2 top-6 h-4 w-4 rotate-45 border-l border-b border-white/10 bg-white/5" />
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* 매력 포인트 / 특기 */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs text-white/50">매력 포인트</p>
            <p className="mt-2 text-lg font-semibold">작고 빠르고 귀여움</p>
            <p className="mt-2 text-sm text-white/60">
              과한 연출 없이도 표정과 리듬으로 분위기를 바꾼다.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs text-white/50">특기</p>
            <p className="mt-2 text-lg font-semibold">표정으로 다 말함</p>
            <p className="mt-2 text-sm text-white/60">
              한 번 보면 잊기 어려운 리액션(=팬이 생기는 지점).
            </p>
          </div>

          {/* 좋아하는 것 */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs text-white/50">좋아하는 것</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {likes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onClickChip(c)}
                  className={[
                    "rounded-full border px-3 py-1 text-sm transition",
                    active === c.id
                      ? "border-white/25 bg-white/15 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                  ].join(" ")}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* 싫어하는 것 */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs text-white/50">싫어하는 것</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {dislikes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onClickChip(c)}
                  className={[
                    "rounded-full border px-3 py-1 text-sm transition",
                    active === c.id
                      ? "border-white/25 bg-white/15 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                  ].join(" ")}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
