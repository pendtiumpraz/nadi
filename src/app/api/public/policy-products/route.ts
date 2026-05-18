import { NextResponse } from "next/server";
import { listPolicyProductTypes } from "@/lib/policy-products-store";

export const dynamic = "force-dynamic";

/** Public — used by the article editor (any signed-in user) and the public
 *  /publications page filter to render the available type list. */
export async function GET() {
    const items = await listPolicyProductTypes();
    return NextResponse.json({ items });
}
