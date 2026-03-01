import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PublicationsList from "@/components/PublicationsList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Publications — NADI Research & Policy Institute",
    description:
        "Policy briefs, research papers, and strategic analyses from NADI on health systems, governance, financing, and institutional design.",
};

export default function PublicationsPage() {
    return (
        <>
            <Navbar />
            <main>
                <section className="publications-page">
                    <div className="section-inner">
                        <p className="section-label">Publications</p>
                        <h1 className="section-title">
                            Research, policy briefs &amp; strategic analyses
                        </h1>
                        <PublicationsList />
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
