"use client";

import { ReactNode, useRef } from "react";

export default function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const rafRef = useRef<number | null>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();

    const x = (e.clientX - rect.left) / rect.width; // 0~1
    const y = (e.clientY - rect.top) / rect.height; // 0~1

    // 퍼포먼스: mousemove마다 setProperty를 바로 하지 말고 RAF로 묶기
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", `${(x * 100).toFixed(2)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(2)}%`);

      // 살짝 기울어지는 느낌(과하면 촌스러워서 아주 약하게)
      const tiltX = (y - 0.5) * -6; // -3~3 정도
      const tiltY = (x - 0.5) * 8;  // -4~4 정도
      el.style.setProperty("--rx", `${tiltX.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${tiltY.toFixed(2)}deg`);
    });
  };

  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.setProperty("--mx", `50%`);
    el.style.setProperty("--my", `35%`);
    el.style.setProperty("--rx", `0deg`);
    el.style.setProperty("--ry", `0deg`);
  };

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      // 기본값(마우스 없을 때)
      style={
        {
          ["--mx" as any]: "50%",
          ["--my" as any]: "35%",
          ["--rx" as any]: "0deg",
          ["--ry" as any]: "0deg",
        } as React.CSSProperties
      }
      className={[
        "group relative overflow-hidden rounded-[28px]",
        // ✅ 진짜 ‘유리’ 베이스
        "bg-white/[0.055] dark:bg-white/[0.07]",
        "backdrop-blur-2xl backdrop-saturate-150",

        // ✅ 가벼운 3D 반응 (애플 느낌: scale보다 빛/각도)
        "transition-[transform,box-shadow,background-color] duration-300",
        "hover:shadow-[0_28px_110px_rgba(0,0,0,0.65)] dark:hover:shadow-[0_32px_140px_rgba(0,0,0,0.78)]",
        "[transform:perspective(900px)_rotateX(var(--rx))_rotateY(var(--ry))]",
        "will-change-transform",

        // ✅ 유리 림(두께감)
        "border border-black/10 dark:border-white/10",
        "ring-1 ring-inset ring-white/10 dark:ring-white/12",

        className,
      ].join(" ")}
    >
      {/* ✅ 마우스 위치를 따라다니는 글로우 (핵심) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(420px 320px at var(--mx) var(--my), rgba(255,255,255,0.26), transparent 60%)",
        }}
      />

      {/* ✅ 좀 더 작은 ‘핫스팟’ (유리 하이라이트) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(220px 160px at var(--mx) var(--my), rgba(255,255,255,0.18), transparent 55%)",
          mixBlendMode: "screen",
        }}
      />

      {/* ✅ 상단 림 스펙큘러(고정) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.22), transparent 38%)",
        }}
      />

      {/* ✅ 미세한 내부 쉐도우로 가장자리 깊이 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -30px 60px rgba(0,0,0,0.18)",
        }}
      />

      {children}
    </div>
  );
}
