import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Areas from "@/components/Areas";
import Methodology from "@/components/Methodology";
import Engage from "@/components/Engage";
import Philosophy from "@/components/Philosophy";
import Partners from "@/components/Partners";
import CtaBand from "@/components/CtaBand";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Areas />
        <Methodology />
        <Engage />
        <Partners />
        <Philosophy />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
