"use client";

import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/layout/GlassCard";
import type { GoodsItem } from "@/data/goods";
import { initialCollected, initialCollecting } from "@/data/goods";

type SubTab = "collecting" | "collected";

const LS_KEY = "momonga.goods.v1";

function safeParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function formatKRW(n: number) {
  return new Intl.NumberFormat("ko-KR").format(n) + "원";
}

export default function Collection() {
  const [sub, setSub] = useState<SubTab>("collecting");

  const [collecting, setCollecting] = useState<GoodsItem[]>([]);
  const [collected, setCollected] = useState<GoodsItem[]>([]);

  const [open, setOpen] = useState<GoodsItem | null>(null);

  // 이동 폼(수집완료로 이동 시 내 사진/메모)
  const [movePhoto, setMovePhoto] = useState("");
  const [moveMemo, setMoveMemo] = useState("");

  // 추가 폼(수집중 추가)
  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addImage, setAddImage] = useState("");
  const [addShop, setAddShop] = useState("");

  // 1) 최초 로드: localStorage 있으면 그거 사용, 없으면 초기값
  useEffect(() => {
    const saved = safeParse<{ collecting: GoodsItem[]; collected: GoodsItem[] }>(
      localStorage.getItem(LS_KEY)
    );

    if (saved?.collecting && saved?.collected) {
      setCollecting(saved.collecting);
      setCollected(saved.collected);
    } else {
      setCollecting(initialCollecting);
      setCollected(initialCollected);
    }
  }, []);

  // 2) 상태가 바뀔 때마다 localStorage 저장
  useEffect(() => {
    // 아직 초기 로드 전(빈배열)일 수도 있으니, 둘 중 하나라도 채워졌을 때부터 저장
    if (collecting.length === 0 && collected.length === 0) return;
    localStorage.setItem(LS_KEY, JSON.stringify({ collecting, collected }));
  }, [collecting, collected]);

  // ESC로 모달 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setAddOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const list = useMemo(() => {
    return sub === "collecting" ? collecting : collected;
  }, [sub, collecting, collected]);

  const openItem = (item: GoodsItem) => {
    setOpen(item);
    setMovePhoto(item.myPhoto ?? "");
    setMoveMemo(item.memo ?? "");
  };

  const moveToCollected = () => {
    if (!open) return;

    // open이 collecting일 때만 이동
    const fromId = open.id;

    const target: GoodsItem = {
      ...open,
      status: "collected",
      myPhoto: movePhoto.trim() || undefined,
      memo: moveMemo.trim() || undefined,
      collectedAt: new Date().toISOString(),
    };

    setCollecting((prev) => prev.filter((x) => x.id !== fromId));
    setCollected((prev) => [target, ...prev]);

    setOpen(null);
    setSub("collected");
  };

  const addCollectingItem = () => {
    const title = addTitle.trim();
    const priceNum = Number(addPrice);
    const image = addImage.trim();

    if (!title) return alert("제목을 입력해줘!");
    if (!image) return alert("이미지 URL/경로를 입력해줘!");
    if (!Number.isFinite(priceNum) || priceNum <= 0) return alert("가격은 숫자로(0보다 크게) 입력!");

    const item: GoodsItem = {
      id: "g-" + Math.random().toString(16).slice(2),
      title,
      price: priceNum,
      image,
      shopUrl: addShop.trim() || undefined,
      status: "collecting",
    };

    setCollecting((prev) => [item, ...prev]);
    setAddOpen(false);

    // 폼 리셋
    setAddTitle("");
    setAddPrice("");
    setAddImage("");
    setAddShop("");
  };

  return (
    <section id="collection" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">수집</h2>
          <p className="mt-1 text-sm text-white/55">
            “수집중”에서 “수집완료”로 옮기면서 내 굿즈 아카이브를 만든다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur">
            <button
              className={[
                "h-9 rounded-full px-4 text-xs transition-colors",
                sub === "collecting" ? "bg-white/10 text-white" : "text-white/70 hover:text-white",
              ].join(" ")}
              onClick={() => setSub("collecting")}
              type="button"
            >
              수집중
            </button>
            <button
              className={[
                "h-9 rounded-full px-4 text-xs transition-colors",
                sub === "collected" ? "bg-white/10 text-white" : "text-white/70 hover:text-white",
              ].join(" ")}
              onClick={() => setSub("collected")}
              type="button"
            >
              수집완료
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setAddOpen(true);
              setSub("collecting");
            }}
            className="h-10 rounded-full border border-white/10 bg-white/5 px-4 text-xs text-white/85 hover:bg-white/10"
          >
            + 수집중 추가
          </button>
        </div>
      </div>

      {/* 그리드: 요청대로 3열(중간 이상) */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {list.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openItem(item)}
            className="text-left"
            aria-label={item.title}
          >
            <GlassCard className="group overflow-hidden p-0">
              <div className="relative h-[210px] w-full overflow-hidden rounded-2xl">
                <img
                  src={item.image}
                  alt={item.title}
                  className="block h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/0" />

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-white/80 backdrop-blur">
                    {item.status === "collecting" ? "수집중" : "수집완료"}
                  </div>

                  <div className="mt-2 text-sm font-semibold">{item.title}</div>
                  <div className="mt-1 text-xs text-white/70">{formatKRW(item.price)}</div>
                </div>
              </div>

              <div className="pointer-events-none h-10 w-full bg-white/[0.02] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </GlassCard>
          </button>
        ))}
      </div>

      {/* 상세 모달 */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center px-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(null)}
            aria-label="close"
          />

          <div className="relative w-full max-w-3xl">
            <GlassCard className="overflow-hidden p-0">
              <div className="relative h-[360px] w-full overflow-hidden">
                <img src={open.image} alt={open.title} className="block h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/0" />

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/85 backdrop-blur">
                      {open.status === "collecting" ? "수집중" : "수집완료"}
                    </div>
                    <div className="text-sm text-white/70">{formatKRW(open.price)}</div>
                  </div>

                  <div className="mt-3 text-2xl font-semibold">{open.title}</div>

                  {open.shopUrl && (
                    <a
                      className="mt-2 inline-block text-sm text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white/90"
                      href={open.shopUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      구매/정보 링크 열기
                    </a>
                  )}
                </div>
              </div>

              <div className="px-6 py-5">
                {open.status === "collecting" ? (
                  <>
                    <div className="text-sm font-semibold">수집완료로 이동</div>
                    <p className="mt-1 text-xs text-white/55">
                      내 굿즈 사진(선택)과 메모(선택)를 적고 “수집완료”로 옮긴다.
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <label className="block">
                        <div className="text-xs text-white/60">내 사진 URL (선택)</div>
                        <input
                          value={movePhoto}
                          onChange={(e) => setMovePhoto(e.target.value)}
                          placeholder="https://... 또는 /images/..."
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/20"
                        />
                      </label>

                      <label className="block">
                        <div className="text-xs text-white/60">메모 (선택)</div>
                        <input
                          value={moveMemo}
                          onChange={(e) => setMoveMemo(e.target.value)}
                          placeholder="예: 배송기다리는중 / 실물 미쳤다"
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/20"
                        />
                      </label>
                    </div>

                    {movePhoto.trim() && (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <div className="px-4 py-3 text-xs text-white/60">미리보기(내 사진)</div>
                        <img src={movePhoto} alt="my photo preview" className="block h-[220px] w-full object-cover" />
                      </div>
                    )}

                    <div className="mt-5 flex items-center justify-between">
                      <p className="text-sm text-white/55">ESC로 닫기</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setOpen(null)}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                        >
                          닫기
                        </button>
                        <button
                          type="button"
                          onClick={moveToCollected}
                          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
                        >
                          수집완료로 이동
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold">수집완료 정보</div>
                    <p className="mt-1 text-xs text-white/55">완료된 굿즈는 기록용으로 남긴다.</p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-white/60">메모</div>
                        <div className="mt-2 text-sm text-white/80">{open.memo || "—"}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-white/60">수집일</div>
                        <div className="mt-2 text-sm text-white/80">
                          {open.collectedAt ? new Date(open.collectedAt).toLocaleString("ko-KR") : "—"}
                        </div>
                      </div>
                    </div>

                    {open.myPhoto && (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <div className="px-4 py-3 text-xs text-white/60">내 사진</div>
                        <img src={open.myPhoto} alt="my photo" className="block h-[260px] w-full object-cover" />
                      </div>
                    )}

                    <div className="mt-5 flex items-center justify-between">
                      <p className="text-sm text-white/55">ESC로 닫기</p>
                      <button
                        type="button"
                        onClick={() => setOpen(null)}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                      >
                        닫기
                      </button>
                    </div>
                  </>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* 수집중 추가 모달 */}
      {addOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center px-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setAddOpen(false)}
            aria-label="close"
          />

          <div className="relative w-full max-w-xl">
            <GlassCard className="p-6">
              <div className="text-lg font-semibold">수집중 추가</div>
              <p className="mt-1 text-sm text-white/55">
                이미지 경로는 <span className="text-white/80">/images/...</span> 또는 <span className="text-white/80">https://...</span> 둘 다 가능.
              </p>

              <div className="mt-5 grid gap-3">
                <label className="block">
                  <div className="text-xs text-white/60">제목</div>
                  <input
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/20"
                    placeholder="예: 모몽가 키링 (한정판)"
                  />
                </label>

                <label className="block">
                  <div className="text-xs text-white/60">가격(숫자)</div>
                  <input
                    value={addPrice}
                    onChange={(e) => setAddPrice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/20"
                    placeholder="예: 12000"
                  />
                </label>

                <label className="block">
                  <div className="text-xs text-white/60">이미지 URL/경로</div>
                  <input
                    value={addImage}
                    onChange={(e) => setAddImage(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/20"
                    placeholder="/images/momonga/01.jpg 또는 https://..."
                  />
                </label>

                <label className="block">
                  <div className="text-xs text-white/60">구매/정보 링크(선택)</div>
                  <input
                    value={addShop}
                    onChange={(e) => setAddShop(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/20"
                    placeholder="https://..."
                  />
                </label>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-white/55">ESC로 닫기</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAddOpen(false)}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    onClick={addCollectingItem}
                    className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
                  >
                    추가
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </section>
  );
}
