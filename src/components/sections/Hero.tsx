"use client";

import Link from "next/link";
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

      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;

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

  // ✅ 라이트/다크 텍스트 토큰
  const heading = "text-zinc-900 dark:text-white";
  const sub = "text-zinc-700 dark:text-white/80";
  const faint = "text-zinc-600 dark:text-white/70";
  const hint = "text-zinc-500 dark:text-white/50";

  return (
    <section id="hero">
      <GlassCard className="p-10">
        <div className="grid items-center gap-10 md:grid-cols-[1.2fr_0.8fr]">
          {/* 왼쪽: 텍스트 */}
          <div>
            <h1 className={`text-4xl font-semibold ${heading}`}>모몽가 팬페이지</h1>

            <div className="mt-5 flex gap-4">
              <GlassIcon label="팬메이드">
                <Sparkles size={18} />
              </GlassIcon>
            </div>

            <p className={`mt-6 ${sub}`}>모몽가를 좋아하는 사람들이  
            순간을 기록하고, 굿즈를 수집해  
            자기만의 페이지로 남기는 공간 ✨
            </p>

            <div className="mt-8 rounded-2xl border border-black/10 bg-black/[0.04] p-6 dark:border-white/10 dark:bg-white/5">
              <p className={`text-sm ${faint}`}>오늘의 한 줄</p>
              <p className={`mt-2 text-lg ${heading}`}>{mounted ? quote : "…"}</p>
            </div>

            {/* CTA + mini flow */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className={`
                  inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-medium
                  border-black/10 bg-black/[0.06] text-zinc-900 hover:bg-black/[0.10]
                  dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15
                `}
              >
                내 페이지 만들어보기
              </Link>

              <div className={`text-sm ${hint}`}>
                순간 기록 → 굿즈 수집 → 내 페이지 공유
              </div>
            </div>
          </div>

          {/* 오른쪽: 비주얼 */}
          <div className="relative">
            {/* glow 배경 (라이트/다크 분리) */}
            <div
              className="
                pointer-events-none absolute inset-0 -z-10 blur-2xl opacity-60
                [background:radial-gradient(260px_260px_at_52%_45%,rgba(0,0,0,0.06),transparent_60%)]
                dark:[background:radial-gradient(260px_260px_at_52%_45%,rgba(255,255,255,0.18),transparent_60%)]
              "
            />

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
                className="group relative h-full w-full select-none"
                aria-label="momonga"
              >
                {/* hover시 글로우 강화 (라이트/다크 분리) */}
                <div
                  className="
                    pointer-events-none absolute inset-0 rounded-full opacity-0 blur-2xl transition-opacity duration-200 group-hover:opacity-100
                    [background:radial-gradient(180px_180px_at_50%_55%,rgba(0,0,0,0.08),transparent_65%)]
                    dark:[background:radial-gradient(180px_180px_at_50%_55%,rgba(255,255,255,0.22),transparent_65%)]
                  "
                />

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
                    draggable={false}
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
