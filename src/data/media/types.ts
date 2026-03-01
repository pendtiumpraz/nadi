// ══════════════════════════════════════════
// Media Type Definition
// ══════════════════════════════════════════

export type MediaType = "video" | "podcast" | "webinar" | "interview" | "panel";

export interface NADIMedia {
    slug: string;
    title: string;
    description: string;
    type: MediaType;
    embedUrl: string;      // YouTube/Spotify/etc embed URL
    thumbnailUrl?: string;  // Optional custom thumbnail
    date: string;           // YYYY-MM-DD
    duration?: string;      // e.g. "45 min"
    speakers?: string[];
    category: string;       // e.g. "Health Policy", "UHC", etc.
    createdAt: string;
}
