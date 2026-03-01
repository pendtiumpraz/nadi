import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { callDeepSeek, extractJSON } from "@/lib/deepseek";

const SYSTEM_PROMPT = `You are a senior policy writer for NADI — Network for Advancing Development & Innovation in Health. 

Write magazine-quality articles that are intellectually rigorous, SEO-friendly, and visually compelling when rendered in a block-based layout.

You MUST output a single JSON object matching this EXACT schema:

{
  "title": "SEO-optimized title (60-70 chars ideal)",
  "subtitle": "Engaging subtitle",
  "category": "POLICY BRIEF | RESEARCH PAPER | STRATEGIC ANALYSIS | WORKING PAPER | RESEARCH NOTE",
  "readTime": "X min read",
  "author": "NADI Research Team",
  "coverColor": "crimson | charcoal | dark",
  "seo": {
    "description": "Meta description (150-160 chars, compelling, keyword-rich)",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
  },
  "blocks": [
    // Use a MIX of these block types for visual variety (magazine-style):
    { "type": "lead", "text": "Opening paragraph, sets the tone (2-3 sentences)" },
    { "type": "text", "text": "Body paragraph" },
    { "type": "heading", "text": "Section heading" },
    { "type": "quote", "text": "Quote text", "attribution": "Source" },
    { "type": "pullquote", "text": "Impactful standalone quote" },
    { "type": "two-column", "left": "Left column text", "right": "Right column text" },
    { "type": "asymmetric", "left": "Larger column", "right": "Smaller column", "offsetRight": true },
    { "type": "highlight", "text": "Key insight or finding highlighted" },
    { "type": "callout", "label": "KEY FINDING", "text": "Important callout text" },
    { "type": "list", "items": ["Item 1", "Item 2", "Item 3"] },
    { "type": "stat", "value": "63%", "label": "Description of the statistic" },
    { "type": "divider" }
  ]
}

RULES:
1. Article must have 12-20 blocks minimum for depth
2. Start with a "lead" block, then vary block types for visual interest
3. Use at least 3-4 different block types (not just "text" blocks)
4. Include at least 1 stat, 1 quote or pullquote, 1 callout or highlight
5. Use two-column or asymmetric blocks for comparative analysis
6. Make it genuinely informative with real policy insights
7. SEO: title should contain primary keyword, description should be compelling
8. All text should be substantive — no filler content
9. Output ONLY the JSON object, no markdown or explanation`;

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { title, category, description, topicId } = await req.json();
        if (!title) {
            return NextResponse.json({ error: "Title/topic is required" }, { status: 400 });
        }

        const userPrompt = `Write a full article about:

Title: ${title}
${category ? `Category: ${category}` : ""}
${description ? `Brief: ${description}` : ""}

Write from NADI's perspective as a health policy institute. Make it data-informed, policy-relevant, and intellectually rigorous. Use real-world examples and evidence where possible. The article should be 1500-2500 words equivalent in content depth.

Remember: output ONLY valid JSON matching the schema. Use a rich variety of block types for magazine-style layout.`;

        const raw = await callDeepSeek(SYSTEM_PROMPT, userPrompt, 0.7);
        const article = JSON.parse(extractJSON(raw));

        // Auto-generate slug from title
        article.slug = article.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        article.date = new Date().toISOString().split("T")[0];
        article.coverImage = ""; // No cover image — user adds later

        // Mark topic as published if topicId provided
        if (topicId) {
            const { markTopicPublished } = await import("@/lib/topics-store");
            await markTopicPublished(Number(topicId), article.slug);
        }

        return NextResponse.json({ article });
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 500 }
        );
    }
}
