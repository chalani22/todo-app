// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

// Client-side Better Auth helper (React)
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
  // Pulls additionalFields (e.g., user.role) into the client types
  plugins: [inferAdditionalFields<typeof auth>()],
});
