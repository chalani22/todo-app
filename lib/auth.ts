// lib/auth.ts
import { betterAuth } from "better-auth";
import { customSession, jwt } from "better-auth/plugins";
import { Pool } from "pg";

export type Role = "user" | "manager" | "admin";

function getAppBaseURL() {
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
  database: pool,
  
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
        input: false, 
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
