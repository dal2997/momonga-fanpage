// src/app/legal/page.tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "법적 고지 | momonga.app",
  robots: { index: false },
};

export default function LegalPage() {
  const pill =
    "inline-flex items-center rounded-full border px-4 py-2 text-sm transition " +
    "border-black/10 bg-black/5 text-zinc-700 hover:bg-black/10 " +
    "dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white";

  const h2 =
    "mt-10 mb-3 text-lg font-semibold text-zinc-900 dark:text-white border-b border-black/10 dark:border-white/10 pb-2";

  const p = "mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/60";

  return (
    <main className="relative">
      <section className="mx-auto max-w-2xl px-5 pt-24 pb-32">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className={pill}>
            ← 홈
          </Link>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-700 dark:text-amber-300">
            베타 서비스 운영 중
          </span>
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          법적 고지
        </h1>
        <p className={p}>최종 수정일: 2026년 3월</p>

        {/* ── 1. 팬사이트 면책 고지 */}
        <h2 className={h2}>1. 팬사이트 면책 고지</h2>
        <p className={p}>
          본 사이트(momonga.app)는 개인이 운영하는 비공식 팬사이트입니다.
          등장하는 캐릭터, 이름, 이미지, 관련 저작물의 모든 권리는 각 저작권자에게
          있으며, 본 사이트는 해당 저작권자·제작사와 어떠한 공식적인 제휴·승인·후원
          관계에 있지 않습니다.
        </p>
        <p className={p}>본 사이트에 등장하는 주요 IP 및 저작권자:</p>
        <ul className="mt-2 space-y-1 pl-4 text-sm text-zinc-600 dark:text-white/60 list-disc">
          <li>
            <strong>치이카와(먼작귀)</strong> — © nagano / 小学館
          </li>
          <li>
            <strong>짱구(크레용 신짱)</strong> — © 臼井儀人／双葉社・シンエイ・テレビ朝日・ADK
          </li>
          <li>
            <strong>코기뮹 (Cogimyun)</strong> — © SANRIO CO., LTD.
          </li>
        </ul>
        <p className={p}>
          본 사이트에 게시된 이미지·문구 등은 순수 팬 활동 및 비상업적 목적으로만
          사용됩니다. 저작권자의 권리를 침해할 의도가 없으며, 저작권자로부터 삭제
          요청이 있을 경우 즉시 조치합니다.
        </p>

        {/* ── 2. 서비스 현황 */}
        <h2 className={h2}>2. 서비스 현황 (베타)</h2>
        <p className={p}>
          현재 momonga.app은 <strong>비공개 베타 테스트</strong> 단계로, 초대 코드를
          통해 제한된 인원만 가입 가능합니다. 상업적 목적으로 운영하지 않으며,
          서비스 안정화 전까지 기능·디자인·정책이 예고 없이 변경될 수 있습니다.
        </p>

        {/* ── 3. 개인정보 처리방침 */}
        <h2 className={h2}>3. 개인정보 처리방침</h2>
        <p className={p}>
          본 방침은 「개인정보 보호법」에 따라 이용자의 개인정보 처리 현황을
          안내합니다.
        </p>

        <p className="mt-4 text-sm font-medium text-zinc-800 dark:text-white/80">
          수집하는 개인정보
        </p>
        <p className={p}>
          이메일 주소 (OTP 로그인 인증 목적)
        </p>

        <p className="mt-4 text-sm font-medium text-zinc-800 dark:text-white/80">
          수집 목적
        </p>
        <p className={p}>
          회원 식별 및 서비스 로그인 인증. 이메일은 수집 목적 외의 용도로 사용하지
          않습니다.
        </p>

        <p className="mt-4 text-sm font-medium text-zinc-800 dark:text-white/80">
          보유 및 이용 기간
        </p>
        <p className={p}>
          서비스 탈퇴 시 또는 이용자 요청 시 즉시 파기합니다. 관계 법령에 따라
          일정 기간 보관이 필요한 경우 해당 기간 동안만 보유합니다.
        </p>

        <p className="mt-4 text-sm font-medium text-zinc-800 dark:text-white/80">
          제3자 제공 및 위탁
        </p>
        <ul className="mt-1 space-y-1 pl-4 text-sm text-zinc-600 dark:text-white/60 list-disc">
          <li>
            <strong>Supabase Inc.</strong> (미국) — 데이터베이스 및 인증 서비스.
            수집 정보: 이메일 주소, 서비스 이용 데이터.{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              개인정보처리방침
            </a>
          </li>
          <li>
            <strong>Resend Inc.</strong> (미국) — 이메일 발송 서비스.
            수집 정보: 이메일 주소.{" "}
            <a
              href="https://resend.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              개인정보처리방침
            </a>
          </li>
        </ul>

        <p className="mt-4 text-sm font-medium text-zinc-800 dark:text-white/80">
          이용자 권리
        </p>
        <p className={p}>
          이용자는 자신의 개인정보에 대한 열람, 수정, 삭제를 요청할 권리가 있습니다.
          요청은 아래 연락처로 문의 바랍니다.
        </p>

        {/* ── 4. 연락처 */}
        <h2 className={h2}>4. 문의</h2>
        <p className={p}>
          저작권 관련 문의, 개인정보 삭제 요청 등은 아래 이메일로 연락 주세요.
          정당한 요청에 대해 지체 없이 처리하겠습니다.
        </p>
        <p className="mt-2 text-sm text-zinc-700 dark:text-white/60">
          📧{" "}
          <a
            href="mailto:tdt812379@gmail.com"
            className="underline underline-offset-2 hover:opacity-70 transition"
          >
            tdt812379@gmail.com
          </a>
        </p>

        <p className="mt-10 text-xs text-zinc-400 dark:text-white/30">
          본 고지는 서비스 변경에 따라 업데이트될 수 있습니다.
        </p>
      </section>
    </main>
  );
}
