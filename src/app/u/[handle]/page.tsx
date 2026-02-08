// src/app/u/[handle]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import PublicCollectionGrid from "@/components/PublicCollectionGrid";
import OwnerManageButton from "@/components/OwnerManageButton";

type ViewTab = "all" | "collecting" | "collected";

type ProfileRow = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  is_public: boolean;
};

export type CollectionRow = {
  id: string;
  owner_id: string;
  title: string | null;
  image: string | null;
  link: string | null;
  original_price: number | null;
  used_price: number | null;
  status: "collecting" | "collected";
  my_image: string | null;
  my_memo: string | null;
  created_at: string;
};

function safeTab(v?: string): ViewTab {
  if (v === "collecting" || v === "collected" || v === "all") return v;
  return "all";
}

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, { auth: { persistSession: false } });
}

export default async function PublicUserPage(props: {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  /** ✅ Next.js 16: params/searchParams는 Promise일 수 있음 */
  const params = await props.params;
  const searchParams = await props.searchParams;

  const handle = decodeURIComponent(params.handle ?? "").trim();
  const tab = safeTab(searchParams?.tab);

  if (!handle) notFound();

  const supabase = getSupabaseServer();

  /** 1) 프로필 */
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url, is_public")
    .eq("handle", handle)
    .maybeSingle<ProfileRow>();

  if (profileErr) console.error("profiles fetch error:", profileErr);
  if (!profile || !profile.is_public) notFound();

  /** 2) 컬렉션 */
  const { data: rows, error: colErr } = await supabase
    .from("collections")
    .select(
      "id, owner_id, title, image, link, original_price, used_price, status, my_image, my_memo, created_at"
    )
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false })
    .returns<CollectionRow[]>();

  if (colErr) console.error("collections fetch error:", colErr);

  const all = rows ?? [];
  const filtered = tab === "all" ? all : all.filter((r) => r.status === tab);

  const collectingCount = all.filter((r) => r.status === "collecting").length;
  const collectedCount = all.filter((r) => r.status === "collected").length;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {/* 상단 돌아가기 */}
      <div className="mb-5 flex items-center justify-between">
        <Link
          href="/?tab=collection"
          className="
            inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition
            border-black/10 bg-black/5 text-zinc-700 hover:bg-black/10
            dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10
          "
        >
          ← 홈(수집탭)
        </Link>

        <Link
          href="/"
          className="
            inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition
            border-black/10 text-zinc-600 hover:bg-black/5 hover:text-zinc-900
            dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white
          "
        >
          홈으로
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="
              h-12 w-12 overflow-hidden rounded-2xl border
              border-black/10 bg-black/5
              dark:border-white/10 dark:bg-white/5
            "
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? profile.handle}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-sm text-zinc-500 dark:text-white/50">
                🙂
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {profile.display_name ?? profile.handle}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-white/60">
              @{profile.handle} · 수집중 {collectingCount} · 수집완료 {collectedCount}
            </p>
          </div>
        </div>

        {/* Tabs + Owner Button */}
        <div className="flex flex-wrap gap-2">
          {(["all", "collecting", "collected"] as ViewTab[]).map((t) => {
            const active = tab === t;
            return (
              <Link
                key={t}
                href={`/u/${encodeURIComponent(profile.handle)}?tab=${t}`}
                className={[
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  // 기본(라이트)
                  active
                    ? "border-black/20 bg-black/10 text-zinc-900"
                    : "border-black/10 bg-black/5 text-zinc-700 hover:bg-black/10 hover:border-black/20",
                  // 다크
                  active
                    ? "dark:border-white/20 dark:bg-white/10 dark:text-white"
                    : "dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 dark:hover:border-white/20",
                ].join(" ")}
              >
                {t === "all" ? "전체" : t === "collecting" ? "수집중" : "수집완료"}
              </Link>
            );
          })}

          <OwnerManageButton ownerId={profile.id} />
        </div>
      </div>

      {/* Grid + Modal */}
      <div className="mt-8">
        <PublicCollectionGrid items={filtered} />
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 text-zinc-600 dark:text-white/60">
          아직 공개된 카드가 없어.
        </div>
      )}
    </section>
  );

}
