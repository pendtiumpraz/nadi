import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { changePassword } from "@/lib/users";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id, newPassword } = await req.json();
        if (!id || !newPassword) {
            return NextResponse.json(
                { error: "User ID and new password are required." },
                { status: 400 }
            );
        }
        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters." },
                { status: 400 }
            );
        }
        await changePassword(id, newPassword);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 400 }
        );
    }
}
