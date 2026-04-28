import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    getAllUsers,
    addUser,
    deleteUser,
    updateUserRole,
    updateUserStatus,
    logUserEvent,
    type UserRole,
    type UserStatus,
} from "@/lib/users";

const ROLE_VALUES: UserRole[] = ["admin", "reviewer", "contributor", "partner"];
const STATUS_VALUES: UserStatus[] = ["pending", "active", "suspended"];

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
        const { email, name, password, role, status } = await req.json();
        if (!email || !name || !password) {
            return NextResponse.json(
                { error: "Email, name, and password are required." },
                { status: 400 }
            );
        }
        const safeRole: UserRole = ROLE_VALUES.includes(role) ? role : "contributor";
        const safeStatus: UserStatus = STATUS_VALUES.includes(status) ? status : "active";
        const user = await addUser(email, name, password, safeRole, safeStatus);
        await logUserEvent(session.user.id, user.id, "created", { role: safeRole, status: safeStatus });
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
        await logUserEvent(session.user.id, id, "deleted");
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
        const { id, role, status } = await req.json();
        if (!id) {
            return NextResponse.json({ error: "ID is required." }, { status: 400 });
        }
        if (!role && !status) {
            return NextResponse.json({ error: "Provide role or status to update." }, { status: 400 });
        }
        if (role) {
            if (!ROLE_VALUES.includes(role)) {
                return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });
            }
            await updateUserRole(id, role);
            await logUserEvent(session.user.id, id, "role_changed", { role });
        }
        if (status) {
            if (!STATUS_VALUES.includes(status)) {
                return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
            }
            await updateUserStatus(id, status);
            await logUserEvent(session.user.id, id, `status_${status}`);
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 400 }
        );
    }
}
