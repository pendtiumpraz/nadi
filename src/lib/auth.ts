import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserByEmail, verifyPassword } from "@/lib/users";
import authConfig from "@/lib/auth.config";

declare module "next-auth" {
    interface User {
        role?: string;
        status?: string;
    }
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            status: string;
        };
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        role?: string;
        status?: string;
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email as string | undefined;
                const password = credentials?.password as string | undefined;
                if (!email || !password) return null;

                const user = await getUserByEmail(email);
                if (!user) return null;

                const valid = await verifyPassword(password, user.password);
                if (!valid) return null;

                // Block accounts that are explicitly pending or suspended.
                // (Legacy rows with a missing/empty status are normalized to "active" in users.ts.)
                if (user.status === "pending") {
                    throw new Error("PENDING_APPROVAL");
                }
                if (user.status === "suspended") {
                    throw new Error("ACCOUNT_SUSPENDED");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    status: user.status,
                };
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.status = user.status;
                token.sub = user.id;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub as string;
                session.user.role = (token.role as string) || "contributor";
                session.user.status = (token.status as string) || "active";
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
});
