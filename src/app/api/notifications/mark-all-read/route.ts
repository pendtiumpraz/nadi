import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markAllRead } from "@/lib/notifications-store";

export async function POST(_req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const userId = Number(session.user.id);
    if (!Number.isFinite(userId)) return NextResponse.json({ error: "Invalid session" }, { status: 400 });

    try {
        await markAllRead(userId);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
