// src/lib/supabase/storageService.ts
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

function assertSingleFolder(folder: string) {
  // RLS가 (storage.foldername(name))[2] 를 user_id로 보는 구조라서
  // folder는 반드시 "collected" / "collecting" 같은 1단이어야 함
  if (!folder || folder.includes("/")) {
    throw new Error(`uploadToMomongaBucket: folder must be a single segment (e.g. "collected"). got: "${folder}"`);
  }
}

export function getStoragePathFromPublicUrl(url: string): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  const path = url.slice(idx + marker.length);
  return path || null;
}

/**
 * ✅ 이 public URL이 "내가 삭제 가능한 형태인지" 빠르게 판별
 * - 우리가 원하는 형태: {folder}/{user_id}/{filename}
 * - folder는 1단이어야 하고(parts[0]), user_id는 parts[1]
 */
export function canDeletePublicUrlAsOwner(url: string, userId: string): boolean {
  const path = getStoragePathFromPublicUrl(url);
  if (!path) return false;

  const parts = path.split("/"); // [folder, user_id, filename...]
  if (parts.length < 3) return false;
  if (parts[1] !== userId) return false;

  return true;
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
  assertSingleFolder(folder);

  // ✅ 업로드는 인증 필요 (RLS INSERT가 authenticated만 허용)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Authentication required for upload");

  // ✅ 업로드 전 리사이즈(이미지일 때만)
  const file =
    inputFile.type.startsWith("image/")
      ? await resizeImageFile(inputFile, {
          maxSize: 1600,
          quality: 0.85,
          mime: "image/jpeg",
        })
      : inputFile;

  const ext = getExtFromFileOrType(file);

  // ✅ 핵심: {folder}/{user_id}/{filename}
  const path = `${folder}/${user.id}/${Date.now()}_${randomId()}.${ext}`;

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
 * 예) https://xxx.supabase.co/storage/v1/object/public/momonga/collected/{user_id}/...
 */
export async function removeByPublicUrl(url: string) {
  if (!url) return;

  // ✅ 삭제는 인증 필요 (RLS DELETE가 authenticated만 허용)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Authentication required to delete files");

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return;

  const path = url.slice(idx + marker.length);
  if (!path) return;

  // ✅ 1차 소유권 검증: {folder}/{user_id}/... 구조 확인
  const parts = path.split("/"); // [folder, user_id, filename...]
  if (parts.length < 2) throw new Error("Invalid storage path");
  if (parts[1] !== user.id) {
    throw new Error("Unauthorized: you can only delete your own files");
  }

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
