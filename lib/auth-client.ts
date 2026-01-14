// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

function getClientBaseURL() {
  const envUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  if (envUrl && envUrl.trim()) return envUrl.replace(/\/$/, "");

  // On Vercel, NEXT_PUBLIC_VERCEL_URL is available client-side
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) return `https://${vercelUrl.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export const authClient = createAuthClient({
  baseURL: getClientBaseURL(),
  plugins: [inferAdditionalFields<typeof auth>()],
});
