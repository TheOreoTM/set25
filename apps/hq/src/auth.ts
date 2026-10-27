import { randomUUID } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@set25/database";
import { normalizeStaffUsername } from "@set25/shared";
import { hashPassword, verifyPassword } from "@set25/database/password";

let dummyPasswordHash: Promise<string> | undefined;

function getDummyPasswordHash() {
  dummyPasswordHash ??= hashPassword(`invalid-${randomUUID()}`);
  return dummyPasswordHash;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username =
          typeof credentials.username === "string"
            ? normalizeStaffUsername(credentials.username)
            : "";
        const password =
          typeof credentials.password === "string" ? credentials.password : "";

        if (
          username.length > 32 ||
          password.length < 1 ||
          password.length > 128
        ) {
          return null;
        }

        const staff = await db.staffUser.findUnique({
          where: { username },
          select: {
            id: true,
            name: true,
            passwordHash: true,
            active: true,
          },
        });
        const passwordMatches = await verifyPassword(
          staff?.passwordHash ?? (await getDummyPasswordHash()),
          password,
        );

        if (!staff?.active || !passwordMatches) return null;

        await db.staffUser.update({
          where: { id: staff.id },
          data: { lastLoginAt: new Date() },
        });
        return { id: staff.id, name: staff.name };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
    async authorized({ auth: session }) {
      const staffId = session?.user?.id;
      if (!staffId) return false;
      const staff = await db.staffUser.findUnique({
        where: { id: staffId },
        select: { active: true },
      });
      return staff?.active === true;
    },
  },
});
