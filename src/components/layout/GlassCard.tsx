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
        // ✅ 라이트/다크 베이스를 '완전히' 분리 (라이트에서 흰유리 쓰면 글씨/경계가 죽음)
        "bg-black/[0.035] dark:bg-white/[0.07]",
        "backdrop-blur-2xl backdrop-saturate-150",

        // ✅ 아주 약한 3D 반응 (빛/각도로만)
        "transition-[transform,box-shadow,background-color,border-color] duration-300",
        "[transform:perspective(900px)_rotateX(var(--rx))_rotateY(var(--ry))]",
        "will-change-transform",

        // ✅ 테두리(라이트는 블랙 기반, 다크는 화이트 기반)
        "border border-black/10 dark:border-white/10",
        "ring-1 ring-inset ring-black/5 dark:ring-white/12",

        // ✅ hover shadow (라이트는 덜 어둡게)
        "hover:shadow-[0_22px_90px_rgba(0,0,0,0.18)] dark:hover:shadow-[0_32px_140px_rgba(0,0,0,0.78)]",

        className,
      ].join(" ")}
    >
      {/* ✅ 마우스 글로우: 라이트/다크를 분리해서 그린다 */}
      {/* LIGHT glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:hidden"
        style={{
          background:
            "radial-gradient(420px 320px at var(--mx) var(--my), rgba(255,255,255,0.55), transparent 60%)",
        }}
      />
      {/* DARK glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 hidden dark:block"
        style={{
          background:
            "radial-gradient(420px 320px at var(--mx) var(--my), rgba(255,255,255,0.26), transparent 60%)",
        }}
      />

      {/* ✅ 작은 핫스팟도 라이트/다크 분리 */}
      {/* LIGHT hotspot */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:hidden"
        style={{
          background:
            "radial-gradient(220px 160px at var(--mx) var(--my), rgba(255,255,255,0.35), transparent 55%)",
          mixBlendMode: "screen",
        }}
      />
      {/* DARK hotspot */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 hidden dark:block"
        style={{
          background:
            "radial-gradient(220px 160px at var(--mx) var(--my), rgba(255,255,255,0.18), transparent 55%)",
          mixBlendMode: "screen",
        }}
      />

      {/* ✅ 상단 림 스펙큘러(고정): 라이트/다크 톤 다르게 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90 dark:opacity-90"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.22), transparent 38%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.35), transparent 42%)",
        }}
      />

      {/* ✅ 내부 쉐도우: 라이트는 과한 검정 먹이면 탁해짐 -> 약하게 */}
      {/* LIGHT inner shadow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -24px 50px rgba(0,0,0,0.10)",
        }}
      />
      {/* DARK inner shadow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -30px 60px rgba(0,0,0,0.18)",
        }}
      />

      {children}
    </div>
  );
}
