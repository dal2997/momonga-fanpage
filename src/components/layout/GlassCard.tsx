import { ReactNode } from "react";

export default function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[28px]",
        // glass base
        "bg-white/[0.08] backdrop-blur-xl",
        // border gradient 느낌(얇고 고급)
        "border border-white/10",
        // depth
        "shadow-[0_20px_80px_rgba(0,0,0,0.55)]",
        // highlight
        "before:absolute before:inset-0 before:pointer-events-none",
        "before:bg-[radial-gradient(1200px_400px_at_20%_-10%,rgba(255,255,255,0.22),transparent_60%)]",
        // inner stroke
        "after:absolute after:inset-0 after:pointer-events-none after:rounded-[28px]",
        "after:ring-1 after:ring-white/10",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
