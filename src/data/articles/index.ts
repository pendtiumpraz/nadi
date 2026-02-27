import { Article } from "./types";

import healthFinancing from "./health-financing-southeast-asia.json";
import vaccineGovernance from "./vaccine-governance-global-south.json";
import policyCoherence from "./policy-coherence-universal-health-coverage.json";

const articles: Article[] = [
    healthFinancing as Article,
    vaccineGovernance as Article,
    policyCoherence as Article,
];

export function getAllArticles(): Article[] {
    return articles.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export function getArticleBySlug(slug: string): Article | undefined {
    return articles.find((a) => a.slug === slug);
}

export function getLatestArticles(count: number = 3): Article[] {
    return getAllArticles().slice(0, count);
}
