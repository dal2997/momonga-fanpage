import { supabase } from "./supabaseClient";
import { CollectItem } from "@/data/collection";

const TABLE = "collections";

export async function fetchCollection(userId: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as any[];
}

export async function insertCollectItem(userId: string, item: CollectItem) {
  const { error } = await supabase.from(TABLE).insert({
    user_id: userId,
    title: item.title,
    image: item.image,
    link: item.link ?? null,
    original_price: item.originalPrice ?? null,
    used_price: item.usedPrice ?? null,
    status: item.status,
    my_image: item.myImage ?? null,
    my_memo: item.myMemo ?? null,
  });

  if (error) throw error;
}

// ✅ 수정 버튼용(링크/가격/제목/이미지 등 바꾸는 용)
export async function updateCollectItem(
  userId: string,
  id: string,
  patch: Partial<CollectItem>
) {
  const { error } = await supabase
    .from(TABLE)
    .update({
      title: patch.title,
      image: patch.image,
      link: patch.link ?? null,
      original_price: patch.originalPrice ?? null,
      used_price: patch.usedPrice ?? null,
      status: patch.status,
      my_image: patch.myImage ?? null,
      my_memo: patch.myMemo ?? null,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
