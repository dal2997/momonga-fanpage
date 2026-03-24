"use client";

/**
 * CollageModal.tsx
 * 선택된 수집 아이템들을 정사각 그리드 콜라쥬로 만들어 저장/공유하는 모달
 *
 * 레이아웃:
 *   1~2개  → 1×2
 *   3~4개  → 2×2
 *   5~6개  → 2×3
 *   7~9개  → 3×3
 */

import { useEffect, useRef, useState } from "react";
import { CollectItem } from "@/data/collection";

const CELL = 400; // px per cell (Canvas)
const GAP  = 8;
const BG   = "#18181b"; // dark background
const WATERMARK = "momonga.app";

function gridSize(n: number): [cols: number, rows: number] {
  if (n <= 1) return [1, 1];
  if (n <= 2) return [2, 1];
  if (n <= 4) return [2, 2];
  if (n <= 6) return [3, 2];
  return [3, 3];
}

function clamp(items: CollectItem[], max: number) {
  return items.slice(0, max);
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);  // 이미지 실패해도 계속
    img.src = src;
  });
}

async function buildCollage(
  items: CollectItem[],
  canvas: HTMLCanvasElement
): Promise<void> {
  const [cols, rows] = gridSize(items.length);
  const totalW = cols * CELL + (cols + 1) * GAP;
  const totalH = rows * CELL + (rows + 1) * GAP + 36; // 36px = watermark bar

  canvas.width  = totalW;
  canvas.height = totalH;

  const ctx = canvas.getContext("2d")!;

  // 배경
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, totalW, totalH);

  // 셀 그리기
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const col  = i % cols;
    const row  = Math.floor(i / cols);
    const x    = GAP + col * (CELL + GAP);
    const y    = GAP + row * (CELL + GAP);

    // 셀 배경 (이미지 없을 때 폴백)
    ctx.fillStyle = "#27272a";
    ctx.beginPath();
    ctx.roundRect(x, y, CELL, CELL, 16);
    ctx.fill();

    // 이미지 (myImage 우선, 없으면 image)
    const src = item.myImage || item.image;
    if (src) {
      const img = await loadImage(src);
      if (img) {
        // object-fit: cover
        const scale = Math.max(CELL / img.naturalWidth, CELL / img.naturalHeight);
        const sw = CELL / scale;
        const sh = CELL / scale;
        const sx = (img.naturalWidth  - sw) / 2;
        const sy = (img.naturalHeight - sh) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, CELL, CELL, 16);
        ctx.clip();
        ctx.drawImage(img, sx, sy, sw, sh, x, y, CELL, CELL);
        ctx.restore();
      }
    }

    // 하단 그라데이션 + 제목
    const grad = ctx.createLinearGradient(x, y + CELL * 0.55, x, y + CELL);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, CELL, CELL, 16);
    ctx.clip();
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, CELL, CELL);
    ctx.restore();

    // 제목 텍스트
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font      = "bold 20px -apple-system, 'Helvetica Neue', sans-serif";
    ctx.textBaseline = "bottom";
    const maxW   = CELL - 24;
    const text   = item.title ?? "";
    let display  = text;
    while (ctx.measureText(display).width > maxW && display.length > 0) {
      display = display.slice(0, -1);
    }
    if (display.length < text.length) display = display.slice(0, -1) + "…";
    ctx.fillText(display, x + 12, y + CELL - 12);

    // source_type 뱃지
    if (item.sourceType) {
      const label = item.sourceType === "official" ? "✅ 공식" : "❓ 출처불명";
      ctx.font = "bold 13px -apple-system, sans-serif";
      const lw = ctx.measureText(label).width + 16;
      ctx.fillStyle = item.sourceType === "official"
        ? "rgba(14,165,233,0.85)"
        : "rgba(82,82,91,0.85)";
      ctx.beginPath();
      ctx.roundRect(x + 10, y + 10, lw, 24, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + 18, y + 22);
    }
  }

  // 워터마크 바
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(0, totalH - 36, totalW, 36);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "13px -apple-system, sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  ctx.fillText(WATERMARK, totalW - 16, totalH - 18);
  ctx.textAlign = "left";
}

type Props = {
  items: CollectItem[];
  onClose: () => void;
};

export default function CollageModal({ items, onClose }: Props) {
  const [cols, rows] = gridSize(items.length);
  const maxItems = cols * rows;
  const clamped = clamp(items, maxItems);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(true);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!canvasRef.current) return;
      setGenerating(true);
      await buildCollage(clamped, canvasRef.current);
      if (!alive) return;
      setGenerating(false);

      canvasRef.current.toBlob((blob) => {
        if (!blob || !alive) return;
        setBlobUrl(URL.createObjectURL(blob));
      }, "image/png");
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleDownload() {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `momonga-collage-${Date.now()}.png`;
    a.click();
  }

  async function handleShare() {
    if (!blobUrl) return;
    if (!navigator.share) {
      // Web Share API 미지원 → 다운로드로 폴백
      handleDownload();
      return;
    }
    setSharing(true);
    try {
      const res  = await fetch(blobUrl);
      const blob = await res.blob();
      const file = new File([blob], `momonga-collage-${Date.now()}.png`, { type: "image/png" });
      await navigator.share({
        title: "내 수집품 콜라쥬 | momonga",
        text: "momonga.app에서 만든 수집품 콜라쥬 🐿️",
        files: [file],
      });
    } catch {
      // 취소 등 무시
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* 뒷배경 */}
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col gap-5 rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">🖼️ 콜라쥬 미리보기</h2>
            <p className="mt-0.5 text-sm text-white/50">
              {clamped.length}개 선택 · {cols}×{rows} 그리드
              {items.length > maxItems && (
                <span className="ml-1 text-yellow-400">
                  (최대 {maxItems}개 · {items.length - maxItems}개 제외됨)
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            닫기
          </button>
        </div>

        {/* 캔버스 미리보기 */}
        <div className="relative overflow-hidden rounded-2xl bg-zinc-800">
          <canvas
            ref={canvasRef}
            className="max-h-[55vh] w-full object-contain"
            style={{ display: generating ? "none" : "block" }}
          />
          {generating && (
            <div className="flex h-48 items-center justify-center text-sm text-white/50">
              생성 중…
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={generating || !blobUrl}
            onClick={handleDownload}
            className="flex-1 rounded-2xl border border-white/10 bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-40"
          >
            📥 이미지 저장
          </button>
          <button
            type="button"
            disabled={generating || !blobUrl || sharing}
            onClick={handleShare}
            className="flex-1 rounded-2xl border border-pink-400/40 bg-pink-500/20 py-3 text-sm font-semibold text-pink-200 transition hover:bg-pink-500/30 disabled:opacity-40"
          >
            {sharing ? "공유 중…" : "📤 SNS 공유"}
          </button>
        </div>

        <p className="text-center text-xs text-white/30">
          Web Share API를 지원하지 않는 환경에서는 이미지 저장으로 대체됩니다
        </p>
      </div>
    </div>
  );
}
