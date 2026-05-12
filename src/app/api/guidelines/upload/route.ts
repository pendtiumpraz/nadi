import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { getDB } from "@/lib/db";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";
import { validateUpload, PRESET_GUIDELINE_25MB } from "@/lib/upload-security";

// POST — upload policy product guideline (PDF or DOCX). Admin only.
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canManageUsers(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const validation = validateUpload(file, PRESET_GUIDELINE_25MB);
        if (!validation.ok) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const buffer = Buffer.from(await file!.arrayBuffer());
        const filename = `policy-guideline-${Date.now()}.${validation.extension}`;

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
