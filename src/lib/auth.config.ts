import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no Node.js APIs like fs/path)
// Used by middleware only
export default {
    providers: [], // providers defined in full auth.ts
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request }) {
            const isAdmin = request.nextUrl.pathname.startsWith("/admin");
            if (isAdmin && !auth?.user) return false;
            return true;
        },
    },
} satisfies NextAuthConfig;
