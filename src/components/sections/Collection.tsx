"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GlassCard from "@/components/layout/GlassCard";
import { CollectItem } from "@/data/collection";
import {
  fetchCollection,
  insertCollectItem,
  updateCollectItem,
  deleteCollectItem,
} from "@/lib/collectionService";
import {
  uploadToMomongaBucket,
  removeByPublicUrl,
  canDeletePublicUrlAsOwner,
} from "@/lib/storageService";
import { supabase } from "@/lib/supabase/client";
import { hashFile } from "@/lib/fileHash";

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
  return u.startsWith("http://") || u.startsWith("https://") || u.startsWith("data:image/");
}

function baseName(fileName: string) {
  const idx = fileName.lastIndexOf(".");
  const raw = idx >= 0 ? fileName.slice(0, idx) : fileName;
  return raw.replaceAll("_", " ").trim();
}

type QuickEntry = {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  hash: string;
};

function withTimeout<T>(p: Promise<T>, ms: number, label = "timeout") {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(label)), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      }
    );
  });
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

  // ✅ 로딩 고착 방지: 에러 메시지 + 재시도
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // 수집중 -> 수집완료 이동 입력(내 사진/메모)
  const [myFile, setMyFile] = useState<File | null>(null);
  const [myMemo, setMyMemo] = useState("");

  // ✅ 수집완료에서 "내 사진/메모" 수정용 상태
  const [editMyMemo, setEditMyMemo] = useState("");
  const [editMyImageMode, setEditMyImageMode] = useState<"keep" | "url" | "upload">("keep");
  const [editMyImageUrl, setEditMyImageUrl] = useState("");
  const [editMyImageFile, setEditMyImageFile] = useState<File | null>(null);
  const [myDeleteRequested, setMyDeleteRequested] = useState(false);

  // 수정 모드(상품 정보)
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

  const [addImageMode, setAddImageMode] = useState<"url" | "upload">("url");
  const [addImageUrl, setAddImageUrl] = useState("");
  const [addImageFile, setAddImageFile] = useState<File | null>(null);

  // ✅ 수집완료 빠른추가 모달
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickEntries, setQuickEntries] = useState<QuickEntry[]>([]);
  const [quickMemo, setQuickMemo] = useState("");
  const [quickPrefix, setQuickPrefix] = useState("");
  const [quickSuffix, setQuickSuffix] = useState("");
  const [quickNumbering, setQuickNumbering] = useState(true);
  const [quickUploading, setQuickUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 드래그 정렬
  const dragIdRef = useRef<string | null>(null);

  // 버튼 연타 방지
  const [savingAdd, setSavingAdd] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ✅ 로컬 업로드 미리보기용 objectURL
  const [productPreviewObjUrl, setProductPreviewObjUrl] = useState<string | null>(null);
  const [myPreviewObjUrl, setMyPreviewObjUrl] = useState<string | null>(null);

  // ✅ 레이스 방지용 request id
  const reqIdRef = useRef(0);
  const aliveRef = useRef(true);

  // DB -> UI 변환 (snake_case -> camelCase)
  const mapRowToItem = useCallback((r: any): CollectItem => {
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
  }, []);

  const refreshFromDb = useCallback(
    async (uid: string) => {
      const rows = await fetchCollection(uid);

      const nextCollecting = rows.filter((r: any) => r.status === "collecting").map(mapRowToItem);

      const nextCollected = rows.filter((r: any) => r.status === "collected").map(mapRowToItem);

      setCollecting(nextCollecting);
      setCollected(nextCollected);
    },
    [mapRowToItem]
  );

  const quickHashSetRef = useRef<Set<string>>(new Set());

  const canDeleteMyImage =
    !!(userId && open?.myImage && canDeletePublicUrlAsOwner(open.myImage, userId));

  const load = useCallback(async () => {
    const myReqId = ++reqIdRef.current;

    setLoading(true);
    setLoadErr(null);

    const timeoutMs = 15000;

    try {
      const { data: userData, error: userErr } = await withTimeout(
        supabase.auth.getUser(),
        timeoutMs
      );

      if (!aliveRef.current) return;
      if (myReqId !== reqIdRef.current) return;

      if (userErr) throw userErr;

      const uid = userData.user?.id ?? null;

      if (!uid) {
        setUserId(null);
        setNeedLogin(true);
        setCollecting([]);
        setCollected([]);
        setOpen(null);
        setAddOpen(false);
        setEditMode(false);
        setQuickOpen(false);
        return;
      }

      setUserId(uid);
      setNeedLogin(false);

      await withTimeout(refreshFromDb(uid), timeoutMs);

      if (!aliveRef.current) return;
      if (myReqId !== reqIdRef.current) return;
    } catch (e: any) {
      console.error("[Collection] load failed:", e);

      if (!aliveRef.current) return;
      if (myReqId !== reqIdRef.current) return;

      if (String(e?.message).toLowerCase().includes("timeout")) {
        setLoadErr("불러오기가 오래 걸려서 중단했어. 다시 시도해줘.");
      } else {
        setLoadErr(e?.message ?? "불러오기 실패. 다시 시도해줘.");
      }
    } finally {
      if (!aliveRef.current) return;
      if (myReqId !== reqIdRef.current) return;

      setLoading(false);
    }
  }, [refreshFromDb]);

  // ✅ 최초 진입 + auth 변화 시 load()로 통일
  useEffect(() => {
    aliveRef.current = true;
    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event) => {
      load();
    });

    return () => {
      aliveRef.current = false;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(null);
      setAddOpen(false);
      setEditMode(false);
      setQuickOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ✅ 상품 이미지 업로드 선택 시: objectURL 만들어서 미리보기
  useEffect(() => {
    if (editImageMode !== "upload" || !editImageFile) {
      if (productPreviewObjUrl) URL.revokeObjectURL(productPreviewObjUrl);
      setProductPreviewObjUrl(null);
      return;
    }

    const url = URL.createObjectURL(editImageFile);
    if (productPreviewObjUrl) URL.revokeObjectURL(productPreviewObjUrl);
    setProductPreviewObjUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [editImageMode, editImageFile]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ 내 사진 업로드 선택 시: objectURL 만들어서 미리보기
  useEffect(() => {
    if (editMyImageMode !== "upload" || !editMyImageFile || myDeleteRequested) {
      if (myPreviewObjUrl) URL.revokeObjectURL(myPreviewObjUrl);
      setMyPreviewObjUrl(null);
      return;
    }

    const url = URL.createObjectURL(editMyImageFile);
    if (myPreviewObjUrl) URL.revokeObjectURL(myPreviewObjUrl);
    setMyPreviewObjUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [editMyImageMode, editMyImageFile, myDeleteRequested]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function resetQuick() {
    quickEntries.forEach((e) => URL.revokeObjectURL(e.previewUrl));
    setQuickEntries([]);
    setQuickMemo("");
    setQuickPrefix("");
    setQuickSuffix("");
    setQuickNumbering(true);
    quickHashSetRef.current.clear();
  }

  function openDetail(item: CollectItem) {
    console.log("[openDetail] userId(state):", userId);
    console.log("[openDetail] item.myImage:", item.myImage);
    console.log(
      "[openDetail] canDeleteMyImage(calc):",
      !!(userId && item.myImage && canDeletePublicUrlAsOwner(item.myImage, userId))
    );

    setOpen(item);
    setEditMode(false);

    // 상품 수정값
    setEditTitle(item.title ?? "");
    setEditLink(item.link ?? "");
    setEditOriginal(
      item.originalPrice === null || item.originalPrice === undefined ? "" : String(item.originalPrice)
    );
    setEditUsed(
      item.usedPrice === null || item.usedPrice === undefined ? "" : String(item.usedPrice)
    );

    setEditImageMode("url");
    setEditImageUrl(item.image ?? "");
    setEditImageFile(null);

    // 수집중 -> 완료 이동용
    setMyFile(null);
    setMyMemo(item.myMemo ?? "");

    // ✅ 수집완료 내 사진 수정 초기화
    setEditMyMemo(item.myMemo ?? "");
    setEditMyImageMode("keep");
    setEditMyImageUrl(item.myImage ?? "");
    setEditMyImageFile(null);
    setMyDeleteRequested(false);

    // ✅ 프리뷰 URL 정리(안전)
    if (productPreviewObjUrl) {
      URL.revokeObjectURL(productPreviewObjUrl);
      setProductPreviewObjUrl(null);
    }
    if (myPreviewObjUrl) {
      URL.revokeObjectURL(myPreviewObjUrl);
      setMyPreviewObjUrl(null);
    }
  }

  // ✅ 상세 모달 미리보기 src 계산
  const productPreviewSrc = useMemo(() => {
    if (!open) return "";

    if (!editMode) return open.image ?? "";

    if (editImageMode === "url") {
      return editImageUrl.trim() || open.image || "";
    }

    return productPreviewObjUrl || open.image || "";
  }, [open, editMode, editImageMode, editImageUrl, productPreviewObjUrl]);

  const myPreviewSrc = useMemo(() => {
    if (!open) return "";

    if (open.status !== "collected") return open.myImage ?? "";

    if (!editMode) return open.myImage ?? "";

    if (myDeleteRequested) return "";

    if (editMyImageMode === "keep") return open.myImage ?? "";

    if (editMyImageMode === "url") return editMyImageUrl.trim() || "";

    return myPreviewObjUrl || open.myImage || "";
  }, [open, editMode, myDeleteRequested, editMyImageMode, editMyImageUrl, myPreviewObjUrl]);

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
        image = await uploadToMomongaBucket(addImageFile, "collecting");
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

      await load();

      setAddOpen(false);
      resetAddForm();
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.message || e?.error_description || (typeof e === "string" ? e : JSON.stringify(e));
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

      const myImage = myFile ? await uploadToMomongaBucket(myFile, "collected") : null;

      await updateCollectItem(userId, item.id, {
        status: "collected",
        myImage,
        myMemo: myMemo.trim() ? myMemo.trim() : null,
      });

      await load();

      setOpen(null);
      setMyFile(null);
      setMyMemo("");
      setView("collected");
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
      // =========================
      // 1) 상품 이미지 처리
      // =========================
      let image = open.image ?? null;

      if (editImageMode === "url") {
        if (editImageUrl.trim()) image = editImageUrl.trim();
      } else {
        if (!editImageFile) {
          alert("업로드할 파일을 선택해줘.");
          return;
        }
        image = await uploadToMomongaBucket(editImageFile, open.status);
      }

      // =========================
      // 2) 내 사진(수집완료) 처리
      // =========================
      let myImage: string | null | undefined = undefined;
      let nextMyMemo: string | null | undefined = undefined;

      if (open.status === "collected") {
        nextMyMemo = editMyMemo.trim() ? editMyMemo.trim() : null;

        if (myDeleteRequested) {
          if (open.myImage) {
            if (!canDeleteMyImage) {
              alert("예전 업로드 파일은 삭제가 아니라 '업로드(교체)'로 정리돼요.");
            } else {
              await removeByPublicUrl(open.myImage);
            }
          }
          myImage = null;
        } else if (editMyImageMode === "keep") {
          myImage = open.myImage ?? null;
        } else if (editMyImageMode === "url") {
          myImage = editMyImageUrl.trim() ? editMyImageUrl.trim() : null;
        } else {
          if (!editMyImageFile) {
            alert("내 사진 업로드 파일을 선택해줘.");
            return;
          }

          if (open.myImage) {
            try {
              await removeByPublicUrl(open.myImage);
            } catch {}
          }

          myImage = await uploadToMomongaBucket(editMyImageFile, "collected");
        }
      }

      // =========================
      // 3) 업데이트 patch 구성
      // =========================
      const patch: any = {
        title: editTitle.trim() ? editTitle.trim() : open.title,
        link: editLink.trim() ? editLink.trim() : null,
        image,
        originalPrice: parsePrice(editOriginal),
        usedPrice: parsePrice(editUsed),
      };

      if (open.status === "collected") {
        patch.myImage = myImage;
        patch.myMemo = nextMyMemo;
      }

      await updateCollectItem(userId, open.id, patch);

      await load();

      // 모달 내 상태 즉시 반영
      setOpen((prev) => {
        if (!prev) return prev;
        return { ...prev, ...patch };
      });

      setEditMode(false);
      setEditImageFile(null);
      setEditImageMode("url");

      setEditMyImageFile(null);
      setEditMyImageMode("keep");
      setMyDeleteRequested(false);
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
      await load();

      setOpen(null);
      setEditMode(false);
    } catch (e) {
      console.error(e);
      alert("삭제 실패. 콘솔(F12)을 확인해줘.");
    } finally {
      setDeleting(false);
    }
  }

  // =========================
  // ✅ 수집완료 빠른추가 로직
  // =========================
  async function addQuickFiles(files: File[]) {
    const onlyImages = files.filter((f) => f.type.startsWith("image/"));
    if (onlyImages.length === 0) return;

    const next: QuickEntry[] = [];

    for (const f of onlyImages) {
      const h = await hashFile(f);

      if (quickHashSetRef.current.has(h)) continue;
      quickHashSetRef.current.add(h);

      next.push({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        title: baseName(f.name),
        hash: h,
      });
    }

    if (next.length === 0) return;
    setQuickEntries((prev) => [...prev, ...next]);
  }

  async function onQuickFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    await addQuickFiles(files);
    e.target.value = "";
  }

  function moveEntry(fromIdx: number, toIdx: number) {
    setQuickEntries((prev) => {
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const copy = [...prev];
      const [picked] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, picked);
      return copy;
    });
  }

  function applyBulkTitles() {
    setQuickEntries((prev) =>
      prev.map((e, i) => {
        const num = quickNumbering ? `${i + 1}. ` : "";
        const core = e.title.trim() || "제목";
        return { ...e, title: `${quickPrefix}${num}${core}${quickSuffix}`.trim() };
      })
    );
  }

  function resetTitlesToFilename() {
    setQuickEntries((prev) => prev.map((e) => ({ ...e, title: baseName(e.file.name) })));
  }

  function removeQuickEntry(id: string) {
    setQuickEntries((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        quickHashSetRef.current.delete(target.hash);
      }
      return prev.filter((x) => x.id !== id);
    });
  }

  async function submitQuickCollected() {
    if (quickUploading) return;

    try {
      if (!userId) {
        alert("로그인이 필요해.");
        return;
      }
      if (quickEntries.length === 0) {
        alert("사진을 1장 이상 넣어줘.");
        return;
      }

      setQuickUploading(true);

      for (const entry of quickEntries) {
        const myUrl = await uploadToMomongaBucket(entry.file, "collected");

        await insertCollectItem(userId, {
          id: crypto.randomUUID(),
          title: entry.title.trim() || baseName(entry.file.name),
          image: myUrl,
          link: null,
          originalPrice: null,
          usedPrice: null,
          status: "collected",
          myImage: myUrl,
          myMemo: quickMemo.trim() ? quickMemo.trim() : null,
        });
      }

      await load();

      setQuickOpen(false);
      resetQuick();
      setView("collected");
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.message || e?.error_description || (typeof e === "string" ? e : JSON.stringify(e));
      alert(`빠른추가 실패: ${msg}`);
    } finally {
      setQuickUploading(false);
    }
  }

  return (
    <section id="collection" className="scroll-mt-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">수집</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            “수집중”에서 “수집완료”로 옮기며 내 굿즈 아카이브를 만든다
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView("collecting")}
            className={`rounded-full border px-4 py-2 text-sm ${
              view === "collecting"
                ? "border-foreground/20 bg-foreground/10 text-foreground"
                : "border-foreground/10 bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
            }`}
          >
            수집중
          </button>

          <button
            type="button"
            onClick={() => setView("collected")}
            className={`rounded-full border px-4 py-2 text-sm ${
              view === "collected"
                ? "border-foreground/20 bg-foreground/10 text-foreground"
                : "border-foreground/10 bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
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
            className="ml-2 rounded-full border border-foreground/10 bg-foreground/5 px-4 py-2 text-sm text-foreground/80 hover:bg-foreground/10"
          >
            + 수집중 추가
          </button>

          <button
            type="button"
            onClick={() => {
              if (!userId) {
                alert("로그인이 필요해.");
                return;
              }
              setQuickOpen(true);
            }}
            className="rounded-full border border-foreground/10 bg-foreground/10 px-4 py-2 text-sm text-foreground hover:bg-foreground/15"
          >
            ⚡ 수집완료 빠른추가
          </button>
        </div>
      </div>

      {needLogin && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80">
          <div className="text-sm">로그인하면 내 수집 데이터를 불러오고 저장할 수 있어.</div>
          <div className="mt-2 text-xs text-white/60">로그인 후 다시 이 탭을 열면 자동으로 불러와져.</div>

          <div className="mt-4 flex gap-2">
            <a
              href="/login"
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            >
              로그인하러 가기
            </a>
            <button
              type="button"
              onClick={() => load()}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-6 text-sm text-white/60">
          불러오는 중…
          {loadErr ? (
            <div className="mt-2 text-xs text-red-400">
              {loadErr}{" "}
              <button className="underline" onClick={() => load()}>
                다시 시도
              </button>
            </div>
          ) : null}
        </div>
      )}

      {!loading && !needLogin && (
        <>
          {loadErr && (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
              {loadErr}{" "}
              <button className="underline" onClick={() => load()}>
                다시 시도
              </button>
            </div>
          )}

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {list.map((item) => (
              <button key={item.id} type="button" onClick={() => openDetail(item)} className="text-left">
                <GlassCard className="group overflow-hidden p-0">
                  <div className="relative h-[220px] w-full overflow-hidden rounded-2xl">
                    {item.status === "collected" ? (
                      <div className="grid h-full w-full grid-cols-2">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={`${item.title} 상품 이미지`}
                            className="block h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="grid h-full place-items-center bg-white/[0.03] text-xs text-white/50">
                            상품 이미지 없음
                          </div>
                        )}

                        {item.myImage ? (
                          <img
                            src={item.myImage}
                            alt={`${item.title} 내 사진`}
                            className="block h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="grid h-full place-items-center bg-white/[0.03] text-xs text-white/50">
                            내 사진 없음
                          </div>
                        )}
                      </div>
                    ) : (
                      <img
                        src={item.image ?? ""}
                        alt={item.title}
                        className="block h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                      />
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/0" />

                    {item.status === "collected" && (
                      <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] text-white/80 backdrop-blur">
                        <span>상품</span>
                        <span className="text-white/40">|</span>
                        <span>내사진</span>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
                        {item.status === "collecting" ? "수집중" : "수집완료"}
                        <span className="text-white/40">•</span>
                        <span className="text-white/70">
                          원가 {formatPrice(item.originalPrice)} / 중고 {formatPrice(item.usedPrice)}
                        </span>
                        {item.link ? <span className="text-white/70">• 🔗</span> : null}
                      </div>

                      <div className="mt-2 line-clamp-1 text-lg font-semibold">{item.title}</div>
                    </div>
                  </div>

                  <div className="pointer-events-none h-10 w-full bg-white/[0.02] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </GlassCard>
              </button>
            ))}
          </div>
        </>
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
                  {productPreviewSrc ? (
                    <img
                      src={productPreviewSrc}
                      alt={open.title ?? "상품 이미지"}
                      className="block h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center bg-white/[0.03] text-sm text-white/60">
                      상품 이미지 없음
                    </div>
                  )}
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
                    myPreviewSrc ? (
                      <img
                        src={myPreviewSrc}
                        alt="내 수집품 사진"
                        className="block h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center p-8 text-white/60">
                        내 사진이 아직 없어.
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
                    {/* ===== 상품 정보 수정 ===== */}
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

                    <div className="mt-2">
                      <div className="text-sm text-white/70">대표(상품) 이미지</div>

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
                            placeholder="https://... (실제 이미지 URL 권장)"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                          />
                          {editImageUrl.trim() && !isProbablyImageUrl(editImageUrl.trim()) && (
                            <div className="mt-2 text-xs text-white/50">⚠️ 이미지 URL이 아닐 수도 있어.</div>
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
                              onChange={(e) => setEditImageFile(e.target.files?.[0] ?? null)}
                            />
                            <span className="text-white/40">
                              {editImageFile ? editImageFile.name : "선택된 파일 없음"}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* ===== ✅ 수집완료 전용: 내 사진/메모 수정 ===== */}
                    {open.status === "collected" && (
                      <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-sm font-semibold text-white/85">내 사진 / 메모</div>

                        <div className="mt-3">
                          <div className="text-sm text-white/70">내 사진</div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setMyDeleteRequested(false);
                                setEditMyImageMode("keep");
                              }}
                              className={`rounded-full border px-4 py-2 text-sm ${
                                editMyImageMode === "keep" && !myDeleteRequested
                                  ? "border-white/20 bg-white/10 text-white"
                                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                              }`}
                            >
                              유지
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setMyDeleteRequested(false);
                                setEditMyImageMode("url");
                                setEditMyImageFile(null);
                              }}
                              className={`rounded-full border px-4 py-2 text-sm ${
                                editMyImageMode === "url" && !myDeleteRequested
                                  ? "border-white/20 bg-white/10 text-white"
                                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                              }`}
                            >
                              URL
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setMyDeleteRequested(false);
                                setEditMyImageMode("upload");
                                setEditMyImageUrl("");
                              }}
                              className={`rounded-full border px-4 py-2 text-sm ${
                                editMyImageMode === "upload" && !myDeleteRequested
                                  ? "border-white/20 bg-white/10 text-white"
                                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                              }`}
                            >
                              업로드
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (!canDeleteMyImage) {
                                  alert("예전 업로드 파일은 삭제가 아니라 '업로드(교체)'로 정리돼요.");
                                  return;
                                }
                                setMyDeleteRequested(true);
                                setEditMyImageMode("keep");
                                setEditMyImageFile(null);
                              }}
                              disabled={!canDeleteMyImage}
                              className={`rounded-full border px-4 py-2 text-sm ${
                                myDeleteRequested
                                  ? "border-red-400/30 bg-red-500/15 text-red-50"
                                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                              } ${!canDeleteMyImage ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              내 사진 삭제
                            </button>

                            {open?.myImage && !canDeleteMyImage && (
                              <div className="mt-2 text-xs text-white/50">
                                ℹ️ 예전 업로드 파일이라 삭제 대신{" "}
                                <b className="text-white/80">업로드(교체)</b>로 정리해줘.
                              </div>
                            )}
                          </div>

                          {!myDeleteRequested && editMyImageMode === "url" && (
                            <div className="mt-3">
                              <input
                                value={editMyImageUrl}
                                onChange={(e) => setEditMyImageUrl(e.target.value)}
                                placeholder="https://... (내 사진 URL)"
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none"
                              />
                            </div>
                          )}

                          {!myDeleteRequested && editMyImageMode === "upload" && (
                            <div className="mt-3">
                              <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
                                파일 선택
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => setEditMyImageFile(e.target.files?.[0] ?? null)}
                                />
                                <span className="text-white/40">
                                  {editMyImageFile ? editMyImageFile.name : "선택된 파일 없음"}
                                </span>
                              </label>
                            </div>
                          )}

                          <div className="mt-4">
                            <div className="text-sm text-white/70">메모</div>
                            <input
                              value={editMyMemo}
                              onChange={(e) => setEditMyMemo(e.target.value)}
                              placeholder="예: 실물 미쳤다 / 구성품 완벽 / 배송완료"
                              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30"
                            />
                          </div>
                        </div>
                      </div>
                    )}

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
                          <span className="text-white/40">{myFile ? myFile.name : "선택된 파일 없음"}</span>
                        </label>
                      </div>

                      <div>
                        <div className="text-sm text-white/70">메모 (선택)</div>
                        <input
                          value={myMemo}
                          onChange={(e) => setMyMemo(e.target.value)}
                          placeholder="예: 배송기다리는중 / 실물 미쳤다"
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30"
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

                {open.status === "collected" && !editMode && (
                  <div className="mt-4 text-sm text-white/70">{open.myMemo ? open.myMemo : "메모 없음"}</div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ===== 아래 addOpen / quickOpen 모달은 너가 붙인 그대로 (변경 없음) ===== */}
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
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30"
                  />
                </div>

                <div>
                  <div className="text-sm text-white/70">링크(선택)</div>
                  <input
                    value={addLink}
                    onChange={(e) => setAddLink(e.target.value)}
                    placeholder="https://... (구매/정보 링크)"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm text-white/70">원가(선택)</div>
                    <input
                      value={addOriginal}
                      onChange={(e) => setAddOriginal(e.target.value)}
                      placeholder="예: 12000"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30"
                    />
                  </div>

                  <div>
                    <div className="text-sm text-white/70">중고가(선택)</div>
                    <input
                      value={addUsed}
                      onChange={(e) => setAddUsed(e.target.value)}
                      placeholder="예: 8000"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30"
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
                        placeholder="https://... (실제 이미지 URL 권장)"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30"
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
                        <span className="text-white/40">{addImageFile ? addImageFile.name : "선택된 파일 없음"}</span>
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

      {/* ✅ 수집완료 빠른추가 모달 */}
      {quickOpen && !needLogin && (
        <div className="fixed inset-0 z-50 grid place-items-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setQuickOpen(false);
              resetQuick();
            }}
          />

          <div className="relative w-full max-w-6xl">
            <GlassCard className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold">수집완료 빠른추가</div>
                  <div className="mt-1 text-sm text-white/55">
                    사진 프리뷰 보고 드래그로 순서 정한 뒤 등록. 제목도 한꺼번에 편집 가능.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setQuickOpen(false);
                    resetQuick();
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  닫기
                </button>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-white/70">
                      여기에 이미지 드롭하거나, 파일 선택 (드래그로 순서 바꾸면 그 순서대로 등록)
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={onQuickFileChange}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
                      >
                        파일 선택
                      </button>
                      <div className="text-xs text-white/50">
                        {quickEntries.length ? `${quickEntries.length}개 준비됨` : "아직 없음"}
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-3 rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-xs text-white/60"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
                      if (files.length) await addQuickFiles(files);
                    }}
                  >
                    드롭해서 추가 가능
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={resetTitlesToFilename}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                    >
                      제목을 파일명으로 리셋
                    </button>

                    <input
                      value={quickPrefix}
                      onChange={(e) => setQuickPrefix(e.target.value)}
                      placeholder="접두사 예: 모몽가 "
                      className="w-56 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 outline-none placeholder:text-white/30"
                    />
                    <input
                      value={quickSuffix}
                      onChange={(e) => setQuickSuffix(e.target.value)}
                      placeholder="접미사 예: (실물)"
                      className="w-56 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 outline-none placeholder:text-white/30"
                    />

                    <button
                      type="button"
                      onClick={() => setQuickNumbering((v) => !v)}
                      className={`rounded-full border px-4 py-2 text-sm ${
                        quickNumbering
                          ? "border-white/20 bg-white/10 text-white"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      번호 붙이기
                    </button>

                    <button
                      type="button"
                      onClick={applyBulkTitles}
                      className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
                    >
                      일괄 적용
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  {quickEntries.map((entry, idx) => (
                    <div
                      key={entry.id}
                      draggable
                      onDragStart={() => {
                        dragIdRef.current = entry.id;
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={() => {
                        const fromId = dragIdRef.current;
                        if (!fromId) return;
                        const fromIdx = quickEntries.findIndex((x) => x.id === fromId);
                        if (fromIdx < 0) return;
                        moveEntry(fromIdx, idx);
                        dragIdRef.current = null;
                      }}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="relative h-36 w-full overflow-hidden rounded-2xl">
                        <img src={entry.previewUrl} alt={entry.title} className="h-full w-full object-cover" />
                        <div className="pointer-events-none absolute left-2 top-2 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-white/80 backdrop-blur">
                          {idx + 1}
                        </div>
                      </div>

                      <input
                        value={entry.title}
                        onChange={(e) => {
                          const v = e.target.value;
                          setQuickEntries((prev) =>
                            prev.map((x) => (x.id === entry.id ? { ...x, title: v } : x))
                          );
                        }}
                        className="mt-2 w-full rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none"
                      />

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="truncate text-[11px] text-white/40">{entry.file.name}</div>
                        <button
                          type="button"
                          onClick={() => removeQuickEntry(entry.id)}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
                        >
                          제거
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-sm text-white/70">메모(선택, 전체 동일 적용)</div>
                  <input
                    value={quickMemo}
                    onChange={(e) => setQuickMemo(e.target.value)}
                    placeholder="예: 2026년 2월 구매 / 오프라인 구매 / 구성품 포함"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => resetQuick()}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                  >
                    전체 비우기
                  </button>

                  <button
                    type="button"
                    onClick={submitQuickCollected}
                    disabled={quickUploading || quickEntries.length === 0}
                    className="rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/15 disabled:opacity-60"
                  >
                    {quickUploading ? "등록 중…" : "이 순서대로 수집완료에 등록"}
                  </button>
                </div>

                <div className="text-right text-xs text-white/45">ESC로 닫기</div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </section>
  );
}
