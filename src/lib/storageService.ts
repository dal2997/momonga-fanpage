// lib/storageService.ts
import { supabase } from "@/lib/supabase/client";
import { resizeImageFile } from "@/lib/imageResize";

const BUCKET = "momonga";

function getExtFromFileOrType(file: File) {
  // resize에서 jpeg로 바꾸면 type이 image/jpeg로 바뀜 → 확실히 jpg로
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  const idx = file.name.lastIndexOf(".");
  if (idx < 0) return "jpg";
  return file.name.slice(idx + 1).toLowerCase();
}

function randomId(len = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function getPublicUrl(path: string) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ✅ 오버로드: (file, folder) 또는 ({file, folder, upsert})
export async function uploadToMomongaBucket(
  file: File,
  folder: string
): Promise<string>;
export async function uploadToMomongaBucket(params: {
  file: File;
  folder: string;
  upsert?: boolean;
}): Promise<string>;

export async function uploadToMomongaBucket(
  a: File | { file: File; folder: string; upsert?: boolean },
  b?: string
): Promise<string> {
  const inputFile = a instanceof File ? a : a.file;
  const folder = a instanceof File ? (b ?? "") : a.folder;
  const upsert = a instanceof File ? true : (a.upsert ?? true);

  if (!folder) throw new Error("uploadToMomongaBucket: folder is required");

  // ✅ 업로드 전 리사이즈(이미지일 때만)
  // - GIF/SVG는 resizeImageFile 내부에서 그대로 반환하도록 해놨으면 OK
  const file =
    inputFile.type.startsWith("image/")
      ? await resizeImageFile(inputFile, {
          maxSize: 1600,
          quality: 0.85,
          mime: "image/jpeg",
        })
      : inputFile;

  const ext = getExtFromFileOrType(file);
  const path = `${folder}/${Date.now()}_${randomId()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert,
    cacheControl: "3600",
    contentType: file.type || undefined,
  });

  if (error) throw error;

  return getPublicUrl(path);
}

/**
 * ✅ public URL -> storage path로 변환해서 삭제
 * 예) https://xxx.supabase.co/storage/v1/object/public/momonga/collected/...
 */
export async function removeByPublicUrl(url: string) {
  if (!url) return;

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return;

  const path = url.slice(idx + marker.length);
  if (!path) return;

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
