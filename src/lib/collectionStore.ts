import { CollectItem, initialCollecting } from "@/data/collection";

const KEY = "momonga_collection_v1";

type StoreShape = {
  collecting: CollectItem[];
  collected: CollectItem[];
};

function safeParse(json: string | null): StoreShape | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as StoreShape;
  } catch {
    return null;
  }
}

// ✅ 예전 데이터가 있어도 필드가 깨지지 않게 보정
function normalizeItem(x: any): CollectItem {
  return {
    id: String(x.id ?? crypto.randomUUID()),
    title: String(x.title ?? "이름없음"),
    image: String(x.image ?? "/images/momonga/01.jpg"),
    link: x.link ?? null,

    originalPrice:
      typeof x.originalPrice === "number" ? x.originalPrice : x.originalPrice ?? null,
    usedPrice:
      typeof x.usedPrice === "number" ? x.usedPrice : x.usedPrice ?? null,

    status: x.status === "collected" ? "collected" : "collecting",

    myImage: x.myImage ?? null,
    myMemo: x.myMemo ?? null,
  };
}

function migrate(parsed: StoreShape): StoreShape {
  const collecting = Array.isArray(parsed.collecting)
    ? parsed.collecting.map(normalizeItem)
    : initialCollecting;

  const collected = Array.isArray(parsed.collected)
    ? parsed.collected.map(normalizeItem)
    : [];

  return { collecting, collected };
}

export function loadCollection(): StoreShape {
  if (typeof window === "undefined") {
    return { collecting: initialCollecting, collected: [] };
  }

  const parsed = safeParse(localStorage.getItem(KEY));
  if (parsed) {
    const migrated = migrate(parsed);
    localStorage.setItem(KEY, JSON.stringify(migrated)); // ✅ 보정본 다시 저장
    return migrated;
  }

  const init: StoreShape = { collecting: initialCollecting, collected: [] };
  localStorage.setItem(KEY, JSON.stringify(init));
  return init;
}

export function saveCollection(next: StoreShape) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

// (옵션) 개발 중에 편하게 초기화하고 싶으면 쓸 것
export function clearCollection() {
  localStorage.removeItem(KEY);
}
