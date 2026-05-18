import type { UserRole } from "@/lib/users";

/**
 * Single source of truth for which roles are surfaced in which parts of the
 * UI. The full UserRole union stays intact in lib/users.ts so existing rows
 * (e.g. partners created earlier) keep loading correctly; this file just
 * filters what's *offered* to humans when they pick a role.
 *
 * To re-introduce a hidden role (or add a brand-new one), drop it into the
 * relevant array below — no other code changes needed.
 */

/** Roles that visitors can pick on the public /register form. */
export const PUBLIC_REGISTRATION_ROLES: UserRole[] = ["contributor"];

/** Roles an admin can assign when adding or editing a user in /admin/users. */
export const ADMIN_ASSIGNABLE_ROLES: UserRole[] = ["admin", "reviewer", "contributor"];

/** Roles whose columns are surfaced in /admin/permissions matrix. Admin row
 *  is locked so they always retain full access; the matrix UI walks this
 *  list to render the other role columns. */
export const PERMISSION_MATRIX_ROLES: UserRole[] = ["admin", "reviewer", "contributor"];

/** Roles that participate in the public-facing article authoring flow
 *  (contributor sees "My Submissions" etc). Future roles can be added here. */
export const AUTHORING_ROLES: UserRole[] = ["contributor"];
