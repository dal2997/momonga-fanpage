// src/app/u/[handle]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import PublicCollectionGrid from "@/components/PublicCollectionGrid";
import OwnerManageButton from "@/components/OwnerManageButton";
import PublicStatsSummary from "@/components/PublicStatsSummary";
import { CHARACTERS, safeCharId, type CharacterId } from "@/data/characters";

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

/**
 * ✅ 공개 페이지는 "서버"에서 실행되고, 유저 세션 쿠키도 필요함.
 * RLS로:
 * - 공개(is_public=true) 프로필/컬렉션은 비로그인도 읽힘
 * - 비공개면 본인(auth.uid=id)일 때만 읽힘
 *
 * 그래서 persistSession=false 유지 + anon 키로 OK.
 */
function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, { auth: { persistSession: false } });
}

export default async function PublicUserPage(props: {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<{ tab?: string; char?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const handle = decodeURIComponent(params.handle ?? "").trim();
  const tab = safeTab(searchParams?.tab);
  const charId: CharacterId = safeCharId(searchParams?.char);
  const character = CHARACTERS.find((c) => c.id === charId)!;

  if (!handle) notFound();

  const supabase = getSupabaseServer();

  // =========================
  // 1) 프로필
  // =========================
  // ✅ 여기서 "is_public=false면 notFound"로 막아두면,
  // RLS로 본인에게만 열어주고 싶은 "비공개 미리보기"가 불가능해짐.
  // 그래서 profile 자체를 먼저 가져오고,
  // - 공개면 누구나 OK
  // - 비공개면: (RLS에서) 본인이 아니면 애초에 profile이 안 내려옴 => notFound
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url, is_public")
    .eq("handle", handle)
    .maybeSingle<ProfileRow>();

  if (profileErr) {
    // 보안상 정보 노출 줄이기: 그냥 notFound 처리
    notFound();
  }
  if (!profile) notFound();

  // =========================
  // 2) 컬렉션
  // =========================
  // ✅ 읽기 권한은 RLS가 처리:
  // - 공개 프로필이면 누구나 select 가능
  // - 비공개면 본인만 select 가능
  const { data: rows, error: rowsErr } = await supabase
    .from("collections")
    .select(
      "id, owner_id, title, image, link, original_price, used_price, status, my_image, my_memo, created_at"
    )
    .eq("owner_id", profile.id)
    .eq("character", charId)
    .order("created_at", { ascending: false })
    .returns<CollectionRow[]>();

  // 비공개인데 남이 접근하면 보통 rowsErr 혹은 rows가 null/[]로 떨어질 수 있음.
  // 프로필이 이미 내려왔다는 건 (RLS 기준) 접근 가능한 상태라서,
  // 여기서는 실패해도 "빈 배열"로 안전 처리.
  const all = rowsErr ? [] : rows ?? [];

  const filtered = tab === "all" ? all : all.filter((r) => r.status === tab);

  const collectingCount = all.filter((r) => r.status === "collecting").length;
  const collectedCount = all.filter((r) => r.status === "collected").length;

  // =========================
  // 3) 통계
  // =========================
  const sum = (xs: CollectionRow[]) =>
    xs.reduce((acc, r) => acc + (r.original_price ?? 0), 0);

  const collectedTotal = sum(all.filter((r) => r.status === "collected"));
  const collectingTotal = sum(all.filter((r) => r.status === "collecting"));
  const total = collectedTotal + collectingTotal;

  // 월별 누적 (실선/점선)
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

  // ✅ 공통 pill 스타일(라이트/다크 모두)
  const pillBase =
    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition";

  const pillLight =
    "border-black/10 bg-black/5 text-zinc-800 hover:bg-black/10 hover:border-black/15";

  const pillDark =
    "dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 dark:hover:border-white/20 dark:hover:text-white";

  const pill = `${pillBase} ${pillLight} ${pillDark}`;

  // ✅ 비공개 미리보기일 때(본인만 들어옴) 배지 노출
  const privateBadge = !profile.is_public ? (
    <span
      className={[
        "ml-2 inline-flex items-center rounded-full border px-2.5 py-1 text-xs",
        "border-amber-500/25 bg-amber-500/10 text-amber-700",
        "dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200",
      ].join(" ")}
    >
      비공개(본인만 보임)
    </span>
  ) : null;

  return (
    <main className="relative">
      <section className="mx-auto max-w-6xl px-5 pt-24 pb-24">
        {/* 상단 돌아가기 */}
        <div className="mb-5 flex items-center justify-between">
          <Link href="/" className={pill}>
            ← 홈
          </Link>

          <Link
            href="/"
            className={[
              "inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition",
              "border-black/10 bg-black/5 text-zinc-700 hover:bg-black/10 hover:text-zinc-900",
              "dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white",
            ].join(" ")}
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

        {/* ── 캐릭터 탭 */}
        <div className="mt-10 mb-2 flex items-center gap-2 flex-wrap">
          {CHARACTERS.map((c) => {
            const active = c.id === charId;
            return (
              <Link
                key={c.id}
                href={`/u/${encodeURIComponent(profile.handle)}?char=${c.id}&tab=${tab}`}
                className={[
                  "inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-medium transition",
                  active
                    ? "border-black/20 bg-black/10 text-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.10)] dark:border-white/20 dark:bg-white/12 dark:text-white dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                    : "border-black/10 bg-black/[0.03] text-zinc-500 hover:bg-black/[0.06] hover:text-zinc-800 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/40 dark:hover:bg-white/[0.07] dark:hover:text-white/70",
                ].join(" ")}
              >
                <span className="text-base">{c.emoji}</span>
                <span>{c.name}</span>
                {active && (
                  <span className="ml-0.5 rounded-full bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/10">
                    보는중
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Header */}
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={[
                "h-12 w-12 overflow-hidden rounded-2xl border",
                "border-black/10 bg-black/5",
                "dark:border-white/10 dark:bg-white/5",
              ].join(" ")}
            >
              {profile.avatar_url ? (
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
              <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-900 dark:text-white">
                <span>{profile.display_name ?? profile.handle}</span>
                {privateBadge}
              </h1>
              <p className="text-sm text-zinc-600 dark:text-white/60">
                @{profile.handle} · 수집중 {collectingCount} · 수집완료{" "}
                {collectedCount}
              </p>
            </div>
          </div>

          {/* Tabs + Owner */}
          <div className="flex flex-wrap gap-2">
            {(["all", "collecting", "collected"] as ViewTab[]).map((t) => {
              const active = tab === t;

              const tabBase =
                "group relative overflow-hidden rounded-full px-4 py-2 text-sm font-medium transition border";

              const tabLightActive =
                "border-black/20 bg-black/10 text-zinc-900";
              const tabLightInactive =
                "border-black/10 bg-black/5 text-zinc-700 hover:bg-black/10 hover:border-black/20 hover:text-zinc-900";

              const tabDarkActive =
                "dark:border-white/20 dark:bg-white/10 dark:text-white";
              const tabDarkInactive =
                "dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 dark:hover:border-white/20 dark:hover:text-white";

              return (
                <Link
                  key={t}
                  href={`/u/${encodeURIComponent(profile.handle)}?char=${charId}&tab=${t}`}
                  className={[
                    tabBase,
                    active ? tabLightActive : tabLightInactive,
                    active ? tabDarkActive : tabDarkInactive,
                    "shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)]",
                  ].join(" ")}
                >
                  {/* hover highlight */}
                  <span
                    aria-hidden
                    className="
                      pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300
                      group-hover:opacity-100
                      bg-[radial-gradient(900px_220px_at_20%_-10%,rgba(255,255,255,0.18),transparent_55%)]
                      dark:bg-[radial-gradient(900px_220px_at_20%_-10%,rgba(255,255,255,0.18),transparent_55%)]
                    "
                  />
                  <span className="relative">
                    {t === "all"
                      ? "전체"
                      : t === "collecting"
                      ? "수집중"
                      : "수집완료"}
                  </span>
                </Link>
              );
            })}

            {/* ✅ OwnerManageButton 내부에서 본인 여부 판정(현재 로그인 uid === ownerId)해서 버튼 숨기는 구조면 그대로 OK */}
            <OwnerManageButton ownerId={profile.id} />
          </div>
        </div>

        {/* Grid */}
        <div className="mt-8">
          <PublicCollectionGrid items={filtered} />
        </div>

        {filtered.length === 0 && (
          <div className="mt-10 text-zinc-600 dark:text-white/60">
            아직 공개된 카드가 없어.
          </div>
        )}
      </section>
    </main>
  );
}
