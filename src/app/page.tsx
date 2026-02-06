import { Suspense } from "react";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-5 pt-24 pb-24 text-white/60">
          홈 화면 불러오는 중…
        </main>
      }
    >
      <HomeClient />
    </Suspense>
  );
}
