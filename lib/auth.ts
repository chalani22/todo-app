// lib/auth.ts
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { customSession, jwt } from "better-auth/plugins";

export type Role = "user" | "manager" | "admin";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const secret = process.env.BETTER_AUTH_SECRET;

if (!secret) {
  throw new Error("Missing BETTER_AUTH_SECRET in .env.local");
}

export const auth = betterAuth({
  baseURL,
  secret,

  // SQLite db file in project root
  database: new Database("./sqlite.db"),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // User.role is stored in the auth user record
  // input:false prevents setting the role during signup
  user: {
    additionalFields: {
      role: {
        type: ["user", "manager", "admin"],
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },

  plugins: [
    customSession(async ({ user, session }) => {
      // Ensure role is always present on the returned session.user
      const role = (user as unknown as { role?: Role }).role ?? "user";

      return {
        user: {
          ...user,
          role,
        },
        session,
      };
    }),

    // Enables JWT support in Better Auth
    jwt(),
  ],
});

export type Session = typeof auth.$Infer.Session;
