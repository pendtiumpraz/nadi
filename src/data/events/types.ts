// ══════════════════════════════════════════
// Event Type Definition
// ══════════════════════════════════════════

// Lifecycle status (separate from publish workflow)
export type EventLifecycleStatus = "upcoming" | "ongoing" | "completed";

// Publish workflow status (mirrors Article workflow but no consent step)
export type EventPublishStatus = "draft" | "in_review" | "published";

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
    status: EventLifecycleStatus;
    speakers?: string[];
    organizer: string;
    createdAt: string;
    publishStatus?: EventPublishStatus;
    authorId?: string;
    feedbackPending?: boolean;
}
