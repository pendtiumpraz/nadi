import bcrypt from "bcryptjs";
import { getDB } from "@/lib/db";

export interface User {
    id: string;
    email: string;
    name: string;
    password: string;
    role: "admin" | "user";
}

export async function getAllUsers(): Promise<Omit<User, "password">[]> {
    const sql = getDB();
    const rows = await sql`SELECT id, email, name, role FROM users ORDER BY id`;
    return rows.map((r) => ({
        id: String(r.id),
        email: r.email as string,
        name: r.name as string,
        role: r.role as "admin" | "user",
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
    role: "admin" | "user"
): Promise<Omit<User, "password">> {
    const sql = getDB();
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) throw new Error("User with this email already exists");

    const hashed = await bcrypt.hash(password, 10);
    const result = await sql`INSERT INTO users (email, name, password, role) VALUES (${email}, ${name}, ${hashed}, ${role}) RETURNING id, email, name, role`;
    return {
        id: String(result[0].id),
        email: result[0].email as string,
        name: result[0].name as string,
        role: result[0].role as "admin" | "user",
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

export async function updateUserRole(id: string, role: "admin" | "user"): Promise<void> {
    const sql = getDB();
    await sql`UPDATE users SET role = ${role} WHERE id = ${Number(id)}`;
}

function rowToUser(row: Record<string, unknown>): User {
    return {
        id: String(row.id),
        email: row.email as string,
        name: row.name as string,
        password: row.password as string,
        role: row.role as "admin" | "user",
    };
}
