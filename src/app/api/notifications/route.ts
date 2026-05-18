import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listNotifications, countUnread } from "@/lib/notifications-store";

export const dynamic = "force-dynamic";

// GET /api/notifications
// Returns the current user's most recent notifications + unread count.
export async function GET(_req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const userId = Number(session.user.id);
    if (!Number.isFinite(userId)) return NextResponse.json({ error: "Invalid session" }, { status: 400 });

    try {
        const [items, unread] = await Promise.all([listNotifications(userId, 20), countUnread(userId)]);
        return NextResponse.json({ items, unread });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
