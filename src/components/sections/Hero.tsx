"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { quotes } from "@/data/quotes";
import GlassCard from "@/components/layout/GlassCard";
import GlassIcon from "@/components/layout/GlassIcon";
import { Sparkles } from "lucide-react";

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  const [quote, setQuote] = useState("");

  // parallax
  const ref = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // click pop
  const [pop, setPop] = useState(false);

  const pickedQuote = useMemo(() => {
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, []);

  useEffect(() => {
    setMounted(true);
    setQuote(pickedQuote);
  }, [pickedQuote]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = (e.clientX - cx) / rect.width;  // -0.5 ~ 0.5
      const dy = (e.clientY - cy) / rect.height; // -0.5 ~ 0.5

      const clamp = (v: number) => Math.max(-0.5, Math.min(0.5, v));
      setTilt({ x: clamp(dx), y: clamp(dy) });
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const triggerPop = () => {
    setPop(true);
    window.setTimeout(() => setPop(false), 450);
  };

  return (
    <section id="hero">
      <GlassCard className="p-10">
        <div className="grid items-center gap-10 md:grid-cols-[1.2fr_0.8fr]">
          {/* 왼쪽: 텍스트 */}
          <div>
            <h1 className="text-4xl font-semibold">모몽가 팬페이지</h1>

            <div className="mt-5 flex gap-4">
              <GlassIcon label="팬메이드">
                <Sparkles size={18} />
              </GlassIcon>
            </div>

            <p className="mt-6 text-white/80">팬이 팬심으로 만든 공간 ✨</p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm opacity-70">오늘의 한 줄</p>
              <p className="mt-2 text-lg">{mounted ? quote : "…"}</p>
            </div>

            {/* scroll hint */}
            <p className="mt-8 text-sm text-white/50">
              ↓ 아래로 내려서 팬들이 좋아하는 순간 보기
            </p>
          </div>

          {/* 오른쪽: 비주얼 */}
          <div className="relative">
            {/* glow 배경 */}
            <div className="pointer-events-none absolute inset-0 -z-10 blur-2xl opacity-60 [background:radial-gradient(260px_260px_at_52%_45%,rgba(255,255,255,0.18),transparent_60%)]" />

            <div
              ref={ref}
              className="relative mx-auto h-[320px] w-[320px]"
              style={{
                transform: `translate3d(${tilt.x * 18}px, ${tilt.y * 18}px, 0)`,
                transition: "transform 120ms ease-out",
              }}
            >
              <button
                type="button"
                onClick={triggerPop}
                className="group relative h-full w-full cursor-pointer select-none"
                aria-label="momonga"
              >
                {/* hover시 글로우 강화 */}
                <div className="pointer-events-none absolute inset-0 rounded-full opacity-0 blur-2xl transition-opacity duration-200 group-hover:opacity-100 [background:radial-gradient(180px_180px_at_50%_55%,rgba(255,255,255,0.22),transparent_65%)]" />

                <div className="absolute inset-0 grid place-items-center">
                  <img
                    src="/images/momonga/hero.png"
                    alt="Momonga"
                    className={[
                      "w-64 drop-shadow-[0_40px_80px_rgba(0,0,0,0.6)]",
                      "transition-transform duration-200 ease-out",
                      "group-hover:scale-[1.03]",
                      "momonga-idle",
                      "momonga-breathe",
                      "momonga-blink",
                      pop ? "momonga-pop" : "",
                    ].join(" ")}
                    style={{
                      transform: `rotateX(${-tilt.y * 10}deg) rotateY(${tilt.x * 12}deg)`,
                      transformOrigin: "center",
                    }}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
