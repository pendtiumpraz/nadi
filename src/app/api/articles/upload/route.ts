import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

// POST — upload article cover image
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    try {
        const formData = await req.formData();
        const file = formData.get("image") as File | null;
        const slug = formData.get("slug") as string;

        if (!file || file.size === 0) {
            return NextResponse.json({ error: "No image file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${slug || "cover"}-${Date.now()}.${file.name.split(".").pop()}`;

        let url: string;
        if (process.env.VERCEL) {
            const blob = await put(`articles/covers/${filename}`, buffer, {
                access: "public",
                addRandomSuffix: false,
            });
            url = blob.url;
        } else {
            const dir = path.join(process.cwd(), "public/uploads/articles");
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, filename), buffer);
            url = `/uploads/articles/${filename}`;
        }

        return NextResponse.json({ url });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
