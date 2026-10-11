import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      async authorize(credentials) {
        if (
          typeof credentials.username !== "string" ||
          typeof credentials.password !== "string"
        )
          return null;
        if (
          credentials.username.length > 100 ||
          new TextEncoder().encode(credentials.password).length > 72
        )
          return null;
        const [user] = await getDb()
          .select()
          .from(users)
          .where(eq(users.username, credentials.username.trim()));
        if (!user || !(await compare(credentials.password, user.passwordHash)))
          return null;
        return { id: String(user.id), name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
