"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import TopTabs from "@/components/layout/TopTabs";

import Hero from "@/components/sections/Hero";
import Gallery from "@/components/sections/Gallery";
import Profile from "@/components/sections/Profile";
import Collection from "@/components/sections/Collection";

import GlassCard from "@/components/layout/GlassCard";
import { gallery } from "@/data/gallery";

type TabKey = "home" | "gallery" | "collection" | "profile";

const TAB_KEYS: TabKey[] = ["home", "gallery", "collection", "profile"];

function safeHomeTab(v: string | null): TabKey {
  if (!v) return "home";
  const lower = v.toLowerCase();
  return (TAB_KEYS as string[]).includes(lower) ? (lower as TabKey) : "home";
}

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ✅ URL 기준으로 최초 탭 세팅 (첫 렌더에서만)
  const initialTab = useMemo(
    () => safeHomeTab(searchParams.get("tab")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [tab, setTab] = useState<TabKey>(initialTab);

  // ✅ 뒤로가기/주소 직접 수정 등으로 쿼리가 바뀌면 탭도 동기화
  useEffect(() => {
    const urlTab = safeHomeTab(searchParams.get("tab"));
    setTab((prev) => (prev === urlTab ? prev : urlTab));
  }, [searchParams]);

  // ✅ 탭 변경 시 URL도 함께 갱신 (새로고침해도 상태 유지)
  const onChange = useCallback(
    (t: TabKey) => {
      setTab(t);
      const q = new URLSearchParams(Array.from(searchParams.entries()));
      if (t === "home") q.delete("tab");
      else q.set("tab", t);
      const qs = q.toString();
      router.replace(qs ? `/?${qs}` : `/`);
    },
    [router, searchParams]
  );

  const galleryPreview = useMemo(() => gallery.slice(0, 4), []);

  // ✅ 여기만 바꿔서 나중에 핸들/경로 바뀌어도 한 군데만 수정하면 됨
  const publicHandle = "dal2997";
  const publicCollectionHref = `/u/${encodeURIComponent(publicHandle)}`;

  return (
    <main className="relative">
      <TopTabs value={tab} onChange={onChange} />

      <div className="mx-auto max-w-6xl px-5 pt-24 pb-24">
        {tab === "home" && (
          <div className="space-y-16">
            <Hero />

            {/* 순간 미리보기 */}
            <section className="scroll-mt-24">
              <div className="flex items-end justify-between">
                <h2 className="text-2xl font-semibold">순간 미리보기</h2>
                <button
                  type="button"
                  onClick={() => onChange("gallery")}
                  className="text-sm text-white/60 hover:text-white"
                >
                  전체 보기 →
                </button>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {galleryPreview.map((item) => (
                  <GlassCard key={item.id} className="overflow-hidden p-0">
                    <div className="relative h-[200px] w-full overflow-hidden rounded-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.title}
                        className="block h-full w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/0" />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
                          {item.tag}
                        </div>
                        <div className="mt-3 text-lg font-semibold">
                          {item.title}
                        </div>
                        <div className="mt-1 text-sm text-white/70">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </section>

            {/* 수집 미리보기 */}
            <section className="scroll-mt-24">
              <div className="flex items-end justify-between">
                <h2 className="text-2xl font-semibold">수집 미리보기</h2>

                <Link
                  href={publicCollectionHref}
                  className="text-sm text-white/60 hover:text-white"
                >
                  모몽가 수집(공개) →
                </Link>
              </div>

              <div className="mt-4">
                <GlassCard className="p-6">
                  <div className="text-sm text-white/60">TIP</div>
                  <div className="mt-2 text-lg font-semibold">
                    수집중 → 수집완료로 옮기면서 내 굿즈 아카이브를 쌓자
                  </div>
                  <div className="mt-3 text-sm text-white/60">
                    원가/중고가를 (선택)으로 기록해두면, 나중에 판매 기능 붙일 때
                    바로 자산/거래 데이터로 이어짐.
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={publicCollectionHref}
                      className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/15"
                    >
                      모몽가 수집 보러가기(공개)
                    </Link>

                    <button
                      type="button"
                      onClick={() => onChange("collection")}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                    >
                      내 수집 관리(로그인)
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-white/45">
                    공개 페이지는 누구나 볼 수 있고, 수정/추가는 로그인한 본인만 가능해.
                  </div>
                </GlassCard>
              </div>
            </section>

            {/* 프로필 미리보기 */}
            <section className="scroll-mt-24">
              <div className="flex items-end justify-between">
                <h2 className="text-2xl font-semibold">프로필 미리보기</h2>
                <button
                  type="button"
                  onClick={() => onChange("profile")}
                  className="text-sm text-white/60 hover:text-white"
                >
                  전체 보기 →
                </button>
              </div>

              <div className="mt-4">
                <GlassCard className="p-6">
                  <div className="text-sm text-white/60">나의 덕질 상태</div>
                  <div className="mt-2 text-lg font-semibold">
                    좋아하는 포인트 / 취향 태그를 정리해두면 기록이 더 재밌어짐
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange("profile")}
                    className="mt-5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                  >
                    프로필 수정하러 가기
                  </button>
                </GlassCard>
              </div>
            </section>
          </div>
        )}

        {tab === "gallery" && <Gallery />}
        {tab === "collection" && <Collection />}
        {tab === "profile" && <Profile />}
      </div>
    </main>
  );
}
