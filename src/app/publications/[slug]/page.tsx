import { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleRenderer from "@/components/ArticleRenderer";
import { getAllArticlesAsync } from "@/data/articles";

// Dynamic — articles can come from blob storage
export const dynamic = "force-dynamic";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const articles = await getAllArticlesAsync();
    const article = articles.find((a) => a.slug === slug);
    if (!article) return { title: "Article Not Found" };
    return {
        title: `${article.title} — NADI`,
        description: article.seo.description,
        keywords: article.seo.keywords,
        openGraph: {
            title: article.title,
            description: article.seo.description,
            type: "article",
            publishedTime: article.date,
            authors: [article.author],
        },
        twitter: {
            card: "summary_large_image",
            title: article.title,
            description: article.seo.description,
        },
    };
}

export default async function ArticlePage({ params }: Props) {
    const { slug } = await params;
    const articles = await getAllArticlesAsync();
    const article = articles.find((a) => a.slug === slug);
    if (!article) notFound();

    const colorMap = {
        crimson: "var(--crimson)",
        charcoal: "var(--charcoal)",
        dark: "var(--dark)",
    };

    return (
        <>
            <Navbar />
            <main>
                <article className="article-page">
                    <header
                        className="article-header"
                        style={{
                            background: colorMap[article.coverColor] || colorMap.charcoal,
                        }}
                    >
                        <div className="article-header-inner">
                            <span className="article-category">{article.category}</span>
                            <h1 className="article-title">{article.title}</h1>
                            <p className="article-subtitle">{article.subtitle}</p>
                            <div className="article-meta">
                                <span>{article.author}</span>
                                <span>·</span>
                                <span>
                                    {new Date(article.date).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </span>
                                <span>·</span>
                                <span>{article.readTime}</span>
                            </div>
                        </div>
                    </header>
                    <div className="article-content">
                        <ArticleRenderer blocks={article.blocks} />
                    </div>
                    <div className="article-back">
                        <a href="/publications" className="btn-outline">
                            ← All Publications
                        </a>
                    </div>
                </article>
            </main>
            <Footer />
        </>
    );
}
