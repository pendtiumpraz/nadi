import { NextRequest, NextResponse } from "next/server";
import { addSubscriber } from "@/lib/newsletter-store";

// POST — public subscribe (no auth needed, IP-rate-limited)
export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
        }

        // Get client IP for rate limiting
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "unknown";

        const result = await addSubscriber(email.trim(), ip);
        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 409 });
        }

        return NextResponse.json({ message: result.message });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
