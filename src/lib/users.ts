import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

export interface User {
    id: string;
    email: string;
    name: string;
    password: string;
    role: "admin" | "user";
}

const USERS_FILE = path.join(process.cwd(), "src/data/users.json");

function readUsers(): User[] {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
}

function writeUsers(users: User[]): void {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export function getAllUsers(): Omit<User, "password">[] {
    return readUsers().map(({ password: _, ...rest }) => rest);
}

export function getUserByEmail(email: string): User | undefined {
    return readUsers().find((u) => u.email === email);
}

export function getUserById(id: string): User | undefined {
    return readUsers().find((u) => u.id === id);
}

export async function verifyPassword(
    plain: string,
    hashed: string
): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
}

export async function addUser(
    email: string,
    name: string,
    password: string,
    role: "admin" | "user"
): Promise<Omit<User, "password">> {
    const users = readUsers();
    if (users.find((u) => u.email === email)) {
        throw new Error("User with this email already exists");
    }
    const hashed = await bcrypt.hash(password, 10);
    const newUser: User = {
        id: String(Date.now()),
        email,
        name,
        password: hashed,
        role,
    };
    users.push(newUser);
    writeUsers(users);
    const { password: _, ...safe } = newUser;
    return safe;
}

export async function changePassword(
    id: string,
    newPassword: string
): Promise<void> {
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("User not found");
    users[idx].password = await bcrypt.hash(newPassword, 10);
    writeUsers(users);
}

export function deleteUser(id: string): void {
    const users = readUsers();
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length === users.length) throw new Error("User not found");
    writeUsers(filtered);
}

export function updateUserRole(id: string, role: "admin" | "user"): void {
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("User not found");
    users[idx].role = role;
    writeUsers(users);
}
