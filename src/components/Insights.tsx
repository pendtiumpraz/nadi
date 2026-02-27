import ArticleCard from "@/components/ArticleCard";
import { getLatestArticles } from "@/data/articles";

export default function Insights() {
    const articles = getLatestArticles(3);

    return (
        <section className="insights" id="insights">
            <div className="section-inner">
                <div className="insights-header">
                    <div>
                        <p className="section-label">Insights &amp; Publications</p>
                        <h2 className="section-title">Latest <em>thinking</em></h2>
                    </div>
                    <a href="/publications" className="link-text">View All Publications →</a>
                </div>
                <div className="insights-grid">
                    {articles.map((article, i) => (
                        <ArticleCard key={article.slug} article={article} featured={i === 0} />
                    ))}
                </div>
            </div>
        </section>
    );
}
