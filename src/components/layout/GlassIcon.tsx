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
          "border border-white/20 bg-white/10 backdrop-blur-md",
          "shadow-sm transition",
          "group-hover:bg-white/20 group-hover:shadow-white/20",
        ].join(" ")}
      >
        {children}
      </div>
      {label && (
        <span className="text-sm text-white/80">{label}</span>
      )}
    </div>
  );
}
