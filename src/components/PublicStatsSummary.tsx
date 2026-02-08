"use client";

import { useMemo, useState } from "react";
import GlassCard from "@/components/layout/GlassCard";

type MonthPoint = {
  ym: string;
  collectedSum: number;
  collectingSum: number;
  cumCollected: number; // 실선
  cumTotal: number; // 점선(수집중 포함)
};

function formatMoney(n: number) {
  return `${Math.round(n).toLocaleString()}원`;
}

function buildPolyline(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

export default function PublicStatsSummary({
  total,
  collectedTotal,
  collectingTotal,
  points,
}: {
  total: number;
  collectedTotal: number;
  collectingTotal: number;
  points: MonthPoint[];
}) {
  const [showMoney, setShowMoney] = useState(true);

  const chart = useMemo(() => {
    const data = points.slice(-10); // 최근 10개월
    const W = 220;
    const H = 64;
    const P = 6;

    const maxY = Math.max(1, ...data.map((p) => p.cumTotal));
    const n = Math.max(1, data.length - 1);

    const toX = (i: number) => P + (i * (W - P * 2)) / n;
    const toY = (v: number) => {
      const t = v / maxY;
      return H - P - t * (H - P * 2);
    };

    const solidPts = data.map((p, i) => ({ x: toX(i), y: toY(p.cumCollected) }));
    const dashedPts = data.map((p, i) => ({ x: toX(i), y: toY(p.cumTotal) }));

    return {
      W,
      H,
      data,
      solid: buildPolyline(solidPts),
      dashed: buildPolyline(dashedPts),
      startYm: data[0]?.ym,
      lastCum: data[data.length - 1]?.cumTotal ?? 0,
      lastSolid: solidPts[solidPts.length - 1] ?? null,
      lastDashed: dashedPts[dashedPts.length - 1] ?? null,
    };
  }, [points]);

  return (
    <div className="mb-6">
      {/* ✅ 홈과 동일 재질: GlassCard 사용 */}
      <GlassCard className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-white/60">공개 수집 요약</div>

            <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
              <div className="text-2xl font-semibold text-white">
                {showMoney ? formatMoney(total) : "금액 숨김"}
              </div>

              <button
                type="button"
                onClick={() => setShowMoney((v) => !v)}
                className="
                  rounded-full border px-3 py-1 text-xs transition
                  border-white/10 bg-white/5 text-white/70
                  hover:bg-white/10 hover:border-white/20 hover:text-white
                "
              >
                {showMoney ? "금액 숨기기" : "금액 보기"}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                수집완료 {showMoney ? formatMoney(collectedTotal) : "—"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                수집중 {showMoney ? formatMoney(collectingTotal) : "—"}
              </span>
            </div>

            {/* 범례 */}
            <div className="mt-3 flex items-center gap-3 text-xs text-white/50">
              <span className="inline-flex items-center gap-2">
                <span className="h-[2px] w-6 rounded bg-white/45" />
                수집완료(실선)
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-[2px] w-6 rounded bg-white/30"
                  style={{
                    backgroundImage: "linear-gradient(to right, currentColor 50%, transparent 0%)",
                    backgroundSize: "8px 2px",
                  }}
                />
                수집중 포함(점선)
              </span>
            </div>
          </div>

          {/* 미니 라인 차트 */}
          <div className="w-[220px] shrink-0">
            <div className="text-xs text-white/50">누적(등록일 기준)</div>

            {/* ✅ mini chart도 글래스 재질 통일 */}
            <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-2">
              {chart.data.length >= 1 ? (
                <svg
                  width={chart.W}
                  height={chart.H}
                  viewBox={`0 0 ${chart.W} ${chart.H}`}
                  className="block"
                >
                  {/* 점선: 총 누적(수집중 포함) */}
                  <polyline
                    points={chart.dashed}
                    fill="none"
                    stroke="currentColor"
                    className="text-white/30"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* 실선: 수집완료 누적 */}
                  <polyline
                    points={chart.solid}
                    fill="none"
                    stroke="currentColor"
                    className="text-white/45"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* 끝점(현재) */}
                  {chart.lastDashed && (
                    <circle
                      cx={chart.lastDashed.x}
                      cy={chart.lastDashed.y}
                      r="3.5"
                      className="text-white/30"
                      fill="currentColor"
                    />
                  )}
                  {chart.lastSolid && (
                    <circle
                      cx={chart.lastSolid.x}
                      cy={chart.lastSolid.y}
                      r="4"
                      className="text-white/45"
                      fill="currentColor"
                    />
                  )}
                </svg>
              ) : (
                <div className="py-6 text-center text-sm text-white/50">
                  데이터가 더 쌓이면 그래프가 보여!
                </div>
              )}
            </div>

            <div className="mt-2 text-[11px] text-white/45">
              {chart.startYm ? `시작 ${chart.startYm}` : "데이터 없음"}
              {showMoney && chart.startYm ? ` · 현재 ${formatMoney(chart.lastCum)}` : ""}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
