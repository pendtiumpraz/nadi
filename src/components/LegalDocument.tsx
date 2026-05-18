"use client";

import * as React from "react";

interface Props {
    title: string;
    eyebrow: string;
    intro?: string;
    updatedAt?: string;
    html: string;
}

interface TocEntry {
    id: string;
    text: string;
}

/** Parses h2 anchors out of the rendered HTML so the sticky side TOC matches
 *  whatever the admin saved without us hard-coding section names. */
function extractToc(html: string): TocEntry[] {
    if (typeof window === "undefined") return [];
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    const sections = wrapper.querySelectorAll("section[id]");
    const out: TocEntry[] = [];
    sections.forEach((s) => {
        const id = s.getAttribute("id") || "";
        const h2 = s.querySelector("h2");
        const text = (h2?.textContent || "").trim();
        if (id && text) out.push({ id, text });
    });
    return out;
}

export default function LegalDocument({ title, eyebrow, intro, updatedAt, html }: Props): React.JSX.Element {
    const [toc, setToc] = React.useState<TocEntry[]>([]);

    React.useEffect(() => {
        setToc(extractToc(html));
    }, [html]);

    return (
        <div className="legal-page">
            <header className="legal-hero">
                <div className="legal-hero-inner">
                    <span className="legal-hero-eyebrow">{eyebrow}</span>
                    <h1 className="legal-hero-title">{title}</h1>
                    {intro && <p className="legal-hero-intro">{intro}</p>}
                    {updatedAt && (
                        <span className="legal-hero-stamp">
                            Last updated · {new Date(updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                    )}
                </div>
            </header>

            <div className="legal-shell">
                {toc.length > 0 && (
                    <aside className="legal-toc" aria-label="Table of contents">
                        <div className="legal-toc-title">Table of Contents</div>
                        <ol>
                            {toc.map((entry, i) => (
                                <li key={entry.id}>
                                    <a href={`#${entry.id}`}>
                                        <span className="legal-toc-num">{i + 1}.</span>
                                        <span>{entry.text.replace(/^\d+\.\s*/, "")}</span>
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </aside>
                )}
                <article className="legal-doc" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
        </div>
    );
}
