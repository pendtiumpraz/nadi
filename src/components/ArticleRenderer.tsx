import { ContentBlock } from "@/data/articles/types";

interface ArticleRendererProps {
    blocks: ContentBlock[];
}

export default function ArticleRenderer({ blocks }: ArticleRendererProps) {
    return (
        <div className="article-body">
            {blocks.map((block, i) => {
                switch (block.type) {
                    case "lead":
                        return (
                            <p key={i} className="article-lead">
                                {block.text}
                            </p>
                        );

                    case "text":
                        return (
                            <p key={i} className="article-text">
                                {block.text}
                            </p>
                        );

                    case "heading":
                        return (
                            <h2 key={i} className="article-heading">
                                {block.text}
                            </h2>
                        );

                    case "quote":
                        return (
                            <figure key={i} className="article-quote">
                                <blockquote>{block.text}</blockquote>
                                {block.attribution && (
                                    <figcaption>— {block.attribution}</figcaption>
                                )}
                            </figure>
                        );

                    case "pullquote":
                        return (
                            <div key={i} className="article-pullquote">
                                <span className="article-pullquote-mark">&ldquo;</span>
                                <p>{block.text}</p>
                            </div>
                        );

                    case "two-column":
                        return (
                            <div key={i} className="article-two-col">
                                <div className="article-col">{block.left}</div>
                                <div className="article-col">{block.right}</div>
                            </div>
                        );

                    case "asymmetric":
                        return (
                            <div
                                key={i}
                                className={`article-asymmetric ${block.offsetRight
                                        ? "article-asymmetric--offset-right"
                                        : "article-asymmetric--offset-left"
                                    }`}
                            >
                                <div className="article-asym-left">{block.left}</div>
                                <div className="article-asym-right">{block.right}</div>
                            </div>
                        );

                    case "highlight":
                        return (
                            <div key={i} className="article-highlight">
                                {block.text}
                            </div>
                        );

                    case "callout":
                        return (
                            <div key={i} className="article-callout">
                                <span className="article-callout-label">{block.label}</span>
                                <p>{block.text}</p>
                            </div>
                        );

                    case "list":
                        return (
                            <ul key={i} className="article-list">
                                {block.items.map((item, j) => (
                                    <li key={j}>{item}</li>
                                ))}
                            </ul>
                        );

                    case "stat":
                        return (
                            <div key={i} className="article-stat">
                                <span className="article-stat-value">{block.value}</span>
                                <span className="article-stat-label">{block.label}</span>
                            </div>
                        );

                    case "divider":
                        return <hr key={i} className="article-divider" />;

                    default:
                        return null;
                }
            })}
        </div>
    );
}
