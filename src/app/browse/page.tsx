// src/app/browse/page.tsx  —  Server Component
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import BrowseClient from "./BrowseClient";

export const metadata: Metadata = { title: "탐색 | momonga.app" };
export const revalidate = 60;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

// OfferModal 등에서 여전히 사용
export type BrowseItem = {
  id: string;
  title: string | null;
  image: string | null;
  my_image: string | null;
  original_price: number | null;
  used_price: number | null;
  sale_price: number | null;       // 판매 희망가
  status: "collecting" | "collected";
  created_at: string;
  owner_id: string;
  owner_handle: string;
  owner_display_name: string | null;
  cat_name: string | null;
  cat_emoji: string | null;
};

export type UserCard = {
  owner_id: string;
  owner_handle: string;
  owner_display_name: string | null;
  owner_bio: string | null;
  owner_avatar: string | null;
  item_count: number;
  view_count: number;
  preview_items: BrowseItem[]; // 최대 5개
};

export default async function BrowsePage() {
  const supabase = getSupabase();

  // ① 공개 프로필 (bio, avatar_url, view_count 포함)
  const { data: pubProfiles } = await supabase
    .from("profiles")
    .select("id, handle, display_name, bio, avatar_url, view_count")
    .eq("is_public", true);

  type ProfileRow = {
    id: string;
    handle: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    view_count: number;
  };

  const profiles: ProfileRow[] = (pubProfiles ?? []) as ProfileRow[];
  const pubIds = profiles.map((p) => p.id);

  if (pubIds.length === 0) {
    return <BrowseClient userCards={[]} />;
  }

  // ② 공개 유저들의 수집품 전체 (유저카드용, 많이 가져옴)
  const { data, error } = await supabase
    .from("collections")
    .select(
      "id, title, image, my_image, original_price, used_price, status, created_at, owner_id, categories(name, emoji)"
    )
    .in("owner_id", pubIds)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[browse] fetch error:", error);
  }

  // ③ owner_id별로 그룹핑
  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const groupMap = new Map<string, BrowseItem[]>();

  for (const r of (data ?? []) as any[]) {
    const item: BrowseItem = {
      id: r.id,
      title: r.title,
      image: r.image,
      my_image: r.my_image,
      original_price: r.original_price,
      used_price: r.used_price,
      sale_price: r.sale_price ?? null,
      status: r.status,
      created_at: r.created_at,
      owner_id: r.owner_id,
      owner_handle: profileMap[r.owner_id]?.handle ?? "",
      owner_display_name: profileMap[r.owner_id]?.display_name ?? null,
      cat_name: r.categories?.name ?? null,
      cat_emoji: r.categories?.emoji ?? null,
    };
    if (!groupMap.has(r.owner_id)) groupMap.set(r.owner_id, []);
    groupMap.get(r.owner_id)!.push(item);
  }

  // ④ UserCard 배열 생성 (수집품 많은 유저 순)
  const userCards: UserCard[] = profiles
    .map((p) => {
      const items = groupMap.get(p.id) ?? [];
      // 이미지 있는 것 우선 5개
      const withImg = items.filter(
        (i) => i.image || i.my_image
      );
      const preview = [
        ...withImg,
        ...items.filter((i) => !i.image && !i.my_image),
      ].slice(0, 5);

      return {
        owner_id: p.id,
        owner_handle: p.handle,
        owner_display_name: p.display_name,
        owner_bio: p.bio,
        owner_avatar: p.avatar_url,
        item_count: items.length,
        view_count: (p as ProfileRow).view_count ?? 0,
        preview_items: preview,
      };
    })
    .filter((c) => c.item_count > 0) // 수집품 없는 유저 제외
    // 기본 정렬: 인기순(view_count) → 동점이면 수집품 많은 순
    .sort((a, b) => b.view_count - a.view_count || b.item_count - a.item_count);

  return <BrowseClient userCards={userCards} />;
}
