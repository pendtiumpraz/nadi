import { NextRequest, NextResponse } from "next/server";
import { addUser, logUserEvent } from "@/lib/users";
import { notifyUserSignup, notifyRegistrationReceived } from "@/lib/notify";

// Public registration. Creates a contributor OR partner account with
// status='pending'. Admin must activate the account before sign-in is allowed.
// Only these two roles are accepted from the public form — admin and reviewer
// are admin-created only.
const PUBLIC_ROLES = ["contributor", "partner"] as const;
type PublicRole = (typeof PUBLIC_ROLES)[number];

export async function POST(req: NextRequest) {
    try {
        const { email, name, password, role } = await req.json();
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
        // Reject anything outside the allowlist so the public form can't be
        // used to provision an admin / reviewer account.
        const safeRole: PublicRole = PUBLIC_ROLES.includes(role) ? (role as PublicRole) : "contributor";

        const user = await addUser(email, name, password, safeRole, "pending");
        await logUserEvent(null, user.id, "self_registered", { email, role: safeRole });

        const baseUrl = req.nextUrl?.origin || `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`;
        notifyUserSignup({ name, email, baseUrl }).catch(() => { /* fire-and-forget */ });
        // Confirmation email to the registrant so they know the request landed.
        notifyRegistrationReceived({ name, email }).catch(() => { /* fire-and-forget */ });

        return NextResponse.json(
            {
                success: true,
                role: safeRole,
                message: `Registration received as ${safeRole}. An admin will review and activate your account shortly.`,
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
