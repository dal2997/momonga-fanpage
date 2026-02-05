// src/lib/storageService.ts
import { supabase } from "@/lib/supabase/client";

export async function uploadToMomongaBucket(
  file: File,
  path: string // 예: collecting/{uid} 또는 collected/{uid}
) {
  const ext = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const fullPath = `${path}/${fileName}`;

  const { error } = await supabase.storage
    .from("momonga")
    .upload(fullPath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    console.error("upload error", error);
    throw error;
  }

  const { data } = supabase.storage
    .from("momonga")
    .getPublicUrl(fullPath);

  return data.publicUrl;
}
