import { getDB } from "@/lib/db";
import type { UserRole } from "@/lib/users";

// All admin menu keys, in display order. Adding a new admin page? Add its key here.
export const MENU_ITEMS: { key: string; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "articles", label: "Articles" },
    { key: "events", label: "Events" },
    { key: "media", label: "Media" },
    { key: "review", label: "Review Queue" },
    { key: "team", label: "Team" },
    { key: "newsletter", label: "Newsletter" },
    { key: "ai", label: "AI Writer" },
    { key: "docs", label: "Docs" },
    { key: "settings", label: "Settings" },
    { key: "users", label: "Users" },
    { key: "permissions", label: "Permissions" },
];

export const ROLES: UserRole[] = ["admin", "reviewer", "contributor", "partner"];

export type RoleMenuMatrix = Record<UserRole, string[]>;

// Defaults — admin always sees everything; other roles see a sensible subset.
export const DEFAULT_MATRIX: RoleMenuMatrix = {
    admin: MENU_ITEMS.map((m) => m.key),
    reviewer: ["dashboard", "articles", "events", "media", "review", "docs"],
    contributor: ["dashboard", "articles", "events", "media", "ai", "docs"],
    partner: ["dashboard", "events", "docs"],
};

const SETTINGS_KEY = "role_menu_matrix";

export async function getMatrix(): Promise<RoleMenuMatrix> {
    try {
        const sql = getDB();
        const rows = await sql`SELECT value FROM site_settings WHERE key = ${SETTINGS_KEY}`;
        if (rows.length === 0) return DEFAULT_MATRIX;
        const parsed = JSON.parse(rows[0].value as string) as RoleMenuMatrix;
        // Ensure admin always has full access (defensive: never lock yourself out)
        return { ...parsed, admin: MENU_ITEMS.map((m) => m.key) };
    } catch {
        return DEFAULT_MATRIX;
    }
}

export async function setMatrix(matrix: RoleMenuMatrix): Promise<void> {
    const sql = getDB();
    // Force admin = all (keep an escape hatch)
    const safe: RoleMenuMatrix = { ...matrix, admin: MENU_ITEMS.map((m) => m.key) };
    const value = JSON.stringify(safe);
    await sql`
        INSERT INTO site_settings (key, value, updated_at)
        VALUES (${SETTINGS_KEY}, ${value}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
}

export async function getAllowedMenusForRole(role: string): Promise<string[]> {
    const matrix = await getMatrix();
    const r = (role as UserRole) in matrix ? (role as UserRole) : "contributor";
    return matrix[r];
}

export async function canAccessMenu(role: string, menuKey: string): Promise<boolean> {
    const allowed = await getAllowedMenusForRole(role);
    return allowed.includes(menuKey);
}
