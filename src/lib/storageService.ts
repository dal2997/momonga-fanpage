// src/lib/storageService.ts
import { supabase } from "@/lib/supabase/client";
import { resizeImageFile } from "@/lib/imageResize";

const BUCKET = "momonga";
type AllowedFolder = "collecting" | "collected";

function getExtFromFileOrType(file: File) {
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

/**
 * ✅ folder 입력 정규화
 * - 허용: "collecting" | "collected"
 * - (레거시/실수 대비) "collecting/<uid>" 형태가 오면:
 *   - <uid>가 "현재 로그인 user.id"와 같으면 "collecting"으로 정규화
 *   - 다르면 차단
 */
function normalizeFolder(raw: string, userId: string): AllowedFolder {
  const v = (raw ?? "").trim();
  if (!v) throw new Error(`uploadToMomongaBucket: folder is required`);

  const parts = v.split("/").filter(Boolean);

  // "collecting" / "collected"
  if (parts.length === 1) {
    const f = parts[0] as AllowedFolder;
    if (f !== "collecting" && f !== "collected") {
      throw new Error(`uploadToMomongaBucket: invalid folder "${v}"`);
    }
    return f;
  }

  // "collecting/<uid>" 레거시 허용
  if (parts.length === 2) {
    const f = parts[0] as AllowedFolder;
    const uid = parts[1];

    if (f !== "collecting" && f !== "collected") {
      throw new Error(`uploadToMomongaBucket: invalid folder "${v}"`);
    }
    if (uid !== userId) {
      throw new Error(`uploadToMomongaBucket: unsafe folder "${v}" (uid mismatch)`);
    }
    return f;
  }

  // 그 외 전부 차단
  throw new Error(
    `uploadToMomongaBucket: folder must be "collecting" or "collected" (optionally "/<uid>"). got: "${v}"`
  );
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
 */
export function canDeletePublicUrlAsOwner(url: string, userId: string): boolean {
  const path = getStoragePathFromPublicUrl(url);
  if (!path) return false;

  const parts = path.split("/"); // [folder, user_id, filename...]
  if (parts.length < 3) return false;
  if (parts[1] !== userId) return false;

  // folder도 체크(방어)
  if (parts[0] !== "collecting" && parts[0] !== "collected") return false;

  return true;
}

// ✅ 오버로드: (file, folder) 또는 ({file, folder, upsert})
export async function uploadToMomongaBucket(file: File, folder: string): Promise<string>;
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
  const rawFolder = a instanceof File ? (b ?? "") : a.folder;
  const upsert = a instanceof File ? true : (a.upsert ?? true);

  // ✅ 업로드는 인증 필요
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Authentication required for upload");

  // ✅ folder 정규화 (여기서 collecting/<uid> 같은 실수도 흡수/차단)
  const folder = normalizeFolder(rawFolder, user.id);

  // ✅ 타입/용량 제한
  if (!inputFile.type.startsWith("image/")) throw new Error("Images only");

  const MAX_BYTES = 5 * 1024 * 1024; // 5MB
  if (inputFile.size > MAX_BYTES) throw new Error("Max 5MB");

  // ✅ 리사이즈 (jpeg로 통일)
  const file = await resizeImageFile(inputFile, {
    maxSize: 1600,
    quality: 0.85,
    mime: "image/jpeg",
  });

  const ext = getExtFromFileOrType(file);

  // ✅ 핵심 경로: {folder}/{user_id}/{filename}
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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Authentication required to delete files");

  const path = getStoragePathFromPublicUrl(url);
  if (!path) return;

  const parts = path.split("/");
  if (parts.length < 3) throw new Error("Invalid storage path");
  if (parts[1] !== user.id) throw new Error("Unauthorized: you can only delete your own files");

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
