import ArticleCard from "@/components/ArticleCard";
import { getLatestArticles } from "@/data/articles";

export default function LatestPublications() {
    const articles = getLatestArticles(3);

    return (
        <section className="latest-pubs" id="publications">
            <div className="section-inner">
                <div className="latest-pubs-header">
                    <div>
                        <p className="section-label">Publications</p>
                    </div>
                    <a href="/publications" className="latest-pubs-link">
                        View All →
                    </a>
                </div>
                <div className="latest-pubs-grid">
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
    );
}
