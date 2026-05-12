import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { getTopicById } from "@/lib/topics-store";
import { asRole } from "@/lib/permissions";

interface Params {
    params: Promise<{ id: string }>;
}

interface MessageRow {
    id: number | string;
    topic_id: number | string;
    author_id: number | string | null;
    author_role: string | null;
    body: string;
    created_at: string | Date;
    name: string | null;
}

interface MessageDTO {
    id: string;
    body: string;
    authorId: string | null;
    authorRole: string | null;
    authorName: string | null;
    createdAt: string;
}

function rowToDTO(row: MessageRow): MessageDTO {
    return {
        id: String(row.id),
        body: row.body,
        authorId: row.author_id != null ? String(row.author_id) : null,
        authorRole: row.author_role,
        authorName: row.name,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    };
}

// GET /api/topics/[id]/messages
// Returns the discussion thread (oldest first) for the topic.
// Allowed: any authenticated, non-partner user.
export async function GET(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (asRole(session.user.role) === "partner") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const topicId = Number(id);
    if (!Number.isFinite(topicId) || topicId <= 0) {
        return NextResponse.json({ error: "Invalid topic id" }, { status: 400 });
    }

    const topic = await getTopicById(topicId);
    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    const sql = getDB();
    const rows = (await sql`
        SELECT m.*, u.name
        FROM topic_messages m
        LEFT JOIN users u ON u.id = m.author_id
        WHERE m.topic_id = ${topicId}
        ORDER BY m.created_at ASC
    `) as unknown as MessageRow[];

    return NextResponse.json({ messages: rows.map(rowToDTO) });
}

// POST /api/topics/[id]/messages
// Adds a new discussion message to the topic thread.
// Allowed: admin / reviewer / contributor (anyone except partner).
//
// TODO: when @mention parsing lands, scan `trimmed` here for @username tokens
// and fire a notify-by-email side effect (mirror notifyFeedbackReceived in
// the comments POST handler). v1 keeps this plain text.
export async function POST(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (asRole(session.user.role) === "partner") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const topicId = Number(id);
    if (!Number.isFinite(topicId) || topicId <= 0) {
        return NextResponse.json({ error: "Invalid topic id" }, { status: 400 });
    }

    const topic = await getTopicById(topicId);
    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    const payload = await req.json().catch(() => ({}));
    const rawBody = typeof payload.body === "string" ? payload.body : "";
    const trimmed = rawBody.trim();
    if (!trimmed) {
        return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }

    const authorId = session.user.id ? Number(session.user.id) : null;
    if (authorId == null || !Number.isFinite(authorId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const authorRole = session.user.role || "contributor";

    const sql = getDB();
    const inserted = (await sql`
        INSERT INTO topic_messages (topic_id, author_id, author_role, body)
        VALUES (${topicId}, ${authorId}, ${authorRole}, ${trimmed})
        RETURNING id, topic_id, author_id, author_role, body, created_at
    `) as unknown as MessageRow[];

    const row = inserted[0];
    // Attach the poster's name without an extra DB round-trip.
    row.name = session.user.name || null;

    return NextResponse.json({ message: rowToDTO(row) }, { status: 201 });
}
