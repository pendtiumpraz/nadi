import { NextRequest, NextResponse } from "next/server";
import { getAllTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from "@/lib/team-store";

export async function GET() {
    try {
        const members = await getAllTeamMembers();
        return NextResponse.json({ members });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const member = await createTeamMember(body);
        return NextResponse.json({ member });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...data } = body;
        const member = await updateTeamMember(id, data);
        return NextResponse.json({ member });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = Number(searchParams.get("id"));
        await deleteTeamMember(id);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
