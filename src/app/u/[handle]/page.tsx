// app/u/[handle]/page.tsx
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
  /** ✅ Next.js 16 */
  const params = await props.params;
  const searchParams = await props.searchParams;

  const handle = decodeURIComponent(params.handle ?? "").trim();
  const tab = safeTab(searchParams?.tab);

  if (!handle) notFound();

  const supabase = getSupabaseServer();

  /** 1️⃣ 프로필 */
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url, is_public")
    .eq("handle", handle)
    .maybeSingle<ProfileRow>();

  if (profileErr) console.error("profiles fetch error:", profileErr);
  if (!profile || !profile.is_public) notFound();

  /** 2️⃣ 컬렉션 */
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
      {/* ✅ 상단: 뒤로가기(홈 수집탭) */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/?tab=collection"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          ← 홈(수집탭)
        </Link>

        {/* 필요하면 우측에 홈으로도 */}
        <Link
          href="/"
          className="text-sm text-white/50 hover:text-white/70"
        >
          홈으로
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? profile.handle}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-sm text-white/50">
                🙂
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-semibold">
              {profile.display_name ?? profile.handle}
            </h1>
            <p className="text-sm text-white/60">
              @{profile.handle} · 수집중 {collectingCount} · 수집완료 {collectedCount}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "collecting", "collected"] as ViewTab[]).map((t) => (
            <Link
              key={t}
              href={`/u/${encodeURIComponent(profile.handle)}?tab=${t}`}
              className={`rounded-full px-4 py-2 text-sm border ${
                tab === t
                  ? "border-white/20 bg-white/15"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              {t === "all" ? "전체" : t === "collecting" ? "수집중" : "수집완료"}
            </Link>
          ))}

          {/* ✅ 본인일 때만 보이는 버튼 (컴포넌트 내부에서 체크) */}
          <OwnerManageButton ownerId={profile.id} />
        </div>
      </div>

      {/* Grid + Modal (client) */}
      <div className="mt-8">
        <PublicCollectionGrid items={filtered} />
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 text-white/60">아직 공개된 카드가 없어.</div>
      )}
    </section>
  );
}
