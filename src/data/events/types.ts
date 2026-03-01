// ══════════════════════════════════════════
// Event Type Definition
// ══════════════════════════════════════════

export interface NADIEvent {
    slug: string;
    title: string;
    description: string;
    date: string;        // YYYY-MM-DD
    time: string;        // e.g. "09:00 - 17:00 WIB"
    location: string;    // e.g. "Jakarta Convention Center"
    locationType: "onsite" | "online" | "hybrid";
    category: "conference" | "seminar" | "workshop" | "roundtable" | "launch" | "other";
    imageUrl: string;    // Vercel Blob URL
    registrationUrl?: string;
    status: "upcoming" | "ongoing" | "completed";
    speakers?: string[];
    organizer: string;
    createdAt: string;
}
