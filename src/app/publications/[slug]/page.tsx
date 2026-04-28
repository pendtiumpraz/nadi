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
                        style={
                            article.coverImage
                                ? {
                                    backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url("${article.coverImage}")`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                }
                                : { background: colorMap[article.coverColor] || colorMap.charcoal }
                        }
                    >
                        <div className="article-header-inner">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                                <span className="article-category">{article.category}</span>
                                {article.pdfUrl && (
                                    <span style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.35rem",
                                        padding: "0.25rem 0.75rem",
                                        background: "rgba(255,255,255,0.15)",
                                        borderRadius: "4px",
                                        fontSize: "0.7rem",
                                        fontWeight: 600,
                                        letterSpacing: "0.05em",
                                        textTransform: "uppercase",
                                        color: "rgba(255,255,255,0.9)",
                                    }}>
                                        📄 PDF
                                    </span>
                                )}
                            </div>
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

                    {/* PDF Viewer */}
                    {article.pdfUrl && (
                        <div className="article-pdf-section">
                            <div className="article-pdf-header">
                                <div className="article-pdf-header-left">
                                    <span className="article-pdf-icon">📄</span>
                                    <div>
                                        <h3 className="article-pdf-title">Document PDF</h3>
                                        <p className="article-pdf-subtitle">Baca atau unduh versi lengkap dalam format PDF</p>
                                    </div>
                                </div>
                                <a
                                    href={article.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary"
                                    style={{ fontSize: "0.8rem", padding: "0.5rem 1.25rem", textDecoration: "none" }}
                                >
                                    Buka di Tab Baru ↗
                                </a>
                            </div>
                            <div className="article-pdf-viewer">
                                <iframe
                                    src={article.pdfUrl}
                                    title={`PDF: ${article.title}`}
                                    className="article-pdf-iframe"
                                />
                            </div>
                        </div>
                    )}

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
