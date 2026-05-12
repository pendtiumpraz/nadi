import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";

// Records a visitor's acceptance of the Privacy Policy / Terms of Service.
// Anonymous visitors carry a client_token UUID stored in their localStorage;
// authenticated users also write their user_id. The same token won't be
// re-inserted on subsequent visits — uniqueness is enforced by the client
// only sending it once.
export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json();
        if (!token || typeof token !== "string" || token.length > 64) {
            return NextResponse.json({ error: "Invalid token" }, { status: 400 });
        }
        const session = await auth();
        const userId = session?.user?.id ? Number(session.user.id) : null;
        const ip =
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            req.headers.get("x-real-ip") ||
            "";
        const sql = getDB();
        await sql`
            INSERT INTO privacy_consents (user_id, client_token, ip_address)
            VALUES (${userId}, ${token}, ${ip})
        `;
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
