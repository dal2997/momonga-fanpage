"use client";

import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/layout/GlassCard";
import { CollectItem } from "@/data/collection";
import {
  fetchCollection,
  insertCollectItem,
  updateCollectItem,
  deleteCollectItem,
} from "@/lib/collectionService";
import { uploadToMomongaBucket } from "@/lib/storageService";
import { supabase } from "@/lib/supabase/client";

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

function isProbablyImageUrl(url: string) {
  const u = url.trim().toLowerCase();
  return (
    u.startsWith("http://") ||
    u.startsWith("https://") ||
    u.startsWith("data:image/")
  );
}

export default function Collection() {
  const [view, setView] = useState<ViewMode>("collecting");
  const [collecting, setCollecting] = useState<CollectItem[]>([]);
  const [collected, setCollected] = useState<CollectItem[]>([]);
  const [open, setOpen] = useState<CollectItem | null>(null);

  // ✅ 로그인 사용자
  const [userId, setUserId] = useState<string | null>(null);

  // 로딩/로그인 필요
  const [loading, setLoading] = useState(true);
  const [needLogin, setNeedLogin] = useState(false);

  // 수집완료 이동 입력(내 사진/메모)
  const [myFile, setMyFile] = useState<File | null>(null);
  const [myMemo, setMyMemo] = useState("");

  // 수정 모드(링크/가격/제목 + 대표이미지 URL/업로드)
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editOriginal, setEditOriginal] = useState("");
  const [editUsed, setEditUsed] = useState("");

  const [editImageMode, setEditImageMode] = useState<"url" | "upload">("url");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

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

  // 버튼 연타 방지
  const [savingAdd, setSavingAdd] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // DB -> UI 변환 (snake_case -> camelCase)
  function mapRowToItem(r: any): CollectItem {
    return {
      id: r.id,
      title: r.title,
      image: r.image,
      link: r.link,
      originalPrice: r.original_price,
      usedPrice: r.used_price,
      status: r.status,
      myImage: r.my_image,
      myMemo: r.my_memo,
    };
  }

  async function refreshFromDb(uid: string) {
    const rows = await fetchCollection(uid);

    const nextCollecting = rows
      .filter((r: any) => r.status === "collecting")
      .map(mapRowToItem);
    const nextCollected = rows
      .filter((r: any) => r.status === "collected")
      .map(mapRowToItem);

    setCollecting(nextCollecting);
    setCollected(nextCollected);
  }

  // ✅ 최초 진입: "세션 먼저 확인" → 있으면 uid 저장 후 fetch
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id ?? null;

        if (!alive) return;

        if (!uid) {
          setUserId(null);
          setNeedLogin(true);
          setCollecting([]);
          setCollected([]);
          return;
        }

        setUserId(uid);
        setNeedLogin(false);

        await refreshFromDb(uid);
      } catch (e) {
        console.error("Collection init failed", e);
        setNeedLogin(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    // 로그인 상태 변화도 반영
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const uid = session?.user?.id ?? null;
        if (!alive) return;

        if (!uid) {
          setUserId(null);
          setNeedLogin(true);
          setCollecting([]);
          setCollected([]);
          setOpen(null);
          setAddOpen(false);
          setEditMode(false);
          setLoading(false);
          return;
        }

        setUserId(uid);
        setNeedLogin(false);
        setLoading(true);
        try {
          await refreshFromDb(uid);
        } finally {
          if (alive) setLoading(false);
        }
      }
    );

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
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

  function resetAddForm() {
    setAddTitle("");
    setAddLink("");
    setAddOriginal("");
    setAddUsed("");
    setAddImageMode("url");
    setAddImageUrl("");
    setAddImageFile(null);
  }

  function openDetail(item: CollectItem) {
    setOpen(item);
    setEditMode(false);

    setEditTitle(item.title ?? "");
    setEditLink(item.link ?? "");
    setEditOriginal(
      item.originalPrice === null || item.originalPrice === undefined
        ? ""
        : String(item.originalPrice)
    );
    setEditUsed(
      item.usedPrice === null || item.usedPrice === undefined
        ? ""
        : String(item.usedPrice)
    );

    // ✅ 대표이미지 수정 초기값
    setEditImageMode("url");
    setEditImageUrl(item.image ?? "");
    setEditImageFile(null);

    setMyFile(null);
    setMyMemo(item.myMemo ?? "");
  }

  async function submitAddCollecting() {
    if (savingAdd) return;
    setSavingAdd(true);

    try {
      if (!userId) {
        alert("로그인이 필요해.");
        return;
      }

      const title = addTitle.trim();
      if (!title) {
        alert("이름(제목)은 필수야.");
        return;
      }

      let image: string | null = null;

      if (addImageMode === "url") {
        const url = addImageUrl.trim();
        if (!url) {
          alert("이미지 URL을 넣거나 업로드 파일을 올려줘.");
          return;
        }
        image = url;
      } else {
        if (!addImageFile) {
          alert("이미지 파일을 선택해줘.");
          return;
        }
        image = await uploadToMomongaBucket(addImageFile, `collecting/${userId}`);
      }

      await insertCollectItem(userId, {
        id: crypto.randomUUID(),
        title,
        image,
        link: addLink.trim() ? addLink.trim() : null,
        originalPrice: parsePrice(addOriginal),
        usedPrice: parsePrice(addUsed),
        status: "collecting",
      });

      await refreshFromDb(userId);

      setAddOpen(false);
      resetAddForm();
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.message ||
        e?.error_description ||
        (typeof e === "string" ? e : JSON.stringify(e));
      alert(`저장 실패: ${msg}`);
    } finally {
      setSavingAdd(false);
    }
  }

  async function moveToCollected(item: CollectItem) {
    if (moving) return;
    setMoving(true);

    try {
      if (!userId) {
        alert("로그인이 필요해.");
        return;
      }

      const myImage = myFile
        ? await uploadToMomongaBucket(myFile, `collected/${userId}`)
        : null;

      await updateCollectItem(userId, item.id, {
        status: "collected",
        myImage,
        myMemo: myMemo.trim() ? myMemo.trim() : null,
      });

      await refreshFromDb(userId);

      setOpen(null);
      setMyFile(null);
      setMyMemo("");
    } catch (e) {
      console.error(e);
      alert("수집완료 이동 실패. 콘솔(F12)을 확인해줘.");
    } finally {
      setMoving(false);
    }
  }

  async function saveEdit() {
    if (!open) return;
    if (!userId) {
      alert("로그인이 필요해.");
      return;
    }
    if (savingEdit) return;

    setSavingEdit(true);
    try {
      let image = open.image;

      if (editImageMode === "url") {
        if (editImageUrl.trim()) image = editImageUrl.trim();
      } else {
        if (!editImageFile) {
          alert("업로드할 파일을 선택해줘.");
          return;
        }
        // ✅ 정책 허용 경로(collecting/<uid>/... or collected/<uid>/...)
        image = await uploadToMomongaBucket(editImageFile, `${open.status}/${userId}`);
      }

      await updateCollectItem(userId, open.id, {
        title: editTitle.trim() ? editTitle.trim() : open.title,
        link: editLink.trim() ? editLink.trim() : null,
        image,
        originalPrice: parsePrice(editOriginal),
        usedPrice: parsePrice(editUsed),
      });

      await refreshFromDb(userId);

      // 모달 상단 이미지도 바로 갱신되게
      setOpen((prev) => (prev ? { ...prev, image } : prev));

      setEditMode(false);
      setEditImageFile(null);
      setEditImageMode("url");
    } catch (e) {
      console.error(e);
      alert("수정 저장 실패 (콘솔 확인)");
    } finally {
      setSavingEdit(false);
    }
  }

  async function removeItem() {
    if (!open) return;
    if (deleting) return;

    const ok = confirm("정말 삭제할까? (되돌릴 수 없음)");
    if (!ok) return;

    setDeleting(true);
    try {
      if (!userId) {
        alert("로그인이 필요해.");
        return;
      }

      await deleteCollectItem(userId, open.id);
      await refreshFromDb(userId);

      setOpen(null);
      setEditMode(false);
    } catch (e) {
      console.error(e);
      alert("삭제 실패. 콘솔(F12)을 확인해줘.");
    } finally {
      setDeleting(false);
    }
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
            onClick={() => {
              if (!userId) {
                alert("로그인이 필요해.");
                return;
              }
              setAddOpen(true);
            }}
            className="ml-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            + 수집중 추가
          </button>
        </div>
      </div>

      {/* 로그인 필요 안내 */}
      {needLogin && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80">
          <div className="text-sm">
            로그인하면 내 수집 데이터를 불러오고 저장할 수 있어.
          </div>
          <div className="mt-2 text-xs text-white/60">
            로그인 후 다시 이 탭을 열면 자동으로 불러와져.
          </div>

          <div className="mt-4 flex gap-2">
            <a
              href="/login"
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            >
              로그인하러 가기
            </a>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              새로고침
            </button>
          </div>
        </div>
      )}

      {/* 로딩 */}
      {loading && <div className="mt-6 text-sm text-white/60">불러오는 중…</div>}

      {/* 3열 그리드 */}
      {!loading && !needLogin && (
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
                        원가 {formatPrice(item.originalPrice)} / 중고{" "}
                        {formatPrice(item.usedPrice)}
                      </span>
                    </div>

                    <div className="mt-3 text-lg font-semibold">{item.title}</div>

                    {item.link ? (
                      <div className="mt-1 text-xs text-white/65 underline underline-offset-4">
                        링크 있음 (모달에서 열기/수정)
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
      )}

      {/* 상세 모달 */}
      {open && !needLogin && (
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
                        원가 {formatPrice(open.originalPrice)} / 중고{" "}
                        {formatPrice(open.usedPrice)}
                      </span>
                    </div>
                    <div className="mt-3 text-3xl font-semibold">{open.title}</div>

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
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">
                    {open.status === "collecting" ? "수집중 상세" : "내 수집품"}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={removeItem}
                      disabled={deleting}
                      className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-100 hover:bg-red-500/15 disabled:opacity-60"
                    >
                      {deleting ? "삭제 중…" : "삭제"}
                    </button>

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

                {editMode && (
                  <div className="mt-4 grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-sm text-white/70">이름</div>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                        />
                      </div>

                      <div>
                        <div className="text-sm text-white/70">구매/정보 링크</div>
                        <input
                          value={editLink}
                          onChange={(e) => setEditLink(e.target.value)}
                          placeholder="https://..."
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
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
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                        />
                      </div>

                      <div>
                        <div className="text-sm text-white/70">중고가</div>
                        <input
                          value={editUsed}
                          onChange={(e) => setEditUsed(e.target.value)}
                          placeholder="예: 8000"
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                        />
                      </div>
                    </div>

                    {/* 대표 이미지 수정: URL / 업로드 */}
                    <div className="mt-2">
                      <div className="text-sm text-white/70">대표 이미지</div>

                      <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditImageMode("url");
                            setEditImageFile(null);
                          }}
                          className={`rounded-full px-4 py-2 text-sm ${
                            editImageMode === "url"
                              ? "bg-white/12 text-white"
                              : "text-white/60 hover:bg-white/10 hover:text-white/80"
                          }`}
                        >
                          URL
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditImageMode("upload");
                            setEditImageUrl("");
                          }}
                          className={`rounded-full px-4 py-2 text-sm ${
                            editImageMode === "upload"
                              ? "bg-white/12 text-white"
                              : "text-white/60 hover:bg-white/10 hover:text-white/80"
                          }`}
                        >
                          업로드
                        </button>
                      </div>

                      {editImageMode === "url" ? (
                        <div className="mt-3">
                          <input
                            value={editImageUrl}
                            onChange={(e) => setEditImageUrl(e.target.value)}
                            placeholder="https://... (jpg/png 같은 실제 이미지 URL 권장)"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                          />
                          {editImageUrl.trim() &&
                            !isProbablyImageUrl(editImageUrl.trim()) && (
                              <div className="mt-2 text-xs text-white/50">
                                ⚠️ 이 URL이 이미지가 아닐 수도 있어. 가능하면 .jpg/.png 같은
                                “진짜 이미지 URL”을 추천.
                              </div>
                            )}
                        </div>
                      ) : (
                        <div className="mt-3">
                          <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
                            파일 선택
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                setEditImageFile(e.target.files?.[0] ?? null)
                              }
                            />
                            <span className="text-white/40">
                              {editImageFile ? editImageFile.name : "선택된 파일 없음"}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={savingEdit}
                        className="rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/15 disabled:opacity-60"
                      >
                        {savingEdit ? "저장 중…" : "수정 저장"}
                      </button>
                    </div>
                  </div>
                )}

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
                          <span className="text-white/40">
                            {myFile ? myFile.name : "선택된 파일 없음"}
                          </span>
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
                        disabled={moving}
                        className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 disabled:opacity-60"
                      >
                        {moving ? "이동 중…" : "수집완료로 이동"}
                      </button>
                    </div>
                  </>
                )}

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

      {/* 수집중 추가 모달 */}
      {addOpen && !needLogin && (
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
                        placeholder="https://... (jpg/png 같은 실제 이미지 URL 권장)"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30 focus:border-white/20"
                      />
                      <div className="mt-2 text-xs text-white/50">
                        팁: 스마트스토어 “상품 링크”는 이미지가 아니라서 썸네일이 안 뜰 수 있어.
                        가능하면 실제 이미지 URL을 넣어줘.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
                        파일 선택
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            setAddImageFile(e.target.files?.[0] ?? null)
                          }
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
                    disabled={savingAdd}
                    onClick={submitAddCollecting}
                    className="rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/15 disabled:opacity-60"
                  >
                    {savingAdd ? "저장 중…" : "저장하고 수집중에 추가"}
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
