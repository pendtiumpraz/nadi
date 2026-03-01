import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllUsers, addUser, deleteUser, updateUserRole } from "@/lib/users";

export async function GET() {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    return NextResponse.json(await getAllUsers());
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { email, name, password, role } = await req.json();
        if (!email || !name || !password) {
            return NextResponse.json(
                { error: "Email, name, and password are required." },
                { status: 400 }
            );
        }
        const user = await addUser(email, name, password, role || "user");
        return NextResponse.json(user, { status: 201 });
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 400 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
        return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    if (id === session.user.id) {
        return NextResponse.json(
            { error: "Cannot delete yourself." },
            { status: 400 }
        );
    }

    try {
        await deleteUser(id);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 400 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id, role } = await req.json();
        if (!id || !role) {
            return NextResponse.json(
                { error: "ID and role are required." },
                { status: 400 }
            );
        }
        await updateUserRole(id, role);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 400 }
        );
    }
}
