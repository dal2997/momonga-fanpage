// src/app/u/[handle]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import PublicCollectionGrid from "@/components/PublicCollectionGrid";
import OwnerManageButton from "@/components/OwnerManageButton";
import PublicStatsSummary from "@/components/PublicStatsSummary";

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
  const params = await props.params;
  const searchParams = await props.searchParams;

  const handle = decodeURIComponent(params.handle ?? "").trim();
  const tab = safeTab(searchParams?.tab);

  if (!handle) notFound();

  const supabase = getSupabaseServer();

  /* 1) 프로필 */
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url, is_public")
    .eq("handle", handle)
    .maybeSingle<ProfileRow>();

  if (!profile || !profile.is_public) notFound();

  /* 2) 컬렉션 */
  const { data: rows } = await supabase
    .from("collections")
    .select(
      "id, owner_id, title, image, link, original_price, used_price, status, my_image, my_memo, created_at"
    )
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false })
    .returns<CollectionRow[]>();

  const all = rows ?? [];
  const filtered = tab === "all" ? all : all.filter((r) => r.status === tab);

  const collectingCount = all.filter((r) => r.status === "collecting").length;
  const collectedCount = all.filter((r) => r.status === "collected").length;

  /* ===== 금액 합계 ===== */
  const sum = (xs: CollectionRow[]) => xs.reduce((acc, r) => acc + (r.original_price ?? 0), 0);

  const collectedTotal = sum(all.filter((r) => r.status === "collected"));
  const collectingTotal = sum(all.filter((r) => r.status === "collecting"));
  const total = collectedTotal + collectingTotal;

  /* ===== 월별 누적 (실선/점선) ===== */
  const monthMap = new Map<string, { collected: number; collecting: number }>();

  for (const r of all) {
    const d = new Date(r.created_at);
    if (Number.isNaN(d.getTime())) continue;

    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = monthMap.get(ym) ?? { collected: 0, collecting: 0 };
    const price = r.original_price ?? 0;

    if (r.status === "collected") cur.collected += price;
    else cur.collecting += price;

    monthMap.set(ym, cur);
  }

  const points = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ym, v]) => ({
      ym,
      collectedSum: v.collected,
      collectingSum: v.collecting,
      cumCollected: 0,
      cumTotal: 0,
    }));

  let runCollected = 0;
  let runTotal = 0;
  for (const p of points) {
    runCollected += p.collectedSum;
    runTotal += p.collectedSum + p.collectingSum;
    p.cumCollected = runCollected;
    p.cumTotal = runTotal;
  }

  return (
    <main className="relative">
      <section className="mx-auto max-w-6xl px-5 pt-24 pb-24">
        {/* 상단 돌아가기 */}
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/?tab=collection"
            className="
              inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition
              border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20
            "
          >
            ← 홈(수집탭)
          </Link>

          <Link
            href="/"
            className="
              inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition
              border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20
            "
          >
            홈으로
          </Link>
        </div>

        {/* ✅ 공개 수집 요약 + 그래프 */}
        <PublicStatsSummary
          total={total}
          collectedTotal={collectedTotal}
          collectingTotal={collectingTotal}
          points={points}
        />

        {/* Header */}
        <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="
                h-12 w-12 overflow-hidden rounded-2xl border
                border-white/10 bg-white/5
              "
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name ?? profile.handle}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm text-white/50">🙂</div>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-white">
                {profile.display_name ?? profile.handle}
              </h1>
              <p className="text-sm text-white/60">
                @{profile.handle} · 수집중 {collectingCount} · 수집완료 {collectedCount}
              </p>
            </div>
          </div>

          {/* Tabs + Owner */}
          <div className="flex flex-wrap gap-2">
            {(["all", "collecting", "collected"] as ViewTab[]).map((t) => {
              const active = tab === t;
              return (
                <Link
                  key={t}
                  href={`/u/${encodeURIComponent(profile.handle)}?tab=${t}`}
                  className={[
                    "group relative overflow-hidden rounded-full px-4 py-2 text-sm font-medium transition",
                    "border shadow-[0_12px_40px_rgba(0,0,0,0.25)]",
                    active
                      ? "border-white/20 bg-white/[0.10] text-white"
                      : "border-white/10 bg-white/[0.06] text-white/80 hover:bg-white/[0.10] hover:border-white/20 hover:text-white",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className="
                      pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300
                      group-hover:opacity-100
                      bg-[radial-gradient(900px_220px_at_20%_-10%,rgba(255,255,255,0.18),transparent_55%)]
                    "
                  />
                  <span className="relative">
                    {t === "all" ? "전체" : t === "collecting" ? "수집중" : "수집완료"}
                  </span>
                </Link>

              );
            })}

            <OwnerManageButton ownerId={profile.id} />
          </div>
        </div>

        {/* Grid */}
        <div className="mt-8">
          <PublicCollectionGrid items={filtered} />
        </div>

        {filtered.length === 0 && (
          <div className="mt-10 text-white/60">아직 공개된 카드가 없어.</div>
        )}
      </section>
    </main>
  );
}
