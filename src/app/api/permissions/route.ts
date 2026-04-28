import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { getMatrix, setMatrix, MENU_ITEMS, ROLES, type RoleMenuMatrix } from "@/lib/permissions-matrix";

// GET — any authenticated user can see the matrix (so the client can render the sidebar correctly).
export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const matrix = await getMatrix();
    return NextResponse.json({ matrix, menus: MENU_ITEMS, roles: ROLES });
}

// PUT — admins only.
export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canManageUsers(session.user)) {
        return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }
    try {
        const body = await req.json();
        const matrix = body.matrix as RoleMenuMatrix;
        if (!matrix) {
            return NextResponse.json({ error: "Body must include `matrix`." }, { status: 400 });
        }
        // Validate keys
        const validKeys = new Set(MENU_ITEMS.map((m) => m.key));
        for (const role of ROLES) {
            const list = matrix[role];
            if (!Array.isArray(list)) {
                return NextResponse.json({ error: `matrix.${role} must be an array.` }, { status: 400 });
            }
            for (const k of list) {
                if (!validKeys.has(k)) {
                    return NextResponse.json({ error: `Unknown menu key: ${k}` }, { status: 400 });
                }
            }
        }
        await setMatrix(matrix);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}
