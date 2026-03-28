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

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", `${(x * 100).toFixed(2)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(2)}%`);

      const tiltX = (y - 0.5) * -6; // -3~3 정도
      const tiltY = (x - 0.5) * 8; // -4~4 정도
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
      suppressHydrationWarning
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={
        {
          ["--mx" as any]: "50%",
          ["--my" as any]: "35%",
          ["--rx" as any]: "0deg",
          ["--ry" as any]: "0deg",
        } as React.CSSProperties
      }
      className={[
        // ✅ isolate: blend-mode/overlay가 "카드 내부"에서만 놀게 막아줌(라이트 씻김 방지)
        "group relative isolate overflow-hidden rounded-[28px]",

        // 라이트/다크 베이스
        "bg-white/[0.55] dark:bg-white/[0.07]",
        "backdrop-blur-2xl backdrop-saturate-180",

        // 3D 반응
        "transition-[transform,box-shadow,background-color,border-color] duration-300",
        "[transform:perspective(900px)_rotateX(var(--rx))_rotateY(var(--ry))]",
        "will-change-transform",

        // 테두리 — 핑크 틴트 림
        "border border-pink-200/40 dark:border-white/[0.11]",
        "ring-1 ring-inset ring-white/60 dark:ring-white/10",

        // hover shadow — 핑크 glow
        "hover:shadow-[0_22px_80px_rgba(255,120,160,0.18),0_4px_20px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_28px_120px_rgba(255,80,140,0.25),0_4px_24px_rgba(0,0,0,0.70)]",

        className,
      ].join(" ")}
    >
      {/* =========================
          ✅ 모든 오버레이는 z-0
          ✅ 실제 컨텐츠는 z-10
          => 라이트에서 글자 씻김/흐림 현상 해결
         ========================= */}

      {/* LIGHT glow — 핑크 틴트 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:hidden"
        style={{
          background:
            "radial-gradient(420px 320px at var(--mx) var(--my), rgba(255,200,220,0.55), transparent 60%)",
        }}
      />
      {/* DARK glow — 핑크/보라 틴트 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 hidden dark:block"
        style={{
          background:
            "radial-gradient(420px 320px at var(--mx) var(--my), rgba(255,140,190,0.22), transparent 60%)",
        }}
      />

      {/* LIGHT hotspot */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:hidden"
        style={{
          background:
            "radial-gradient(200px 150px at var(--mx) var(--my), rgba(255,230,240,0.45), transparent 55%)",
          mixBlendMode: "screen",
        }}
      />
      {/* DARK hotspot */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 hidden dark:block"
        style={{
          background:
            "radial-gradient(200px 150px at var(--mx) var(--my), rgba(255,160,210,0.20), transparent 55%)",
          mixBlendMode: "screen",
        }}
      />

      {/* 상단 림 스펙큘러 — 핑크 shimmer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-80 dark:opacity-85"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,200,220,0.30) 0%, rgba(255,255,255,0.12) 30%, transparent 55%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 dark:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.40), transparent 42%)",
        }}
      />

      {/* 내부 쉐도우 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 dark:hidden"
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -24px 50px rgba(0,0,0,0.10)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 hidden dark:block"
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -30px 60px rgba(0,0,0,0.18)",
        }}
      />

      {/* ✅ 컨텐츠는 무조건 위로 */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
