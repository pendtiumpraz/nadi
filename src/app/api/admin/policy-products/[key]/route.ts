import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canPublish } from "@/lib/permissions";
import {
    getPolicyProductTypeByKey,
    updatePolicyProductType,
    deletePolicyProductType,
} from "@/lib/policy-products-store";

export const dynamic = "force-dynamic";

interface Params {
    params: Promise<{ key: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const { key } = await params;
    const item = await getPolicyProductTypeByKey(key);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ item });
}

export async function PUT(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canPublish(session.user)) return NextResponse.json({ error: "Admin or reviewer required" }, { status: 403 });
    const { key } = await params;
    try {
        const body = await req.json();
        const updated = await updatePolicyProductType(key, body);
        return NextResponse.json({ item: updated });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canPublish(session.user)) return NextResponse.json({ error: "Admin or reviewer required" }, { status: 403 });
    const { key } = await params;
    try {
        await deletePolicyProductType(key);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}
