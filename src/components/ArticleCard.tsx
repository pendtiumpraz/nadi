import { Article } from "@/data/articles/types";

interface ArticleCardProps {
    article: Article;
    featured?: boolean;
}

export default function ArticleCard({ article, featured }: ArticleCardProps) {
    const isRed = article.coverColor === "crimson" || article.coverColor === "dark";

    return (
        <a href={`/publications/${article.slug}`} className="insight-card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="insight-card-img">
                <div className={`insight-card-img-inner${isRed ? " red" : ""}`} style={!featured && article.coverColor === "dark" ? { fontSize: "1.8rem" } : undefined}>
                    NADI
                </div>
            </div>
            <div className="insight-card-body">
                <p className="insight-category">{article.category}</p>
                <h3 className="insight-title">{article.title}</h3>
                <p className="insight-excerpt">{article.seo.description}</p>
            </div>
            <div className="insight-footer">
                <span>{new Date(article.date).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</span>
                <span>{article.category}</span>
            </div>
        </a>
    );
}
