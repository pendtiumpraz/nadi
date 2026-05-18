import { getDB } from "@/lib/db";
import type { UserRole } from "@/lib/users";
import { PERMISSION_MATRIX_ROLES } from "@/lib/role-config";

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
    { key: "policy-types", label: "Policy Types" },
    { key: "settings", label: "Settings" },
    { key: "users", label: "Users" },
    { key: "permissions", label: "Permissions" },
    { key: "audit", label: "Audit Log" },
];

// Roles surfaced as columns in /admin/permissions. Driven by role-config so
// hiding a role (e.g. 'partner') in one place removes its matrix column too.
export const ROLES: UserRole[] = PERMISSION_MATRIX_ROLES;

export type RoleMenuMatrix = Record<UserRole, string[]>;

// Defaults — admin always sees everything; other roles see a sensible subset.
// `docs`, `topics`, `ai`, and `guidelines` are admin-internal surfaces:
// contributors only need the action pages (articles, events, media) plus the
// dashboard. Reviewers also get the review queue and editorial extras
// (topics, consents, docs). The 'partner' default is kept so existing partner
// rows still load with a sane sidebar — the role itself is hidden from the
// register form and the user-management role picker.
export const DEFAULT_MATRIX: RoleMenuMatrix = {
    admin: MENU_ITEMS.map((m) => m.key),
    reviewer: ["dashboard", "articles", "events", "media", "review", "topics", "consents", "docs"],
    contributor: ["dashboard", "articles", "events", "media"],
    partner: ["dashboard", "articles", "events"],
};

const SETTINGS_KEY = "role_menu_matrix";

// Keys that should be auto-granted to every role on load — used to backfill
// existing saved matrices when a new menu key is introduced (so admins don't
// have to re-open /admin/permissions and tick boxes manually).
const ALWAYS_BACKFILL_KEYS: string[] = [];

// Keys that contributors and partners must NEVER see, regardless of what was
// saved in /admin/permissions previously. They're admin-internal surfaces
// (AI Writer, Topics, Docs, Guidelines, Newsletter, Team, Settings, Users,
// Permissions, Audit) — surfacing them to authors is just clutter and risk.
// Reviewer is intentionally exempt: they still need topics, docs, etc.
const STRIPPED_FOR_AUTHORS: string[] = ["topics", "ai", "docs", "guidelines", "policy-types", "newsletter", "team", "settings", "users", "permissions", "audit", "review", "consents"];

export async function getMatrix(): Promise<RoleMenuMatrix> {
    try {
        const sql = getDB();
        const rows = await sql`SELECT value FROM site_settings WHERE key = ${SETTINGS_KEY}`;
        if (rows.length === 0) return DEFAULT_MATRIX;
        const parsed = JSON.parse(rows[0].value as string) as RoleMenuMatrix;
        // Ensure admin always has full access (defensive: never lock yourself out)
        const withAdmin: RoleMenuMatrix = { ...parsed, admin: MENU_ITEMS.map((m) => m.key) };
        for (const role of ROLES) {
            const list = withAdmin[role] || [];
            // Backfill universally-granted keys for older saved matrices.
            for (const key of ALWAYS_BACKFILL_KEYS) {
                if (!list.includes(key)) list.push(key);
            }
            // Hard-strip admin-only surfaces from contributor + partner even if
            // a prior saved matrix granted them. Admin / reviewer untouched.
            if (role === "contributor" || role === "partner") {
                withAdmin[role] = list.filter((k) => !STRIPPED_FOR_AUTHORS.includes(k));
            } else {
                withAdmin[role] = list;
            }
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
