import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";
import ServiceWorkerRegistrar from "@/components/providers/ServiceWorkerRegistrar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "momonga — 내 수집품 기록",
  description: "굿즈, 피규어, 모든 수집품을 기록하고 공유하세요 🐿️",
  applicationName: "momonga",
  appleWebApp: {
    capable: true,
    title: "momonga",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/favicon.ico",         sizes: "any" },
      { url: "/icons/favicon-32.png", sizes: "32x32",   type: "image/png" },
      { url: "/icons/icon-192.png",   sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png",   sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)",  color: "#18181b" },
  ],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
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

          {/* PWA 서비스워커 등록 */}
          <ServiceWorkerRegistrar />
        </ThemeProvider>
      </body>
    </html>
  );
}
