import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";
import { auth } from "@/lib/auth";
import { canPublish } from "@/lib/permissions";
import { validateUpload, PRESET_IMAGE_5MB } from "@/lib/upload-security";

// ════════════════════════════════════════════════════════════════════
// Admin branding upload (logo + favicon).
// Auth-gated. Accepts PNG / JPG / WebP up to 5 MB. Returns the public
// URL of the stored file so the caller can save it to site_settings.
// ════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canPublish(session.user)) return NextResponse.json({ error: "Admin or reviewer required" }, { status: 403 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const kind = String(formData.get("kind") || "logo").replace(/[^a-z0-9_-]/gi, "");
        const validation = validateUpload(file, PRESET_IMAGE_5MB);
        if (!validation.ok) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const buffer = Buffer.from(await file!.arrayBuffer());
        const filename = `${kind || "logo"}-${Date.now()}.${validation.extension}`;

        let url: string;
        if (process.env.VERCEL) {
            const blob = await put(`branding/${filename}`, buffer, {
                access: "public",
                addRandomSuffix: true,
            });
            url = blob.url;
        } else {
            const dir = path.join(process.cwd(), "public/uploads/branding");
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, filename), buffer);
            url = `/uploads/branding/${filename}`;
        }

        return NextResponse.json({ url });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
