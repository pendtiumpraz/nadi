import bcrypt from "bcryptjs";
import { getDB } from "@/lib/db";

export type UserRole = "admin" | "reviewer" | "contributor" | "partner";
export type UserStatus = "pending" | "active" | "suspended";

export interface User {
    id: string;
    email: string;
    name: string;
    password: string;
    role: UserRole;
    status: UserStatus;
}

export type PublicUser = Omit<User, "password">;

const VALID_ROLES: UserRole[] = ["admin", "reviewer", "contributor", "partner"];
const VALID_STATUSES: UserStatus[] = ["pending", "active", "suspended"];

function normalizeRole(value: unknown): UserRole {
    return VALID_ROLES.includes(value as UserRole) ? (value as UserRole) : "contributor";
}

function normalizeStatus(value: unknown): UserStatus {
    if (VALID_STATUSES.includes(value as UserStatus)) return value as UserStatus;
    // Legacy / pre-migration rows where status column is missing or empty
    // are treated as active so existing admins are never locked out.
    if (value == null || value === "") return "active";
    return "pending";
}

export async function getAllUsers(): Promise<PublicUser[]> {
    const sql = getDB();
    const rows = await sql`SELECT id, email, name, role, status FROM users ORDER BY id`;
    return rows.map((r) => ({
        id: String(r.id),
        email: r.email as string,
        name: r.name as string,
        role: normalizeRole(r.role),
        status: normalizeStatus(r.status),
    }));
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
    const sql = getDB();
    const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    if (rows.length === 0) return undefined;
    return rowToUser(rows[0]);
}

export async function getUserById(id: string): Promise<User | undefined> {
    const sql = getDB();
    const rows = await sql`SELECT * FROM users WHERE id = ${Number(id)} LIMIT 1`;
    if (rows.length === 0) return undefined;
    return rowToUser(rows[0]);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
}

export async function addUser(
    email: string,
    name: string,
    password: string,
    role: UserRole = "contributor",
    status: UserStatus = "active"
): Promise<PublicUser> {
    const sql = getDB();
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) throw new Error("User with this email already exists");

    const hashed = await bcrypt.hash(password, 10);
    const result = await sql`
        INSERT INTO users (email, name, password, role, status)
        VALUES (${email}, ${name}, ${hashed}, ${role}, ${status})
        RETURNING id, email, name, role, status
    `;
    return {
        id: String(result[0].id),
        email: result[0].email as string,
        name: result[0].name as string,
        role: normalizeRole(result[0].role),
        status: normalizeStatus(result[0].status),
    };
}

export async function changePassword(id: string, newPassword: string): Promise<void> {
    const sql = getDB();
    const hashed = await bcrypt.hash(newPassword, 10);
    const result = await sql`UPDATE users SET password = ${hashed} WHERE id = ${Number(id)}`;
    if (result.length === 0 && (result as unknown as { count: number }).count === 0) throw new Error("User not found");
}

export async function deleteUser(id: string): Promise<void> {
    const sql = getDB();
    await sql`DELETE FROM users WHERE id = ${Number(id)}`;
}

export async function updateUserRole(id: string, role: UserRole): Promise<void> {
    const sql = getDB();
    if (!VALID_ROLES.includes(role)) throw new Error(`Invalid role: ${role}`);
    await sql`UPDATE users SET role = ${role} WHERE id = ${Number(id)}`;
}

export async function updateUserStatus(id: string, status: UserStatus): Promise<void> {
    const sql = getDB();
    if (!VALID_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);
    await sql`UPDATE users SET status = ${status} WHERE id = ${Number(id)}`;
}

export async function logUserEvent(
    actorId: string | null,
    targetUserId: string,
    action: string,
    meta: Record<string, unknown> = {}
): Promise<void> {
    const sql = getDB();
    await sql`
        INSERT INTO user_events (actor_id, target_user_id, action, meta)
        VALUES (${actorId ? Number(actorId) : null}, ${Number(targetUserId)}, ${action}, ${JSON.stringify(meta)})
    `;
}

function rowToUser(row: Record<string, unknown>): User {
    return {
        id: String(row.id),
        email: row.email as string,
        name: row.name as string,
        password: row.password as string,
        role: normalizeRole(row.role),
        status: normalizeStatus(row.status),
    };
}
