// lib/auth.ts
import { betterAuth } from "better-auth";
import { customSession, jwt } from "better-auth/plugins";
import { Pool } from "pg";

export type Role = "user" | "manager" | "admin";

/**
 * Build the canonical app URL in a Vercel-safe way.
 * - On Vercel: VERCEL_URL is like "my-app.vercel.app" (no protocol)
 * - Locally: fallback to http://localhost:3000
 */
function getAppBaseURL() {
  // If you set BETTER_AUTH_URL explicitly (recommended for your production custom domain),
  // it will override VERCEL_URL.
  const envUrl = process.env.BETTER_AUTH_URL;

  if (envUrl && envUrl.trim()) return envUrl.replace(/\/$/, "");

  // Vercel preview/prod deployments
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) return `https://${vercelUrl.replace(/\/$/, "")}`;

  // Local dev
  return "http://localhost:3000";
}

const baseURL = getAppBaseURL();
const secret = process.env.BETTER_AUTH_SECRET;

if (!secret) throw new Error("Missing BETTER_AUTH_SECRET");
if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

export const auth = betterAuth({
  baseURL,
  secret,

  // ✅ Postgres Pool
  database: pool,

  /**
   * ✅ This fixes your Vercel issue:
   * Better Auth rejects requests when Origin doesn't match.
   * We trust:
   * - localhost for dev
   * - the computed baseURL (current deployment)
   * - any Vercel preview deployment under *.vercel.app
   *
   * Wildcards are supported by Better Auth. :contentReference[oaicite:0]{index=0}
   */
  trustedOrigins: [
    "http://localhost:3000",
    baseURL,
    "https://*.vercel.app",
  ],

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
        input: false, // cannot be client-controlled
      },
    },
  },

  plugins: [
    customSession(async ({ user, session }) => {
      const role = (user as unknown as { role?: Role }).role ?? "user";
      return { user: { ...user, role }, session };
    }),
    jwt(),
  ],
});

export type Session = typeof auth.$Infer.Session;
