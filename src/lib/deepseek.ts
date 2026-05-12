const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

const HARD_MAX_TOKENS = 8000; // absolute upper bound regardless of caller config

export async function callDeepSeek(
    systemPrompt: string,
    userPrompt: string,
    temperature = 0.7,
    maxTokens = 4096,
): Promise<string> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("DEEPSEEK_API_KEY not configured");

    // Enforce a HARD cap so a misconfigured admin (or a code path that
    // forgets to clamp) can't accidentally request a 100k-token completion.
    const safeMaxTokens = Math.min(Math.max(64, maxTokens), HARD_MAX_TOKENS);

    const res = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature,
            max_tokens: safeMaxTokens,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`DeepSeek API error: ${res.status} ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
}

export function extractJSON(text: string): string {
    // Extract JSON from markdown code blocks or raw text
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return match[1].trim();
    // Try to find raw JSON
    const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (jsonMatch) return jsonMatch[1].trim();
    return text.trim();
}
