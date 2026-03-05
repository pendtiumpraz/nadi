import { getDB } from "@/lib/db";

export interface TeamMember {
    id: number;
    name: string;
    title: string;
    bio: string;
    initials: string;
    photoUrl: string;
    linkedinUrl: string;
    orderNum: number;
    isFeatured: boolean;
    createdAt: string;
    updatedAt: string;
}

function rowToMember(row: Record<string, unknown>): TeamMember {
    return {
        id: row.id as number,
        name: row.name as string,
        title: (row.title as string) || "",
        bio: (row.bio as string) || "",
        initials: (row.initials as string) || "",
        photoUrl: (row.photo_url as string) || "",
        linkedinUrl: (row.linkedin_url as string) || "",
        orderNum: (row.order_num as number) || 0,
        isFeatured: (row.is_featured as boolean) || false,
        createdAt: row.created_at ? new Date(row.created_at as string).toISOString() : "",
        updatedAt: row.updated_at ? new Date(row.updated_at as string).toISOString() : "",
    };
}

export async function getAllTeamMembers(): Promise<TeamMember[]> {
    const sql = getDB();
    const rows = await sql`SELECT * FROM team_members ORDER BY order_num ASC, id ASC`;
    return rows.map(rowToMember);
}

export async function getTeamMemberById(id: number): Promise<TeamMember | null> {
    const sql = getDB();
    const rows = await sql`SELECT * FROM team_members WHERE id = ${id}`;
    return rows.length > 0 ? rowToMember(rows[0]) : null;
}

export async function createTeamMember(data: Partial<TeamMember>): Promise<TeamMember> {
    const sql = getDB();
    const rows = await sql`
    INSERT INTO team_members (name, title, bio, initials, photo_url, linkedin_url, order_num, is_featured)
    VALUES (${data.name || ""}, ${data.title || ""}, ${data.bio || ""}, ${data.initials || ""}, ${data.photoUrl || ""}, ${data.linkedinUrl || ""}, ${data.orderNum || 0}, ${data.isFeatured || false})
    RETURNING *`;
    return rowToMember(rows[0]);
}

export async function updateTeamMember(id: number, data: Partial<TeamMember>): Promise<TeamMember> {
    const sql = getDB();
    const rows = await sql`
    UPDATE team_members SET
      name = ${data.name || ""},
      title = ${data.title || ""},
      bio = ${data.bio || ""},
      initials = ${data.initials || ""},
      photo_url = ${data.photoUrl || ""},
      linkedin_url = ${data.linkedinUrl || ""},
      order_num = ${data.orderNum || 0},
      is_featured = ${data.isFeatured || false},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *`;
    return rowToMember(rows[0]);
}

export async function deleteTeamMember(id: number): Promise<void> {
    const sql = getDB();
    await sql`DELETE FROM team_members WHERE id = ${id}`;
}
