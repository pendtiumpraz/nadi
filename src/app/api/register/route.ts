import { NextRequest, NextResponse } from "next/server";
import { addUser, logUserEvent } from "@/lib/users";

// Public registration. Creates a contributor account with status='pending'.
// Admin must activate the account before sign-in is allowed.
export async function POST(req: NextRequest) {
    try {
        const { email, name, password } = await req.json();
        if (!email || !name || !password) {
            return NextResponse.json(
                { error: "Email, name, and password are required." },
                { status: 400 }
            );
        }
        if (typeof password !== "string" || password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters." },
                { status: 400 }
            );
        }
        if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
        }

        const user = await addUser(email, name, password, "contributor", "pending");
        await logUserEvent(null, user.id, "self_registered", { email });

        return NextResponse.json(
            {
                success: true,
                message: "Registration received. An admin will review and activate your account shortly.",
            },
            { status: 201 }
        );
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 400 }
        );
    }
}
