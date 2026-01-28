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

export function loadCollection(): StoreShape {
  if (typeof window === "undefined") {
    return { collecting: initialCollecting, collected: [] };
  }

  const parsed = safeParse(localStorage.getItem(KEY));
  if (parsed && parsed.collecting && parsed.collected) return parsed;

  const init: StoreShape = { collecting: initialCollecting, collected: [] };
  localStorage.setItem(KEY, JSON.stringify(init));
  return init;
}

export function saveCollection(next: StoreShape) {
  localStorage.setItem(KEY, JSON.stringify(next));
}
