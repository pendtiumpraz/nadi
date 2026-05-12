import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { callDeepSeek, extractJSON } from "@/lib/deepseek";
import { saveTopics, getAllTopics, getPendingTopics, deleteTopic } from "@/lib/topics-store";
import { checkAiCall, recordAiCall } from "@/lib/ai-throttle";

const SYSTEM_PROMPT = `You are a research topic strategist for NADI — a health policy research institute.
Generate article topics that are specific, researchable, and relevant to health policy.
Each topic should have: title, description (2-3 sentences), and category.
Categories: POLICY BRIEF, RESEARCH PAPER, POLICY ANALYSIS, OPINION, RESEARCH NOTE
Respond ONLY with a JSON array: [{"title":"...","description":"...","category":"..."}]`;

// GET — list all topics (optionally filter by status)
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const status = new URL(req.url).searchParams.get("status");
    if (status === "pending") {
        return NextResponse.json(await getPendingTopics());
    }
    return NextResponse.json(await getAllTopics());
}

// POST — generate new topics with AI and save to DB
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    try {
        const { focusArea, count } = await req.json();
        // Cap count to avoid runaway prompts ("generate 10000 topics")
        const safeCount = Math.min(Math.max(1, Number(count) || 5), 20);
        const userPrompt = `Generate ${safeCount} article topics${focusArea ? ` focused on: ${focusArea}` : " about health policy, governance, and financing"}.`;
        const check = await checkAiCall(session.user.id, userPrompt);
        if (!check.ok) return NextResponse.json({ error: check.error }, { status: 429 });
        const raw = await callDeepSeek(SYSTEM_PROMPT, userPrompt, 0.7, check.maxOutputTokens);
        await recordAiCall(session.user.id, "topics", userPrompt.length);
        const topics = JSON.parse(extractJSON(raw));

        // Save to DB
        const saved = await saveTopics(topics, focusArea || "general");
        return NextResponse.json({ topics: saved });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

// DELETE — remove a topic
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await deleteTopic(Number(id));
    return NextResponse.json({ success: true });
}
