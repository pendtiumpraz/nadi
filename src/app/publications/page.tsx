import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { getAllArticlesAsync } from "@/data/articles";

export const metadata: Metadata = {
    title: "Publications — NADI Research & Policy Institute",
    description:
        "Policy briefs, research papers, and strategic analyses from NADI on health systems, governance, financing, and institutional design.",
};

export default async function PublicationsPage() {
    const articles = await getAllArticlesAsync();

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
                        <div className="publications-grid">
                            {articles.map((article, i) => (
                                <ArticleCard
                                    key={article.slug}
                                    article={article}
                                    featured={i === 0}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
