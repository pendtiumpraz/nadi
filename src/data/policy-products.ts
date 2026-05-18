// ════════════════════════════════════════════════════════════════════
// Policy Product Types — single source of truth for the editor flow.
// Verbatim from `NADI Policy Product Guideline and Templates.docx`.
// Used by:
//   - <PolicyProductPicker> (radio cards under "Create Article")
//   - buildScaffoldHTML() to seed the editor with section headings
//   - <WordCounter> for current/min-max display
//   - articles.policy_product_type DB column
// ════════════════════════════════════════════════════════════════════

/** Slug of a policy product type. The three built-ins are still used as a
 *  fallback constants when the dynamic list hasn't loaded yet, but the union
 *  is widened to `string` because admins can now register custom types via
 *  /admin/policy-types. */
export type PolicyProductType = string;

export interface PolicyProductSection {
    heading: string;
    placeholder: string;
}

export interface PolicyProductDef {
    key: PolicyProductType;
    label: string;
    /** Shown beneath the picker tile and in admin docs */
    shortDescription: string;
    /** Word-count guidance — soft (warning only, no hard block) */
    wordCount: { min: number; max: number | null };
    /** Free-text length guidance for display */
    pageLength: string;
    /** Tone guidance */
    tone: string;
    /** Whether primary research is allowed / required */
    primaryResearchNote: string;
    /** Section scaffold injected into the editor when chosen */
    sections: PolicyProductSection[];
    /** Maps to legacy `category` column for backwards compat with listing filters */
    legacyCategory: string;
}

export const POLICY_PRODUCTS: Record<PolicyProductType, PolicyProductDef> = {
    opinion_piece: {
        key: "opinion_piece",
        label: "Opinion Piece",
        shortDescription:
            "Short persuasive commentary (600–1,200 words, ~1 page). Tone may be biased so long as arguments are evidence-backed. Author credibility required — byline is public.",
        wordCount: { min: 600, max: 1200 },
        pageLength: "≤ 1 page",
        tone: "May be biased; arguments must be evidence-backed",
        primaryResearchNote: "Not required",
        sections: [
            {
                heading: "Opening",
                placeholder:
                    "Strong statements or hooks that catch the reader's attention. Explain why this issue matters and how it is relevant to / affecting the reader.",
            },
            {
                heading: "Constructive Opinion / Argument 1",
                placeholder: "First argument with supporting points and evidence.",
            },
            {
                heading: "Constructive Opinion / Argument 2",
                placeholder: "Second argument with supporting points and evidence.",
            },
            {
                heading: "Constructive Opinion / Argument 3",
                placeholder: "Third argument with supporting points and evidence.",
            },
            {
                heading: "Closing",
                placeholder:
                    "Conclude with a call to action and/or recommendation using NADI's ABC approach (recommendation titles begin with A, then B, then C).",
            },
        ],
        legacyCategory: "OPINION",
    },
    policy_brief: {
        key: "policy_brief",
        label: "Policy Brief",
        shortDescription:
            "Concise, action-oriented brief (800–2,000 words, 2–4 pages) aimed at policymakers. Neutral tone, secondary-research-backed.",
        wordCount: { min: 800, max: 2000 },
        pageLength: "2–4 pages",
        tone: "Neutral, common policy language",
        primaryResearchNote:
            "Primary research allowed only after verification by the QC team",
        sections: [
            {
                heading: "Key Messages",
                placeholder:
                    "3–4 one-line bullet points summarising the problem statement, findings, and recommendation.",
            },
            {
                heading: "Problem Definition",
                placeholder:
                    "Context of the issue / policy / program through background and current landscape. Identify the core problem and highlight its importance.",
            },
            {
                heading: "Analysis",
                placeholder:
                    "Assess policy gaps, challenges, and opportunities using a clear analysis approach (e.g., benchmarking to other countries, comparative case studies). May be divided into sub-chapters.",
            },
            {
                heading: "Recommendation",
                placeholder:
                    "One-page concise recommendation using NADI's ABC approach. Must not introduce new information beyond what is already in the brief.",
            },
            {
                heading: "Works Cited",
                placeholder:
                    "Full bibliography of all sources cited (data & statistics, academic literature, official reports, etc.).",
            },
        ],
        legacyCategory: "POLICY BRIEF",
    },
    policy_paper: {
        key: "policy_paper",
        label: "Policy Paper",
        shortDescription:
            "In-depth policy analysis (5,000–7,500+ words, 10–15 pages) presenting comprehensive solutions or major reforms. Mixed-method research preferred.",
        wordCount: { min: 5000, max: null },
        pageLength: "10–15 pages",
        tone: "Neutral, common policy language",
        primaryResearchNote:
            "Primary research (surveys, IDIs, FGDs, observation) preferable. Mixed-method approach recommended.",
        sections: [
            {
                heading: "Executive Summary",
                placeholder:
                    "One-page overview: problem statement, key findings, and main recommendations.",
            },
            {
                heading: "Current Situation / Current Landscape",
                placeholder:
                    "Context of the issue: who is affected, when and where the issue occurs, and the key actors. Include the core problem.",
            },
            {
                heading: "Policy Review",
                placeholder:
                    "Review of relevant government programs, policies, and strategies pertaining to the issue. May be divided into sub-chapters.",
            },
            {
                heading: "Analysis",
                placeholder:
                    "Brief explanation of methods and research approach (details may go to Appendix). Assess policy gaps, challenges, and opportunities backed by comprehensive evidence.",
            },
            {
                heading: "Recommendation",
                placeholder:
                    "One- to two-page recommendation using NADI's ABC approach. Must not introduce new information beyond what is discussed in the paper.",
            },
            {
                heading: "Works Cited",
                placeholder:
                    "Full bibliography of all sources cited.",
            },
            {
                heading: "Appendix",
                placeholder:
                    "Supplementary materials: graphs, tables, figures, and detailed information that adds context or justifies the analysis.",
            },
        ],
        legacyCategory: "POLICY ANALYSIS",
    },
};

export const POLICY_PRODUCT_LIST = Object.values(POLICY_PRODUCTS);

/** Mandatory acknowledgements at submit time (from the guideline's
 *  "Authorship and Research Integrity" clause, identical across all 3 types). */
export const AUTHORSHIP_RULES = [
    "Author retains full authorship for the content of their work.",
    "Author bears full responsibility for any issues related to plagiarism and the validity of the data.",
    "Author must disclose when and which parts of their work involve the use of artificial intelligence (AI).",
] as const;

export function getProduct(key: string | null | undefined): PolicyProductDef | null {
    if (!key) return null;
    return POLICY_PRODUCTS[key as PolicyProductType] ?? null;
}
