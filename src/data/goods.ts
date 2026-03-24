export type GoodsStatus = "collecting" | "collected";

export type GoodsItem = {
  id: string;
  title: string;
  price: number; // KRW 기준 숫자
  image: string; // "/images/..." 또는 "https://..."
  shopUrl?: string;

  status: GoodsStatus;

  // 수집완료로 이동할 때 채우는 정보
  myPhoto?: string; // 내 실물 사진 url (선택)
  memo?: string;    // 메모 (선택)
  collectedAt?: string; // ISO string
};

export const initialCollecting: GoodsItem[] = [
  {
    id: "g-001",
    title: "모몽가 키링 (예시)",
    price: 12000,
    image: "/images/momonga/01.jpg",
    shopUrl: "https://example.com",
    status: "collecting",
  },
  {
    id: "g-002",
    title: "모몽가 스티커팩 (예시)",
    price: 8000,
    image: "/images/momonga/02.jpg",
    shopUrl: "https://example.com",
    status: "collecting",
  },
];

export const initialCollected: GoodsItem[] = [
  {
    id: "g-101",
    title: "모몽가 인형 (예시)",
    price: 35000,
    image: "/images/momonga/03.jpg",
    status: "collected",
    memo: "첫 굿즈! 기분좋음",
    collectedAt: new Date().toISOString(),
  },
];
