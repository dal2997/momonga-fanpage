"use client";

import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/layout/GlassCard";
import { CollectItem } from "@/data/collection";
import { loadCollection, saveCollection } from "@/lib/collectionStore";

type ViewMode = "collecting" | "collected";

function formatPrice(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return `${n.toLocaleString()}원`;
}
function parsePrice(input: string) {
  const raw = input.replaceAll(",", "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export default function Collection() {
  const [view, setView] = useState<ViewMode>("collecting");
  const [collecting, setCollecting] = useState<CollectItem[]>([]);
  const [collected, setCollected] = useState<CollectItem[]>([]);
  const [open, setOpen] = useState<CollectItem | null>(null);

  // 수집완료 이동 입력(내 사진/메모)
  const [myFile, setMyFile] = useState<File | null>(null);
  const [myMemo, setMyMemo] = useState("");

  // 수정 모드(링크/가격/제목)
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editOriginal, setEditOriginal] = useState("");
  const [editUsed, setEditUsed] = useState("");

  // 수집중 추가 모달
  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addLink, setAddLink] = useState("");
  const [addOriginal, setAddOriginal] = useState("");
  const [addUsed, setAddUsed] = useState("");

  // 이미지 입력: URL or Upload
  const [addImageMode, setAddImageMode] = useState<"url" | "upload">("url");
  const [addImageUrl, setAddImageUrl] = useState("");
  const [addImageFile, setAddImageFile] = useState<File | null>(null);

  useEffect(() => {
    const store = loadCollection();
    setCollecting(store.collecting);
    setCollected(store.collected);
  }, []);

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(null);
      setAddOpen(false);
      setEditMode(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const list = useMemo(
    () => (view === "collecting" ? collecting : collected),
    [view, collecting, collected]
  );

  function persist(nextCollecting: CollectItem[], nextCollected: CollectItem[]) {
    setCollecting(nextCollecting);
    setCollected(nextCollected);
    saveCollection({ collecting: nextCollecting, collected: nextCollected });
  }

  async function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function moveToCollected(item: CollectItem) {
    const myImage = myFile ? await fileToDataUrl(myFile) : null;

    const moved: CollectItem = {
      ...item,
      status: "collected",
      myImage,
      myMemo: myMemo.trim() ? myMemo.trim() : null,
    };

    const nextCollecting = collecting.filter((x) => x.id !== item.id);
    const nextCollected = [moved, ...collected];

    persist(nextCollecting, nextCollected);
    setOpen(null);
    setMyFile(null);
    setMyMemo("");
    setEditMode(false);
  }

  function resetAddForm() {
    setAddTitle("");
    setAddLink("");
    setAddOriginal("");
    setAddUsed("");
    setAddImageMode("url");
    setAddImageUrl("");
    setAddImageFile(null);
  }

  async function submitAddCollecting() {
    const title = addTitle.trim();
    if (!title) {
      alert("이름(제목)은 필수야.");
      return;
    }

    let image: string | null = null;

    if (addImageMode === "url") {
      const url = addImageUrl.trim();
      if (!url) {
        alert("이미지 URL을 넣거나, 업로드로 바꿔서 파일을 올려줘.");
        return;
      }
      image = url;
    } else {
      if (!addImageFile) {
        alert("이미지 파일을 선택해줘.");
        return;
      }
      image = await fileToDataUrl(addImageFile);
    }

    const originalPrice = parsePrice(addOriginal);
    const usedPrice = parsePrice(addUsed);

    const next: CollectItem = {
      id: crypto.randomUUID(),
      title,
      image,
      link: addLink.trim() ? addLink.trim() : null,
      originalPrice,
      usedPrice,
      status: "collecting",
    };

    const nextCollecting = [next, ...collecting];
    persist(nextCollecting, collected);

    setAddOpen(false);
    resetAddForm();
  }

  function openDetail(item: CollectItem) {
    setOpen(item);
    setEditMode(false);

    setEditTitle(item.title ?? "");
    setEditLink(item.link ?? "");
    setEditOriginal(item.originalPrice === null || item.originalPrice === undefined ? "" : String(item.originalPrice));
    setEditUsed(item.usedPrice === null || item.usedPrice === undefined ? "" : String(item.usedPrice));
  }

  function saveEdit() {
    if (!open) return;

    const nextItem: CollectItem = {
      ...open,
      title: editTitle.trim() ? editTitle.trim() : open.title,
      link: editLink.trim() ? editLink.trim() : null,
      originalPrice: parsePrice(editOriginal),
      usedPrice: parsePrice(editUsed),
    };

    if (open.status === "collecting") {
      const nextCollecting = collecting.map((x) => (x.id === open.id ? nextItem : x));
      persist(nextCollecting, collected);
    } else {
      const nextCollected = collected.map((x) => (x.id === open.id ? nextItem : x));
      persist(collecting, nextCollected);
    }

    setOpen(nextItem);
    setEditMode(false);
  }

  return (
    <section id="collection" className="scroll-mt-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">수집</h2>
          <p className="mt-1 text-sm text-white/50">
            “수집중”에서 “수집완료”로 옮기며 내 굿즈 아카이브를 만든다
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView("collecting")}
            className={`rounded-full border px-4 py-2 text-sm ${
              view === "collecting"
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            수집중
          </button>

          <button
            type="button"
            onClick={() => setView("collected")}
            className={`rounded-full border px-4 py-2 text-sm ${
              view === "collected"
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            수집완료
          </button>

          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="ml-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            + 수집중 추가
          </button>
        </div>
      </div>

      {/* ✅ 3열 그리드 */}
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {list.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openDetail(item)}
            className="text-left"
          >
            <GlassCard className="group overflow-hidden p-0">
              <div className="relative h-[220px] w-full overflow-hidden rounded-2xl">
                {/* ✅ collected라도 카드 대표는 "시중 이미지" 유지 (내 사진은 모달에서 나란히) */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="block h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/0" />

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
                    {item.status === "collecting" ? "수집중" : "수집완료"}
                    <span className="text-white/40">•</span>
                    <span className="text-white/70">
                      원가 {formatPrice(item.originalPrice)} / 중고 {formatPrice(item.usedPrice)}
                    </span>
                  </div>

                  <div className="mt-3 text-lg font-semibold">{item.title}</div>

                  {/* ✅ 링크가 있으면 카드에서도 한 줄 보여주기 */}
                  {item.link ? (
                    <div className="mt-1 text-xs text-white/65 underline underline-offset-4">
                      링크 있음 (클릭해서 열기/수정)
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-white/40">링크 없음</div>
                  )}
                </div>
              </div>

              <div className="pointer-events-none h-10 w-full bg-white/[0.02] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </GlassCard>
          </button>
        ))}
      </div>

      {/* 상세 모달 */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setOpen(null);
              setEditMode(false);
            }}
          />

          <div className="relative w-full max-w-5xl">
            <GlassCard className="overflow-hidden p-0">
              {/* ✅ 수집완료면: 시중 이미지 + 내 사진을 나란히(있으면) */}
              <div className="grid md:grid-cols-2">
                <div className="relative h-[360px] w-full overflow-hidden">
                  <img
                    src={open.image}
                    alt={open.title}
                    className="block h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/0" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
                      {open.status === "collecting" ? "수집중" : "수집완료"}
                      <span className="text-white/40">•</span>
                      <span className="text-white/70">
                        원가 {formatPrice(open.originalPrice)} / 중고 {formatPrice(open.usedPrice)}
                      </span>
                    </div>
                    <div className="mt-3 text-3xl font-semibold">{open.title}</div>

                    {/* ✅ 링크는 “텍스트로” 확실히 보여주기 */}
                    {open.link ? (
                      <a
                        className="mt-2 inline-block text-sm text-white/70 underline underline-offset-4 hover:text-white"
                        href={open.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        구매/정보 링크 열기
                      </a>
                    ) : (
                      <div className="mt-2 text-sm text-white/50">링크 없음</div>
                    )}
                  </div>
                </div>

                {/* 오른쪽: 내 사진(수집완료일 때만 보여주고, 없으면 안내) */}
                <div className="relative h-[360px] w-full overflow-hidden bg-white/[0.02]">
                  {open.status === "collected" ? (
                    open.myImage ? (
                      <img
                        src={open.myImage}
                        alt="내 수집품 사진"
                        className="block h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center p-8 text-white/60">
                        내 사진이 아직 없어. (나중에 추가 가능)
                      </div>
                    )
                  ) : (
                    <div className="grid h-full place-items-center p-8 text-white/60">
                      수집완료로 옮기면 “내 사진” 영역이 생겨.
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-5">
                {/* 상단 액션: 수정 버튼 */}
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">
                    {open.status === "collecting" ? "수집중 상세" : "내 수집품"}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditMode((v) => !v)}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                    >
                      {editMode ? "수정 취소" : "수정"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpen(null);
                        setEditMode(false);
                      }}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                    >
                      닫기
                    </button>
                  </div>
                </div>

                {/* ✅ 수정 모드: 제목/링크/가격 수정 */}
                {editMode && (
                  <div className="mt-4 grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-sm text-white/70">이름</div>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30 focus:border-white/20"
                        />
                      </div>

                      <div>
                        <div className="text-sm text-white/70">구매/정보 링크</div>
                        <input
                          value={editLink}
                          onChange={(e) => setEditLink(e.target.value)}
                          placeholder="https://..."
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30 focus:border-white/20"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-sm text-white/70">원가</div>
                        <input
                          value={editOriginal}
                          onChange={(e) => setEditOriginal(e.target.value)}
                          placeholder="예: 12000"
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30 focus:border-white/20"
                        />
                      </div>
                      <div>
                        <div className="text-sm text-white/70">중고가</div>
                        <input
                          value={editUsed}
                          onChange={(e) => setEditUsed(e.target.value)}
                          placeholder="예: 8000"
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30 focus:border-white/20"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/15"
                      >
                        수정 저장
                      </button>
                    </div>
                  </div>
                )}

                {/* 수집중일 때: 수집완료로 이동 UI */}
                {open.status === "collecting" && (
                  <>
                    <div className="mt-6 text-sm text-white/55">
                      내 굿즈 사진(선택)과 메모(선택)를 적고 “수집완료로 이동”을 누르면 저장돼.
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-sm text-white/70">내 사진 업로드 (선택)</div>
                        <label className="mt-2 inline-flex cursor-pointer items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
                          파일 선택
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setMyFile(e.target.files?.[0] ?? null)}
                          />
                          <span className="text-white/40">{myFile ? myFile.name : "선택된 파일 없음"}</span>
                        </label>
                      </div>

                      <div>
                        <div className="text-sm text-white/70">메모 (선택)</div>
                        <input
                          value={myMemo}
                          onChange={(e) => setMyMemo(e.target.value)}
                          placeholder="예: 배송기다리는중 / 실물 미쳤다"
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30 focus:border-white/20"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-white/55">ESC로 닫기</p>
                      <button
                        type="button"
                        onClick={() => moveToCollected(open)}
                        className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
                      >
                        수집완료로 이동
                      </button>
                    </div>
                  </>
                )}

                {/* 수집완료일 때: 메모 표시 */}
                {open.status === "collected" && (
                  <div className="mt-4 text-sm text-white/70">
                    {open.myMemo ? open.myMemo : "메모 없음"}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* 수집중 추가 모달 (네 기존 그대로 유지) */}
      {addOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setAddOpen(false);
              resetAddForm();
            }}
          />

          <div className="relative w-full max-w-3xl">
            <GlassCard className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold">수집중 추가</div>
                  <div className="mt-1 text-sm text-white/55">
                    제목은 필수. 가격/링크는 선택. 이미지는 URL 또는 업로드 둘 다 가능.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAddOpen(false);
                    resetAddForm();
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  닫기
                </button>
              </div>

              <div className="mt-5 grid gap-4">
                <div>
                  <div className="text-sm text-white/70">이름(필수)</div>
                  <input
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    placeholder="예: 모몽가 키링 / 스티커팩 / 피규어"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30 focus:border-white/20"
                  />
                </div>

                <div>
                  <div className="text-sm text-white/70">링크(선택)</div>
                  <input
                    value={addLink}
                    onChange={(e) => setAddLink(e.target.value)}
                    placeholder="https://... (구매/정보 링크)"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30 focus:border-white/20"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm text-white/70">원가(선택)</div>
                    <input
                      value={addOriginal}
                      onChange={(e) => setAddOriginal(e.target.value)}
                      placeholder="예: 12000"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30 focus:border-white/20"
                    />
                  </div>

                  <div>
                    <div className="text-sm text-white/70">중고가(선택)</div>
                    <input
                      value={addUsed}
                      onChange={(e) => setAddUsed(e.target.value)}
                      placeholder="예: 8000"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30 focus:border-white/20"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <div className="text-sm text-white/70">이미지</div>

                  <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                    <button
                      type="button"
                      onClick={() => setAddImageMode("url")}
                      className={`rounded-full px-4 py-2 text-sm ${
                        addImageMode === "url"
                          ? "bg-white/12 text-white"
                          : "text-white/60 hover:bg-white/10 hover:text-white/80"
                      }`}
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddImageMode("upload")}
                      className={`rounded-full px-4 py-2 text-sm ${
                        addImageMode === "upload"
                          ? "bg-white/12 text-white"
                          : "text-white/60 hover:bg-white/10 hover:text-white/80"
                      }`}
                    >
                      업로드
                    </button>
                  </div>

                  {addImageMode === "url" ? (
                    <div className="mt-3">
                      <input
                        value={addImageUrl}
                        onChange={(e) => setAddImageUrl(e.target.value)}
                        placeholder="https://... 또는 /images/..."
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30 focus:border-white/20"
                      />
                    </div>
                  ) : (
                    <div className="mt-3">
                      <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
                        파일 선택
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setAddImageFile(e.target.files?.[0] ?? null)}
                        />
                        <span className="text-white/40">
                          {addImageFile ? addImageFile.name : "선택된 파일 없음"}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-white/55">ESC로 닫기</div>
                  <button
                    type="button"
                    onClick={submitAddCollecting}
                    className="rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/15"
                  >
                    저장하고 수집중에 추가
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
