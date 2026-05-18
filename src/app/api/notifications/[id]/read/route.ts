import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markRead } from "@/lib/notifications-store";

interface Params {
    params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const userId = Number(session.user.id);
    if (!Number.isFinite(userId)) return NextResponse.json({ error: "Invalid session" }, { status: 400 });

    const { id } = await params;
    const nid = Number(id);
    if (!Number.isFinite(nid)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    try {
        await markRead(userId, nid);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
