import Hero from "@/components/sections/Hero";
import Gallery from "@/components/sections/Gallery";
import Profile from "@/components/sections/Profile";
import Footer from "@/components/sections/Footer";
import TopTabs from "@/components/layout/TopTabs";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="spotlight" />
      <div className="noise" />

      <TopTabs />

      <div className="mx-auto max-w-5xl px-6 py-16 space-y-24">
        <Hero />
        <Gallery />
        <Profile />
      </div>

      <Footer />
    </main>
  );
}
