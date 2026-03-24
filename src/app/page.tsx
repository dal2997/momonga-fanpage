// src/app/page.tsx
import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import HomeClient from "./HomeClient";
import { PUBLIC_HANDLE } from "@/lib/config";

type ProfileRow = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  is_public: boolean;
};

type CollectionPreviewRow = {
  id: string;
  title: string | null;
  status: "collecting" | "collected";
  image: string | null;
  my_image: string | null;
  created_at: string;
};

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, { auth: { persistSession: false } });
}


export default async function Page() {
  const supabase = getSupabaseServer();

  // 1) 공개 프로필 가져오기
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url, is_public")
    .eq("handle", PUBLIC_HANDLE)
    .maybeSingle<ProfileRow>();

  // 2) 공개 수집 미리보기(최신 6개)
  let preview: CollectionPreviewRow[] = [];
  if (profile?.id && profile.is_public) {
    const { data: rows } = await supabase
      .from("collections")
      .select("id, title, status, image, my_image, created_at")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<CollectionPreviewRow[]>();

    preview = rows ?? [];
  }

  // 3) 오늘 방문자 수 (RPC 없으면 0으로 폴백)
  let todayVisits = 0;
  try {
    const { data: visitData } = await supabase.rpc("get_today_visit_count");
    if (typeof visitData === "number") todayVisits = visitData;
  } catch {
    // 마이그레이션 전이면 무시
  }

  return (
    <Suspense fallback={null}>
      <HomeClient
        publicHandle={PUBLIC_HANDLE}
        collectionPreview={preview}
        todayVisits={todayVisits}
      />
    </Suspense>
  );
}
