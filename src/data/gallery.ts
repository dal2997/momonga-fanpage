export type GalleryItem = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
  detailTitle: string;
  detailBody: string;
};

export const gallery: GalleryItem[] = [
  {
    id: "face",
    title: "그 표정 한 방",
    subtitle: "아무 말 안 해도 이해됨",
    tag: "표정",
    image: "/images/momonga/03.jpg",
    detailTitle: "표정으로 무장해제",
    detailBody:
      "모몽가는 말보다 표정이 먼저 들어온다. 그래서 보는 사람 마음이 먼저 풀림. 이 카드의 테마는 '말 없이 설득'이다.",
  },
  {
    id: "dash",
    title: "사다다닥",
    subtitle: "작은 몸으로 빠르게 이동",
    tag: "움직임",
    image: "/images/momonga/01.jpg",
    detailTitle: "위기 회피 스킬",
    detailBody:
      "빠르게 이동하는 순간이 귀여움의 핵심. 이 카드의 테마는 '작은데 민첩함'이다. 호버하면 더 살아난다.",
  },
  {
    id: "heal",
    title: "가만히 있는 것",
    subtitle: "그 자체로 완성",
    tag: "힐링",
    image: "/images/momonga/02.jpg",
    detailTitle: "존재만으로 힐링",
    detailBody:
      "움직이지 않아도 되는 순간이 있다. 이 카드의 테마는 '정적의 완성'이다. 클릭해서 디테일을 읽어봐.",
  },
  {
    id: "panic",
    title: "당황한 순간",
    subtitle: "그게 제일 귀여움",
    tag: "리액션",
    image: "/images/momonga/04.jpg",
    detailTitle: "리액션이 곧 매력",
    detailBody:
      "당황한 표정과 몸짓은 치트키다. 이 카드의 테마는 '예상 밖 반응'이다. 모달에서 감상 포인트를 확인!",
  },
];
