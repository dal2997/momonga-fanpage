// src/app/browse/loading.tsx
// 탐색 페이지 로딩 중 표시되는 스켈레톤 UI

export default function BrowseLoading() {
  return (
    <main className="mx-auto max-w-6xl px-5 pt-24 pb-32">
      {/* 헤더 스켈레톤 */}
      <div className="mb-8">
        <div className="h-8 w-32 rounded-xl bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
        <div className="mt-2 h-4 w-56 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] animate-pulse" />
      </div>

      {/* 유저 카드 그리드 스켈레톤 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-black/8 bg-white/60 p-4 backdrop-blur dark:border-white/8 dark:bg-white/[0.04]"
          >
            {/* 유저 정보 헤더 */}
            <div className="flex items-center gap-3 mb-4">
              {/* 아바타 */}
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded-lg bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
                <div className="h-3 w-16 rounded-md bg-black/[0.04] dark:bg-white/[0.04] animate-pulse" />
              </div>
              <div className="h-6 w-16 rounded-full bg-black/[0.04] dark:bg-white/[0.04] animate-pulse" />
            </div>

            {/* 미리보기 이미지 그리드 */}
            <div className="grid grid-cols-5 gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div
                  key={j}
                  className="aspect-square rounded-xl bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                  style={{ animationDelay: `${(i * 5 + j) * 40}ms` }}
                />
              ))}
            </div>

            {/* 하단 버튼 */}
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded-md bg-black/[0.04] dark:bg-white/[0.04] animate-pulse" />
              <div className="h-8 w-20 rounded-full bg-black/[0.04] dark:bg-white/[0.04] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
