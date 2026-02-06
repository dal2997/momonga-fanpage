import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-xl px-4 py-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/60">
            로그인 화면 불러오는 중…
          </div>
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
