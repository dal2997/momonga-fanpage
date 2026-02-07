// lib/imageResize.ts
export async function resizeImageFile(
  file: File,
  opts?: { maxSize?: number; quality?: number; mime?: string }
): Promise<File> {
  const maxSize = opts?.maxSize ?? 1600;
  const quality = opts?.quality ?? 0.85;
  const mime = opts?.mime ?? "image/jpeg";

  // SVG/GIF 같은 건 그대로 두는 게 안전(애니메이션 등)
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

  const img = await loadImage(file);

  const { targetW, targetH } = fitWithin(img.width, img.height, maxSize);

  // 너무 작으면(이미 maxSize 이하) 그냥 반환
  if (targetW === img.width && targetH === img.height) return file;

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, targetW, targetH);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      mime,
      quality
    );
  });

  const ext = mime === "image/webp" ? "webp" : "jpg";
  const nextName = file.name.replace(/\.[^.]+$/, "") + `.${ext}`;

  return new File([blob], nextName, { type: mime, lastModified: Date.now() });
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image load failed"));
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function fitWithin(w: number, h: number, maxSize: number) {
  if (w <= maxSize && h <= maxSize) return { targetW: w, targetH: h };

  const ratio = w / h;
  if (w >= h) {
    const targetW = maxSize;
    const targetH = Math.round(maxSize / ratio);
    return { targetW, targetH };
  } else {
    const targetH = maxSize;
    const targetW = Math.round(maxSize * ratio);
    return { targetW, targetH };
  }
}
