import type { UserRole } from "@/lib/users";

export type ContentStatus = "draft" | "in_review" | "published";
export type ContentType = "article" | "media" | "event";

interface SessionLike {
    id?: string;
    role?: string;
}

export function asRole(role: string | undefined): UserRole {
    if (role === "admin" || role === "reviewer" || role === "contributor" || role === "partner") {
        return role;
    }
    return "contributor";
}

export function canPublish(user: SessionLike | null | undefined): boolean {
    const role = asRole(user?.role);
    return role === "admin" || role === "reviewer";
}

export function canReview(user: SessionLike | null | undefined): boolean {
    const role = asRole(user?.role);
    return role === "admin" || role === "reviewer";
}

export function canManageUsers(user: SessionLike | null | undefined): boolean {
    return asRole(user?.role) === "admin";
}

export function canEditAnyContent(user: SessionLike | null | undefined): boolean {
    return canPublish(user);
}

export function canEditOwnContent(
    user: SessionLike | null | undefined,
    authorId: string | number | null | undefined
): boolean {
    if (!user?.id) return false;
    if (canEditAnyContent(user)) return true;
    if (authorId == null) return false;
    return String(authorId) === String(user.id);
}

// What status should a save default to, given who is saving?
export function defaultSaveStatus(user: SessionLike | null | undefined): ContentStatus {
    return canPublish(user) ? "published" : "in_review";
}

// Roles allowed to even attempt creating content of a given type
export function canCreateContent(user: SessionLike | null | undefined, type: ContentType): boolean {
    const role = asRole(user?.role);
    if (role === "admin" || role === "reviewer" || role === "contributor") return true;
    // partners may submit events only
    if (role === "partner" && type === "event") return true;
    return false;
}
