import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";
import { validateUpload, PRESET_IMAGE_5MB, PRESET_PDF_20MB } from "@/lib/upload-security";

// POST — upload article cover image or PDF
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    try {
        const formData = await req.formData();
        const file = (formData.get("image") || formData.get("pdf")) as File | null;
        const slug = (formData.get("slug") as string) || "file";
        const fileType = formData.get("fileType") as string | null; // "pdf" or "image"

        const isPdf = fileType === "pdf" || file?.type === "application/pdf";
        const validation = validateUpload(file, isPdf ? PRESET_PDF_20MB : PRESET_IMAGE_5MB);
        if (!validation.ok) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const buffer = Buffer.from(await file!.arrayBuffer());
        // Use slug-based prefix for human-friendliness; the helper already
        // generated `<sanitised>-<ts>.<ext>` but we replace its base with the slug.
        const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "file";
        const filename = `${safeSlug}-${Date.now()}.${validation.extension}`;
        const folder = isPdf ? "pdfs" : "covers";

        let url: string;
        if (process.env.VERCEL) {
            const blob = await put(`articles/${folder}/${filename}`, buffer, {
                access: "public",
                addRandomSuffix: false,
            });
            url = blob.url;
        } else {
            const dir = path.join(process.cwd(), `public/uploads/articles/${folder}`);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, filename), buffer);
            url = `/uploads/articles/${folder}/${filename}`;
        }

        return NextResponse.json({ url });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
