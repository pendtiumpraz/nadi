import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canPublish } from "@/lib/permissions";
import {
    listPolicyProductTypes,
    createPolicyProductType,
    type PolicyProductTypeInput,
} from "@/lib/policy-products-store";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const items = await listPolicyProductTypes({ includeArchived: true });
    return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canPublish(session.user)) return NextResponse.json({ error: "Admin or reviewer required" }, { status: 403 });
    try {
        const body = (await req.json()) as PolicyProductTypeInput;
        const created = await createPolicyProductType(body);
        return NextResponse.json({ item: created }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}
