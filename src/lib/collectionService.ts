import { supabase } from "./supabaseClient";
import { CollectItem } from "@/data/collection";

const TABLE = "collections";

// DB row 타입(스네이크 케이스)
export type CollectionRow = {
  id: string;
  user_id: string;
  title: string;
  image: string;
  link: string | null;
  original_price: number | null;
  used_price: number | null;
  status: "collecting" | "collected";
  my_image: string | null;
  my_memo: string | null;
  created_at: string;
};

export async function fetchCollection(userId: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CollectionRow[];
}

export async function insertCollectItem(userId: string, item: CollectItem) {
  const payload = {
    user_id: userId,
    title: item.title,
    image: item.image, // not null
    link: item.link ?? null,
    original_price: item.originalPrice ?? null,
    used_price: item.usedPrice ?? null,
    status: item.status,
    my_image: item.myImage ?? null,
    my_memo: item.myMemo ?? null,
  };

  // insert 결과 row를 돌려받으면 UI에서 바로 쓸 수 있음
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as CollectionRow;
}

// ✅ patch는 "있는 것만" 업데이트 해야 안전함
export async function updateCollectItem(
  userId: string,
  id: string,
  patch: Partial<CollectItem>
) {
  const updatePayload: Record<string, any> = {};

  if (patch.title !== undefined) updatePayload.title = patch.title;
  if (patch.image !== undefined) updatePayload.image = patch.image;

  // null 허용 필드들은 null도 "의도"일 수 있으니 null/값 둘 다 허용
  if (patch.link !== undefined) updatePayload.link = patch.link ?? null;
  if (patch.originalPrice !== undefined)
    updatePayload.original_price = patch.originalPrice ?? null;
  if (patch.usedPrice !== undefined)
    updatePayload.used_price = patch.usedPrice ?? null;
  if (patch.status !== undefined) updatePayload.status = patch.status;
  if (patch.myImage !== undefined) updatePayload.my_image = patch.myImage ?? null;
  if (patch.myMemo !== undefined) updatePayload.my_memo = patch.myMemo ?? null;

  const { data, error } = await supabase
    .from(TABLE)
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data as CollectionRow;
}
