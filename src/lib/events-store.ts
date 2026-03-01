import { put, list, del } from "@vercel/blob";
import fs from "fs";
import path from "path";
import type { NADIEvent } from "@/data/events/types";

const IS_VERCEL = !!process.env.VERCEL;
const LOCAL_DIR = path.join(process.cwd(), "src/data/events");

function ensureDir() {
    if (!IS_VERCEL && !fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

export async function getAllEvents(): Promise<NADIEvent[]> {
    if (IS_VERCEL) {
        try {
            const { blobs } = await list({ prefix: "events/" });
            const events: NADIEvent[] = [];
            for (const blob of blobs) {
                if (!blob.pathname.endsWith(".json")) continue;
                try {
                    const res = await fetch(blob.url, { cache: "no-store" });
                    events.push(await res.json());
                } catch { /* skip */ }
            }
            return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } catch { return []; }
    }
    ensureDir();
    try {
        const files = fs.readdirSync(LOCAL_DIR).filter((f) => f.endsWith(".json"));
        return files.map((f) => JSON.parse(fs.readFileSync(path.join(LOCAL_DIR, f), "utf-8")) as NADIEvent)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch { return []; }
}

export async function getEventBySlug(slug: string): Promise<NADIEvent | null> {
    const events = await getAllEvents();
    return events.find((e) => e.slug === slug) || null;
}

export async function saveEvent(event: NADIEvent): Promise<void> {
    if (IS_VERCEL) {
        await put(`events/${event.slug}.json`, JSON.stringify(event, null, 2), {
            access: "public", contentType: "application/json", addRandomSuffix: false,
        });
    } else {
        ensureDir();
        fs.writeFileSync(path.join(LOCAL_DIR, `${event.slug}.json`), JSON.stringify(event, null, 2), "utf-8");
    }
}

export async function deleteEvent(slug: string): Promise<void> {
    if (IS_VERCEL) {
        const { blobs } = await list({ prefix: `events/${slug}.json` });
        for (const blob of blobs) await del(blob.url);
    } else {
        const p = path.join(LOCAL_DIR, `${slug}.json`);
        if (fs.existsSync(p)) fs.unlinkSync(p);
    }
}

export async function eventExists(slug: string): Promise<boolean> {
    if (IS_VERCEL) {
        const events = await getAllEvents();
        return events.some((e) => e.slug === slug);
    }
    return fs.existsSync(path.join(LOCAL_DIR, `${slug}.json`));
}

// Upload event image to blob
export async function uploadEventImage(slug: string, file: Buffer, filename: string): Promise<string> {
    if (IS_VERCEL) {
        const blob = await put(`events/images/${slug}-${filename}`, file, {
            access: "public", addRandomSuffix: false,
        });
        return blob.url;
    }
    // Local: save to public dir
    const publicDir = path.join(process.cwd(), "public/uploads/events");
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    const localPath = path.join(publicDir, `${slug}-${filename}`);
    fs.writeFileSync(localPath, file);
    return `/uploads/events/${slug}-${filename}`;
}
