"use client";

import { useEffect, useRef, useState } from "react";

function isHoverTarget(el: Element | null) {
  if (!el) return false;
  return !!el.closest('a,button,[role="button"],input,select,textarea,label');
}

export default function MomongaCursor() {
  const ref = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | null>(null);

  const [on, setOn] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [down, setDown] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    const move = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      // 커서 DOM 이동 (rAF로 부드럽게)
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
        root.style.setProperty("--mx", `${x}px`);
        root.style.setProperty("--my", `${y}px`);
      });

      setHovering(isHoverTarget(e.target as Element));
      setOn(true);
    };

    const enter = () => setOn(true);
    const leave = () => setOn(false);

    const md = () => setDown(true);
    const mu = () => setDown(false);

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseenter", enter);
    window.addEventListener("mouseleave", leave);
    window.addEventListener("mousedown", md);
    window.addEventListener("mouseup", mu);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseenter", enter);
      window.removeEventListener("mouseleave", leave);
      window.removeEventListener("mousedown", md);
      window.removeEventListener("mouseup", mu);
    };
  }, []);

  return (
    <>
      {/* 링 없는 글로우 */}
      <div className="cursor-glow" />

      {/* 커서 */}
      <div
        ref={ref}
        className={[
          "momonga-cursor",
          on ? "is-on" : "",
          hovering ? "is-hovering" : "",
          down ? "is-down" : "",
        ].join(" ")}
        aria-hidden="true"
      >
        <div className="momonga-cursor__glass">
          <div className="momonga-cursor__shine" />
          {/* 얼굴: 이모지로 빠르게. 원하면 SVG로 교체 가능 */}
          <div className="momonga-cursor__face">🙂</div>
        </div>
      </div>
    </>
  );
}
