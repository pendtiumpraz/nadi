import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { callDeepSeek, extractJSON } from "@/lib/deepseek";

const SYSTEM_PROMPT = `You are the editorial director of NADI — Network for Advancing Development & Innovation in Health.

NADI is a research and policy institute working at the intersection of:
- Public Affairs & Communication in Complex Healthcare Ecosystems
- Strategic Training & Institutional Literacy
- Governance & Project Management for Global Collaboration
- Policy Design & Advocacy Architecture

Your role: generate article topics that are intellectually rigorous, policy-relevant, and aligned with NADI's institutional voice. Topics should address real health system challenges — financing, governance, regulation, vaccine policy, UHC, digital health, PPPs, etc.

Each topic must include a suggested SEO-optimized title, category, and a one-sentence description.

Respond ONLY with a JSON array. Each item:
{
  "title": "SEO-optimized article title",
  "category": "POLICY BRIEF | RESEARCH PAPER | STRATEGIC ANALYSIS | WORKING PAPER | RESEARCH NOTE",
  "description": "One sentence describing what the article will cover"
}`;

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { count = 5, focus } = await req.json();
        const userPrompt = focus
            ? `Generate ${count} article topics focused on: "${focus}". Make them specific, evidence-oriented, and policy-relevant.`
            : `Generate ${count} diverse article topics across NADI's core areas. Cover different themes — financing, governance, vaccines, digital health, UHC, training, advocacy.`;

        const raw = await callDeepSeek(SYSTEM_PROMPT, userPrompt, 0.8);
        const topics = JSON.parse(extractJSON(raw));
        return NextResponse.json({ topics });
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 500 }
        );
    }
}
