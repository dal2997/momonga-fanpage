"use client";

import { useEffect, useRef } from "react";

export default function CursorGlowTracker() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let hovering = false;
    let down = false;

    const setHovering = (v: boolean) => {
      hovering = v;
      el.classList.toggle("is-hovering", hovering);
    };

    const setDown = (v: boolean) => {
      down = v;
      el.classList.toggle("is-down", down);
    };

    const isInteractive = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return !!target.closest('a,button,[role="button"],input,select,textarea,label');
    };

    const onMove = (e: MouseEvent) => {
      // 마우스 글로우 위치 변수
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);

      // 커서 DOM 위치
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;

      // 인터랙티브 위인지 체크
      setHovering(isInteractive(e.target));
    };

    const onDown = () => setDown(true);
    const onUp = () => setDown(false);

    const onEnter = () => el.classList.add("is-on");
    const onLeave = () => el.classList.remove("is-on");

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mouseenter", onEnter);
    window.addEventListener("mouseleave", onLeave);

    // 초기 상태
    el.classList.add("is-on");

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className="momonga-cursor" aria-hidden="true">
      <div className="momonga-cursor__glass">
        <div className="momonga-cursor__shine" />
        <img
          className="momonga-cursor__face"
          src="/cursor/momonga-glass.svg"
          alt=""
          width={22}
          height={22}
          draggable={false}
        />
        <div className="momonga-cursor__ripple" />
      </div>
    </div>
  );
}
