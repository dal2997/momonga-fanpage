import { supabase } from "@/lib/supabaseClient";

function safeName(name: string) {
  return name.replaceAll(" ", "_").replace(/[^\w.\-()]/g, "");
}

export async function uploadToMomongaBucket(file: File, folder: string) {
  const fileName = `${crypto.randomUUID()}_${safeName(file.name)}`;
  const path = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from("momonga")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("momonga").getPublicUrl(path);
  return data.publicUrl;
}
