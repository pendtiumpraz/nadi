import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { getDB } from "@/lib/db";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

const MAX_BYTES = 25 * 1024 * 1024;
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// POST — upload policy product guideline (PDF or DOCX). Admin only.
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canManageUsers(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file || file.size === 0) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json({ error: "File too large (max 25 MB)" }, { status: 400 });
        }

        const originalName = file.name || "guideline";
        const extRaw = originalName.includes(".") ? originalName.split(".").pop()!.toLowerCase() : "";
        const isPdfByMime = file.type === "application/pdf";
        const isDocxByMime = file.type === DOCX_MIME;
        const isPdfByExt = extRaw === "pdf";
        const isDocxByExt = extRaw === "docx";

        const isPdf = isPdfByMime || isPdfByExt;
        const isDocx = isDocxByMime || isDocxByExt;

        if (!isPdf && !isDocx) {
            return NextResponse.json({ error: "File must be a PDF or DOCX" }, { status: 400 });
        }

        const ext = isPdf ? "pdf" : "docx";
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `policy-guideline-${Date.now()}.${ext}`;

        let url: string;
        if (process.env.VERCEL) {
            const blob = await put(`guidelines/${filename}`, buffer, {
                access: "public",
                addRandomSuffix: true,
            });
            url = blob.url;
        } else {
            const dir = path.join(process.cwd(), "public/uploads/guidelines");
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, filename), buffer);
            url = `/uploads/guidelines/${filename}`;
        }

        const sql = getDB();
        await sql`
            INSERT INTO site_settings (key, value, updated_at)
            VALUES ('guideline_url', ${url}, NOW())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `;

        return NextResponse.json({ url });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
