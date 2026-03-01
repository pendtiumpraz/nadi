import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserByEmail, verifyPassword } from "@/lib/users";
import authConfig from "@/lib/auth.config";

declare module "next-auth" {
    interface User {
        role?: string;
    }
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        role?: string;
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

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.sub = user.id;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub as string;
                session.user.role = (token.role as string) || "user";
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
});
