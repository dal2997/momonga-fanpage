import { supabase } from "@/lib/supabase/client";

const BUCKET = "momonga";

function getExt(name: string) {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "jpg";
  return name.slice(idx + 1).toLowerCase();
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

// ✅ 오버로드: (file, folder) 또는 ({file, folder})
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
) {
  const file = a instanceof File ? a : a.file;
  const folder = a instanceof File ? (b ?? "") : a.folder;
  const upsert = a instanceof File ? true : (a.upsert ?? true);

  if (!folder) throw new Error("uploadToMomongaBucket: folder is required");

  const ext = getExt(file.name);
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
