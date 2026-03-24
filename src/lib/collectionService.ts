import { supabase } from "@/lib/supabase/client";

// ─────────────────────────────────────────
// Category 타입
// ─────────────────────────────────────────
export type Category = {
  id: string;
  owner_id: string;
  name: string;
  emoji: string;
  sort_order: number;
  created_at: string;
};

// ─────────────────────────────────────────
// Categories CRUD
// ─────────────────────────────────────────

/** 내 카테고리 목록 불러오기 (sort_order 순) */
export async function fetchCategories(ownerId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("owner_id", ownerId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** 카테고리 추가 (맨 뒤에 추가) */
export async function insertCategory(
  ownerId: string,
  name: string,
  emoji: string
): Promise<Category> {
  // 현재 최대 sort_order 조회
  const { data: existing } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("owner_id", ownerId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("categories")
    .insert({ owner_id: ownerId, name: name.trim(), emoji: emoji.trim() || "📦", sort_order: nextOrder })
    .select()
    .single<Category>();

  if (error) throw error;
  return data;
}

/** 카테고리 이름/이모지 수정 */
export async function updateCategory(
  ownerId: string,
  categoryId: string,
  patch: { name?: string; emoji?: string }
): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .update({
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.emoji !== undefined ? { emoji: patch.emoji.trim() || "📦" } : {}),
    })
    .eq("id", categoryId)
    .eq("owner_id", ownerId);

  if (error) throw error;
}

/** 카테고리 순서 일괄 업데이트 */
export async function reorderCategories(
  ownerId: string,
  orderedIds: string[]
): Promise<void> {
  // 순서대로 sort_order 0, 1, 2, ...
  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase
        .from("categories")
        .update({ sort_order: idx })
        .eq("id", id)
        .eq("owner_id", ownerId)
    )
  );
}

/** 카테고리 삭제 (안에 아이템 있어도 category_id → null 처리됨 ON DELETE SET NULL) */
export async function deleteCategory(ownerId: string, categoryId: string): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("owner_id", ownerId);

  if (error) throw error;
}

// ─────────────────────────────────────────
// Collections CRUD
// ─────────────────────────────────────────

/**
 * 특정 카테고리의 수집 목록 불러오기
 * categoryId = null 이면 미분류(category_id IS NULL) 조회
 */
export async function fetchCollection(ownerId: string, categoryId: string | null) {
  let query = supabase
    .from("collections")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  } else {
    query = query.is("category_id", null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** 수집 아이템 추가 */
export async function insertCollectItem(
  ownerId: string,
  item: {
    id: string;
    title: string;
    image: string | null;
    link: string | null;
    originalPrice: number | null;
    usedPrice: number | null;
    salePrice?: number | null;
    status: "collecting" | "collected";
    sourceType?: "official" | "unknown" | null;
    myImage?: string | null;
    myMemo?: string | null;
  },
  categoryId: string | null
) {
  const payload = {
    id: item.id,
    owner_id: ownerId,
    category_id: categoryId,
    title: item.title,
    image: item.image,
    link: item.link,
    original_price: item.originalPrice,
    used_price: item.usedPrice,
    sale_price: item.salePrice ?? null,
    status: item.status,
    source_type: item.sourceType ?? null,
    my_image: item.myImage ?? null,
    my_memo: item.myMemo ?? null,
  };

  const { error } = await supabase.from("collections").insert(payload);
  if (error) throw error;
}

/** DB 컬럼(snake_case) 패치 타입 */
type DbCollectionPatch = {
  title?: string | null;
  image?: string | null;
  link?: string | null;
  original_price?: number | null;
  used_price?: number | null;
  sale_price?: number | null;
  status?: "collecting" | "collected";
  source_type?: "official" | "unknown" | null;
  my_image?: string | null;
  my_memo?: string | null;
};

/** 수집 아이템 업데이트 */
export async function updateCollectItem(
  ownerId: string,
  itemId: string,
  patch: {
    title?: string | null;
    image?: string | null;
    link?: string | null;
    originalPrice?: number | null;
    usedPrice?: number | null;
    salePrice?: number | null;
    status?: "collecting" | "collected";
    sourceType?: "official" | "unknown" | null;
    myImage?: string | null;
    myMemo?: string | null;
  }
) {
  const dbPatch: DbCollectionPatch = {};
  if ("title" in patch) dbPatch.title = patch.title;
  if ("image" in patch) dbPatch.image = patch.image;
  if ("link" in patch) dbPatch.link = patch.link;
  if ("originalPrice" in patch) dbPatch.original_price = patch.originalPrice;
  if ("usedPrice" in patch) dbPatch.used_price = patch.usedPrice;
  if ("salePrice" in patch) dbPatch.sale_price = patch.salePrice;
  if ("status" in patch) dbPatch.status = patch.status;
  if ("sourceType" in patch) dbPatch.source_type = patch.sourceType;
  if ("myImage" in patch) dbPatch.my_image = patch.myImage;
  if ("myMemo" in patch) dbPatch.my_memo = patch.myMemo;

  const { error } = await supabase
    .from("collections")
    .update(dbPatch)
    .eq("id", itemId)
    .eq("owner_id", ownerId);

  if (error) throw error;
}

/** 수집 아이템 삭제 */
export async function deleteCollectItem(ownerId: string, itemId: string) {
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", itemId)
    .eq("owner_id", ownerId);

  if (error) throw error;
}
