import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Momonga",
  description: "Momonga fanpage",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={[geistSans.variable, geistMono.variable, "antialiased min-h-screen"].join(" ")}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* ✅ 배경 레이어: 항상 뒤로 */}
          <div aria-hidden className="spotlight hidden dark:block pointer-events-none fixed inset-0 -z-10" />
          <div aria-hidden className="spotlight-light block dark:hidden pointer-events-none fixed inset-0 -z-10" />
          <div aria-hidden className="noise pointer-events-none fixed inset-0 -z-10" />

          {/* ✅ 실제 콘텐츠 */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
