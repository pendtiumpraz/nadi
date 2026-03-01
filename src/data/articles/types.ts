// ══════════════════════════════════════════
// Article & Block Type Definitions
// ══════════════════════════════════════════

export type BlockType =
    | "lead"
    | "text"
    | "heading"
    | "quote"
    | "pullquote"
    | "two-column"
    | "asymmetric"
    | "highlight"
    | "callout"
    | "list"
    | "stat"
    | "divider";

export interface BlockLead {
    type: "lead";
    text: string;
}

export interface BlockText {
    type: "text";
    text: string;
}

export interface BlockHeading {
    type: "heading";
    text: string;
}

export interface BlockQuote {
    type: "quote";
    text: string;
    attribution?: string;
}

export interface BlockPullquote {
    type: "pullquote";
    text: string;
}

export interface BlockTwoColumn {
    type: "two-column";
    left: string;
    right: string;
}

export interface BlockAsymmetric {
    type: "asymmetric";
    left: string;
    right: string;
    offsetRight?: boolean; // true = right col is lower, false = left col is lower
}

export interface BlockHighlight {
    type: "highlight";
    text: string;
}

export interface BlockCallout {
    type: "callout";
    label: string;
    text: string;
}

export interface BlockList {
    type: "list";
    items: string[];
}

export interface BlockStat {
    type: "stat";
    value: string;
    label: string;
}

export interface BlockDivider {
    type: "divider";
}

export type ContentBlock =
    | BlockLead
    | BlockText
    | BlockHeading
    | BlockQuote
    | BlockPullquote
    | BlockTwoColumn
    | BlockAsymmetric
    | BlockHighlight
    | BlockCallout
    | BlockList
    | BlockStat
    | BlockDivider;

export interface ArticleSEO {
    description: string;
    keywords: string[];
}

export interface Article {
    slug: string;
    title: string;
    subtitle: string;
    category: string;
    date: string;
    readTime: string;
    author: string;
    coverColor: "crimson" | "charcoal" | "dark";
    coverImage?: string;
    seo: ArticleSEO;
    blocks: ContentBlock[];
}
