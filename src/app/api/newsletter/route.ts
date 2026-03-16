import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllSubscribers, getSubscriberCount, toggleSubscriber, deleteSubscriber } from "@/lib/newsletter-store";

// GET — list all subscribers (admin only)
export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    try {
        const subscribers = await getAllSubscribers();
        const counts = await getSubscriberCount();
        return NextResponse.json({ subscribers, ...counts });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

// PUT — toggle subscriber active status (admin only)
export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    try {
        const { id, isActive } = await req.json();
        if (!id || typeof isActive !== "boolean") {
            return NextResponse.json({ error: "id and isActive are required" }, { status: 400 });
        }
        await toggleSubscriber(id, isActive);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

// DELETE — remove subscriber (admin only)
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    try {
        await deleteSubscriber(Number(id));
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
