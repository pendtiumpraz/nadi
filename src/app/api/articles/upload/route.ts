import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

// POST — upload article cover image or PDF
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    try {
        const formData = await req.formData();
        const file = (formData.get("image") || formData.get("pdf")) as File | null;
        const slug = formData.get("slug") as string;
        const fileType = formData.get("fileType") as string | null; // "pdf" or "image"

        if (!file || file.size === 0) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        const isPdf = fileType === "pdf" || file.type === "application/pdf";
        if (isPdf && file.type !== "application/pdf") {
            return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
        }

        // 20MB limit for PDFs, 5MB for images
        const maxSize = isPdf ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: `File too large (max ${isPdf ? "20" : "5"}MB)` }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split(".").pop() || (isPdf ? "pdf" : "jpg");
        const filename = `${slug || "file"}-${Date.now()}.${ext}`;
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
