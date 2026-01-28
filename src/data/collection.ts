export type CollectStatus = "collecting" | "collected";

export type PriceOptional = number | null;

export type CollectItem = {
  id: string;
  title: string;
  image: string; // 카드에 보여줄 대표 이미지(시중/홍보 이미지)
  link?: string | null;

  // 가격은 "선택"
  originalPrice?: PriceOptional; // 원가
  usedPrice?: PriceOptional;     // 중고가

  status: CollectStatus;

  // collected로 옮길 때(내 사진/메모)
  myImage?: string | null; // 로컬에서 업로드한 이미지(base64 등) or URL
  myMemo?: string | null;
};

// 초기 예시 데이터(수집중)
export const initialCollecting: CollectItem[] = [
  {
    id: "stickerpack",
    title: "모몽가 스티커팩 (예시)",
    image: "/images/momonga/01.jpg",
    link: null,
    originalPrice: 12000,
    usedPrice: 8000,
    status: "collecting",
  },
];
