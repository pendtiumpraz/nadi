import { put, list, del } from "@vercel/blob";
import fs from "fs";
import path from "path";
import type { NADIMedia } from "@/data/media/types";

const IS_VERCEL = !!process.env.VERCEL;
const LOCAL_DIR = path.join(process.cwd(), "src/data/media");

function ensureDir() {
    if (!IS_VERCEL && !fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

export async function getAllMedia(): Promise<NADIMedia[]> {
    if (IS_VERCEL) {
        try {
            const { blobs } = await list({ prefix: "media/" });
            const items: NADIMedia[] = [];
            for (const blob of blobs) {
                if (!blob.pathname.endsWith(".json")) continue;
                try {
                    const res = await fetch(blob.url, { cache: "no-store" });
                    items.push(await res.json());
                } catch { /* skip */ }
            }
            return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } catch { return []; }
    }
    ensureDir();
    try {
        const files = fs.readdirSync(LOCAL_DIR).filter((f) => f.endsWith(".json"));
        return files.map((f) => JSON.parse(fs.readFileSync(path.join(LOCAL_DIR, f), "utf-8")) as NADIMedia)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch { return []; }
}

export async function getMediaBySlug(slug: string): Promise<NADIMedia | null> {
    const all = await getAllMedia();
    return all.find((m) => m.slug === slug) || null;
}

export async function saveMedia(media: NADIMedia): Promise<void> {
    if (IS_VERCEL) {
        await put(`media/${media.slug}.json`, JSON.stringify(media, null, 2), {
            access: "public", contentType: "application/json", addRandomSuffix: false,
        });
    } else {
        ensureDir();
        fs.writeFileSync(path.join(LOCAL_DIR, `${media.slug}.json`), JSON.stringify(media, null, 2), "utf-8");
    }
}

export async function deleteMedia(slug: string): Promise<void> {
    if (IS_VERCEL) {
        const { blobs } = await list({ prefix: `media/${slug}.json` });
        for (const blob of blobs) await del(blob.url);
    } else {
        const p = path.join(LOCAL_DIR, `${slug}.json`);
        if (fs.existsSync(p)) fs.unlinkSync(p);
    }
}

export async function mediaExists(slug: string): Promise<boolean> {
    if (IS_VERCEL) {
        const all = await getAllMedia();
        return all.some((m) => m.slug === slug);
    }
    return fs.existsSync(path.join(LOCAL_DIR, `${slug}.json`));
}
