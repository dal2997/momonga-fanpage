import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-black/8 dark:border-white/8 py-12 text-center">
      {/* 면책 문구 */}
      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-white/25 max-w-xl mx-auto px-5">
        This is an unofficial fan site created for personal, non-commercial purposes only.
        All characters, names, and related imagery are the intellectual property of their respective owners.
        This site is not affiliated with, endorsed by, or in any way officially connected to any rights holder.
      </p>

      {/* 저작권자 표기 */}
      <p className="mt-3 text-[11px] text-zinc-300 dark:text-white/20 tracking-wide">
        © nagano / 小学館　·　© 臼井儀人 / 双葉社 · シンエイ · テレビ朝日 · ADK　·　© SANRIO CO., LTD.
      </p>

      {/* 구분선 + 링크 */}
      <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-300 dark:text-white/20">
        <span>momonga.app</span>
        <span className="opacity-40">·</span>
        <Link
          href="/legal"
          className="transition hover:text-zinc-500 dark:hover:text-white/40"
        >
          법적 고지 &amp; 개인정보 처리방침
        </Link>
        <span className="opacity-40">·</span>
        <span>Fan-made, with love 🐿️</span>
      </div>
    </footer>
  );
}
