import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { callDeepSeek, extractJSON } from "@/lib/deepseek";

const SYSTEM_PROMPT = `You are a layout engine for NADI — a health policy research institute.

Your job: take raw article text and convert it into a structured JSON array of content blocks for a magazine-style layout.

Analyze the text and intelligently decide which block types to use. Use a VARIETY of block types for visual interest — NOT just "text" blocks.

Available block types:
- { "type": "lead", "text": "..." } — Opening paragraph, sets the tone (use for the first paragraph)
- { "type": "text", "text": "..." } — Regular body paragraph
- { "type": "heading", "text": "..." } — Section heading (use when you detect a new topic/section)
- { "type": "quote", "text": "...", "attribution": "..." } — Attributed quote
- { "type": "pullquote", "text": "..." } — Impactful standalone statement (pull from the text)
- { "type": "two-column", "left": "...", "right": "..." } — Side-by-side content (for comparisons, contrasts)
- { "type": "highlight", "text": "..." } — Key insight or important finding
- { "type": "callout", "label": "KEY FINDING", "text": "..." } — Labeled callout box
- { "type": "list", "items": ["...", "..."] } — Bullet list (detect lists in the text)
- { "type": "stat", "value": "...", "label": "..." } — Statistics (detect numbers/percentages)
- { "type": "divider" } — Visual separator between sections

RULES:
1. Use at least 4-5 different block types
2. First block should be "lead"
3. Create "heading" blocks for clear section transitions
4. Extract impactful sentences as "pullquote" blocks
5. Detect statistics and make them "stat" blocks
6. Use "highlight" or "callout" for key findings
7. If text has comparisons, use "two-column"
8. Detect listed items and convert to "list" blocks
9. Add "divider" between major sections
10. Output ONLY the JSON array, no other text`;

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { content } = await req.json();
        if (!content || content.trim().length < 50) {
            return NextResponse.json({ error: "Content too short (min 50 chars)" }, { status: 400 });
        }

        const userPrompt = `Convert this article text into magazine-style content blocks:\n\n${content}`;
        const raw = await callDeepSeek(SYSTEM_PROMPT, userPrompt, 0.3);
        const blocks = JSON.parse(extractJSON(raw));

        return NextResponse.json({ blocks });
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 500 }
        );
    }
}
