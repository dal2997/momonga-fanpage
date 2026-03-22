/**
 * src/data/characters.ts
 *
 * 캐릭터 레지스트리 — 캐릭터 추가/수정은 이 파일 하나만 건드리면 됩니다.
 * 갤러리 이미지, 인용구, 히어로 이미지, 설명 모두 여기서 관리합니다.
 */

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────

export type CharacterId = "momonga" | "kogimyung" | "jjangu";

export type GalleryItem = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
  detailTitle: string;
  detailBody: string;
};

export type CharacterDef = {
  id: CharacterId;
  name: string;          // 표시 이름
  emoji: string;         // 대표 이모지
  tagline: string;       // 한 줄 소개
  heroImage: string;     // /images/{id}/hero.png
  heroAlt: string;       // alt 텍스트
  quotes: string[];      // "오늘의 한 줄" 후보
  gallery: GalleryItem[];
};

// ─────────────────────────────────────────────
// 모몽가
// ─────────────────────────────────────────────

const momonga: CharacterDef = {
  id: "momonga",
  name: "모몽가",
  emoji: "🐿️",
  tagline: "작고 소중한 모몽가의 순간들을 모아두는 곳. 보다 보면 괜히 기분이 좋아짐 🐿️",
  heroImage: "/images/momonga/hero.png",
  heroAlt: "Momonga",
  quotes: [
    "작은 게 세상을 지배한다.",
    "귀여움은 생산성이다.",
    "모몽가는 이유 없이 좋다.",
    "팬심은 디테일에서 완성된다.",
    "오늘도 모몽가는 옳다.",
  ],
  gallery: [
    {
      id: "momonga-face",
      title: "그 표정 한 방",
      subtitle: "말 없이 심장을 가져감",
      tag: "표정",
      image: "/images/momonga/03.jpg",
      detailTitle: "무장해제 전문가",
      detailBody:
        "설명이 필요 없다. 이 표정 하나면 충분해. 화났다가도, 바빴다가도, 그냥 다 풀려버리는 그 얼굴.",
    },
    {
      id: "momonga-dash",
      title: "사다다닥",
      subtitle: "작은 몸, 풀파워",
      tag: "움직임",
      image: "/images/momonga/01.jpg",
      detailTitle: "작아서 더 빠른 것",
      detailBody:
        "저 작은 발로 어떻게 저렇게 빠르지. 보는 사람이 더 흥분되는 이상한 현상. 모몽가의 이동은 항상 사건이다.",
    },
    {
      id: "momonga-heal",
      title: "그냥 있는 것",
      subtitle: "존재 자체가 힐링",
      tag: "힐링",
      image: "/images/momonga/02.jpg",
      detailTitle: "아무것도 안 해도 됨",
      detailBody:
        "가만히 있어도 귀엽다는 게 말이 되냐. 근데 된다. 모몽가한테는 된다. 그냥 숨만 쉬어도 사랑스러운 존재.",
    },
    {
      id: "momonga-panic",
      title: "이게 뭐야 잠깐",
      subtitle: "당황했을 때가 제일 귀여움",
      tag: "리액션",
      image: "/images/momonga/04.jpg",
      detailTitle: "당황 = 매력",
      detailBody:
        "예상 못 한 순간의 그 리액션. 눈 커지고 몸 굳는 찰나의 0.3초. 모몽가의 당황함은 팬들의 보물이다.",
    },
  ],
};

// ─────────────────────────────────────────────
// 코기뮹
// TODO: /public/images/kogimyung/ 폴더에 이미지 추가 후 gallery 채우기
// ─────────────────────────────────────────────

const kogimyung: CharacterDef = {
  id: "kogimyung",
  name: "코기뮹",
  emoji: "🐕",
  tagline: "짧은 다리로 세상을 누비는 코기뮹. 뒤태만 봐도 하루가 충전됨 🐾",
  heroImage: "/images/kogimyung/hero.png",
  heroAlt: "코기뮹",
  quotes: [
    "귀는 세워두고 마음은 따뜻하게.",
    "코기의 엉덩이는 세계 평화다.",
    "달리는 것보다 앉아있는 게 더 귀엽다.",
    "코기뮹은 눈빛으로 말한다.",
    "오늘도 코기뮹은 최선을 다했다.",
  ],
  gallery: [
    {
      id: "kogimyung-butt",
      title: "뒤태가 전부야",
      subtitle: "보기만 해도 평화로움",
      tag: "뒤태",
      image: "/images/kogimyung/01.png",
      detailTitle: "코기의 엉덩이는 성지",
      detailBody:
        "이걸 보고 기분 나쁜 사람이 있을까. 통통하고 보들보들한 코기 엉덩이. 뒤에서 따라가고 싶어지는 유일한 존재.",
    },
    {
      id: "kogimyung-ears",
      title: "쫑긋",
      subtitle: "내 이름 불렀어?",
      tag: "집중",
      image: "/images/kogimyung/02.png",
      detailTitle: "초음파 수신기 장착",
      detailBody:
        "아주 작은 소리에도 귀가 먼저 반응한다. 눈도 빛나고 온몸이 집중 상태. 이 순간의 코기뮹은 너무 진지해서 오히려 귀엽다.",
    },
    {
      id: "kogimyung-run",
      title: "나 달린다",
      subtitle: "짧아도 빨라",
      tag: "전력질주",
      image: "/images/kogimyung/03.png",
      detailTitle: "짧은 다리의 반란",
      detailBody:
        "다리가 짧으면 느릴 것 같지? 아니거든. 코기뮹은 짧은 다리를 무한으로 굴려서 목표를 향해 달린다. 그 진지함이 귀엽다.",
    },
    {
      id: "kogimyung-eyes",
      title: "이 눈빛 어떡해",
      subtitle: "아무 말도 필요 없음",
      tag: "눈빛",
      image: "/images/kogimyung/04.png",
      detailTitle: "눈 하나로 모든 걸 말함",
      detailBody:
        "말을 못 해도 괜찮다. 코기뮹의 눈빛은 언어보다 정확하다. '밥 줘', '나랑 놀아', '사랑해' — 다 이 눈으로 전달됨.",
    },
  ],
};

// ─────────────────────────────────────────────
// 짱구
// TODO: /public/images/jjangu/ 폴더에 이미지 추가 후 gallery 채우기
// ─────────────────────────────────────────────

const jjangu: CharacterDef = {
  id: "jjangu",
  name: "짱구",
  emoji: "🌻",
  tagline: "못말리지만 사랑스러운 짱구. 보고 있으면 나도 모르게 웃음이 나옴 🌻",
  heroImage: "/images/jjangu/hero.png",
  heroAlt: "짱구",
  quotes: [
    "못말려도 괜찮아, 그게 나야.",
    "액션가면은 내 거야. 이건 협상 불가.",
    "뭐든 일단 먹고 생각하자.",
    "어른들은 왜 저렇게 복잡하게 살까.",
    "오늘도 짱구답게 살았다.",
  ],
  gallery: [
    {
      id: "jjangu-pose",
      title: "이 포즈야 이거",
      subtitle: "전 세계가 아는 그 자세",
      tag: "시그니처",
      image: "/images/jjangu/01.png",
      detailTitle: "짱구만의 스타일",
      detailBody:
        "누구도 따라 할 수 없는 포즈. 부끄러움 없이, 계산 없이, 그냥 하고 싶은 대로 하는 짱구. 이게 진짜 자유 아닐까.",
    },
    {
      id: "jjangu-actionmask",
      title: "액션가면 나야나",
      subtitle: "이건 절대 안 빼앗겨",
      tag: "덕질",
      image: "/images/jjangu/02.png",
      detailTitle: "최애는 목숨보다 소중해",
      detailBody:
        "짱구의 액션가면 사랑은 진심 중의 진심. 어른들이 뭐라 해도 꺾이지 않는 그 덕심. 팬이란 원래 이런 거 아닐까.",
    },
    {
      id: "jjangu-eat",
      title: "일단 먹자",
      subtitle: "행복의 90%는 입에서 온다",
      tag: "먹방",
      image: "/images/jjangu/03.png",
      detailTitle: "순수한 먹는 기쁨",
      detailBody:
        "짱구가 먹을 때의 그 표정. 세상 걱정 하나 없이 맛있는 것만 생각하는 얼굴. 그 행복이 보는 사람한테도 전염된다.",
    },
    {
      id: "jjangu-face",
      title: "뭐 어때서",
      subtitle: "눈치 없음 = 최강 무기",
      tag: "표정",
      image: "/images/jjangu/04.png",
      detailTitle: "배짱 하나는 세계 최고",
      detailBody:
        "이 표정 보면 안다. 짱구는 눈치를 안 보는 게 아니라 안 봐도 된다는 걸 아는 것 같다. 부러운 거 맞다.",
    },
  ],
};

// ─────────────────────────────────────────────
// 레지스트리
// ─────────────────────────────────────────────

/** 캐릭터 목록 — 순서가 UI 탭 순서가 됩니다 */
export const CHARACTERS: CharacterDef[] = [momonga, kogimyung, jjangu];

/** id → CharacterDef 빠른 조회 */
export const CHARACTER_MAP: Record<CharacterId, CharacterDef> = {
  momonga,
  kogimyung,
  jjangu,
};

/** 기본 캐릭터 */
export const DEFAULT_CHARACTER_ID: CharacterId = "momonga";

/** id가 유효한 CharacterId인지 검사 */
export function isCharacterId(v: unknown): v is CharacterId {
  return v === "momonga" || v === "kogimyung" || v === "jjangu";
}

/** URL 파라미터 등에서 안전하게 CharacterId 변환 */
export function safeCharId(v: string | null | undefined): CharacterId {
  if (isCharacterId(v)) return v;
  return DEFAULT_CHARACTER_ID;
}
