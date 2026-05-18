import { getDB } from "@/lib/db";
import type { UserRole } from "@/lib/users";

// All admin menu keys, in display order. Adding a new admin page? Add its key here.
export const MENU_ITEMS: { key: string; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "articles", label: "Articles" },
    { key: "events", label: "Events" },
    { key: "media", label: "Media" },
    { key: "review", label: "Review Queue" },
    { key: "topics", label: "Topics" },
    { key: "consents", label: "Consents" },
    { key: "team", label: "Team" },
    { key: "newsletter", label: "Newsletter" },
    { key: "ai", label: "AI Writer" },
    { key: "docs", label: "Docs" },
    { key: "guidelines", label: "Guidelines" },
    { key: "settings", label: "Settings" },
    { key: "users", label: "Users" },
    { key: "permissions", label: "Permissions" },
    { key: "audit", label: "Audit Log" },
];

export const ROLES: UserRole[] = ["admin", "reviewer", "contributor", "partner"];

export type RoleMenuMatrix = Record<UserRole, string[]>;

// Defaults — admin always sees everything; other roles see a sensible subset.
// `guidelines` is the admin-side uploader. Contributors/partners/reviewers
// reach the public guideline via the inline links on the article editor and
// the publications page — they don't need an admin upload entry.
export const DEFAULT_MATRIX: RoleMenuMatrix = {
    admin: MENU_ITEMS.map((m) => m.key),
    reviewer: ["dashboard", "articles", "events", "media", "review", "topics", "consents", "docs"],
    contributor: ["dashboard", "articles", "events", "media", "topics", "ai", "docs"],
    partner: ["dashboard", "articles", "events", "docs"],
};

const SETTINGS_KEY = "role_menu_matrix";

// Keys that should be auto-granted to every role on load — used to backfill
// existing saved matrices when a new menu key is introduced (so admins don't
// have to re-open /admin/permissions and tick boxes manually).
const ALWAYS_BACKFILL_KEYS: string[] = [];

export async function getMatrix(): Promise<RoleMenuMatrix> {
    try {
        const sql = getDB();
        const rows = await sql`SELECT value FROM site_settings WHERE key = ${SETTINGS_KEY}`;
        if (rows.length === 0) return DEFAULT_MATRIX;
        const parsed = JSON.parse(rows[0].value as string) as RoleMenuMatrix;
        // Ensure admin always has full access (defensive: never lock yourself out)
        const withAdmin: RoleMenuMatrix = { ...parsed, admin: MENU_ITEMS.map((m) => m.key) };
        // Backfill universally-granted keys for older saved matrices.
        for (const role of ROLES) {
            const list = withAdmin[role] || [];
            for (const key of ALWAYS_BACKFILL_KEYS) {
                if (!list.includes(key)) list.push(key);
            }
            withAdmin[role] = list;
        }
        return withAdmin;
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
