import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Areas from "@/components/Areas";
import Methodology from "@/components/Methodology";
import Engage from "@/components/Engage";
import Partners from "@/components/Partners";
import Insights from "@/components/Insights";
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
        <Insights />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
