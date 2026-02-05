import { supabase } from "@/lib/supabase/client";

/**
 * DB 컬럼(snake_case) 그대로 쓰는 row 반환
 * - collections 테이블에 owner_id(=uuid) 기준으로 필터
 */
export async function fetchCollection(ownerId: string) {
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * UI의 CollectItem 형태(camelCase)를 DB insert 형태로 변환해서 넣는다
 */
export async function insertCollectItem(
  ownerId: string,
  item: {
    id: string;
    title: string;
    image: string | null;
    link: string | null;
    originalPrice: number | null;
    usedPrice: number | null;
    status: "collecting" | "collected";
    myImage?: string | null;
    myMemo?: string | null;
  }
) {
  const payload = {
    id: item.id,
    owner_id: ownerId,
    title: item.title,
    image: item.image,
    link: item.link,
    original_price: item.originalPrice,
    used_price: item.usedPrice,
    status: item.status,
    my_image: item.myImage ?? null,
    my_memo: item.myMemo ?? null,
  };

  const { error } = await supabase.from("collections").insert(payload);
  if (error) throw error;
}

/**
 * update: (ownerId, itemId, patch)
 * - owner_id 매칭되는 row만 업데이트되게 where를 함께 건다
 */
export async function updateCollectItem(
  ownerId: string,
  itemId: string,
  patch: {
    title?: string | null;
    image?: string | null;
    link?: string | null;
    originalPrice?: number | null;
    usedPrice?: number | null;
    status?: "collecting" | "collected";
    myImage?: string | null;
    myMemo?: string | null;
  }
) {
  const dbPatch: any = {};
  if ("title" in patch) dbPatch.title = patch.title;
  if ("image" in patch) dbPatch.image = patch.image;
  if ("link" in patch) dbPatch.link = patch.link;
  if ("originalPrice" in patch) dbPatch.original_price = patch.originalPrice;
  if ("usedPrice" in patch) dbPatch.used_price = patch.usedPrice;
  if ("status" in patch) dbPatch.status = patch.status;
  if ("myImage" in patch) dbPatch.my_image = patch.myImage;
  if ("myMemo" in patch) dbPatch.my_memo = patch.myMemo;

  const { error } = await supabase
    .from("collections")
    .update(dbPatch)
    .eq("id", itemId)
    .eq("owner_id", ownerId);

  if (error) throw error;
}

/**
 * 삭제: (ownerId, itemId)
 */
export async function deleteCollectItem(ownerId: string, itemId: string) {
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", itemId)
    .eq("owner_id", ownerId);

  if (error) throw error;
}