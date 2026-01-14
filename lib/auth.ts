// lib/auth.ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { customSession, jwt } from "better-auth/plugins";

export type Role = "user" | "manager" | "admin";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const secret = process.env.BETTER_AUTH_SECRET;

if (!secret) {
  throw new Error("Missing BETTER_AUTH_SECRET");
}
if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}

// ✅ Single Postgres pool (safe for Vercel)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const auth = betterAuth({
  baseURL,
  secret,

  // 🔥 THIS IS THE KEY FIX
  database: pool,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

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
      const role = (user as unknown as { role?: Role }).role ?? "user";

      return {
        user: {
          ...user,
          role,
        },
        session,
      };
    }),
    jwt(),
  ],
});

export type Session = typeof auth.$Infer.Session;
