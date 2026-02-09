import { ReactNode } from "react";

export default function GlassIcon({
  children,
  label,
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div className="group flex items-center gap-3">
      <div
        className={[
          "relative grid h-10 w-10 place-items-center rounded-xl",
          // ✅ 라이트/다크 분리
          "border border-black/10 bg-black/[0.04] backdrop-blur-md",
          "dark:border-white/20 dark:bg-white/10",
          "shadow-sm transition",
          "group-hover:bg-black/[0.06] dark:group-hover:bg-white/20",
        ].join(" ")}
      >
        <span className="text-zinc-900 dark:text-white/90">{children}</span>
      </div>

      {label && <span className="text-sm text-zinc-700 dark:text-white/80">{label}</span>}
    </div>
  );
}
