import { supabase } from "@/lib/supabase/client";

export type UserCollectionStatus = "collected" | "cleared";

export async function upsertUserCollection(collectionId: string, status: UserCollectionStatus, memo?: string) {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;

  const user = authData.user;
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_collections")
    .upsert(
      {
        user_id: user.id,
        collection_id: collectionId,
        status,
        memo: memo ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,collection_id" }
    );

  if (error) throw error;
}

export async function fetchMyUserCollections() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_collections")
    .select("collection_id,status,memo,updated_at")
    .eq("user_id", user.id);

  if (error) throw error;
  return data ?? [];
}
