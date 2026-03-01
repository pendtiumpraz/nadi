import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MediaListPublic from "@/components/MediaListPublic";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Media — NADI Research & Policy Institute",
    description: "Videos, podcasts, webinars, and panel discussions on health policy and institutional development.",
};

export default function MediaPage() {
    return (
        <>
            <Navbar />
            <main>
                <section className="publications-page">
                    <div className="section-inner">
                        <p className="section-label">Media</p>
                        <h1 className="section-title">
                            Videos, podcasts &amp; discussions
                        </h1>
                        <MediaListPublic />
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
