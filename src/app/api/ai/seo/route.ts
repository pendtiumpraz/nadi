import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { callDeepSeek, extractJSON } from "@/lib/deepseek";

const SYSTEM_PROMPT = `You are an SEO specialist for NADI — a health policy research institute.

Given an article title, category, and content excerpt, generate:
1. A compelling meta description (150-160 characters, keyword-rich, click-worthy)
2. 5-7 relevant SEO keywords

Respond ONLY with a JSON object:
{
  "description": "Meta description here (150-160 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { title, category, content } = await req.json();
        const userPrompt = `Generate SEO metadata for this article:
Title: ${title}
Category: ${category || "POLICY BRIEF"}
Content excerpt: ${content || title}`;

        const raw = await callDeepSeek(SYSTEM_PROMPT, userPrompt, 0.4);
        const seo = JSON.parse(extractJSON(raw));
        return NextResponse.json(seo);
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 500 }
        );
    }
}
