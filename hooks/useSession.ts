// hooks/useSession.ts
"use client";

import { useQuery } from "@tanstack/react-query";

type Role = "user" | "manager" | "admin";

type Session =
  | {
      user: {
        id: string;
        email: string;
        name: string;
        role: Role;
      };
      session: { id: string };
    }
  | null;

// Reads the current Better Auth session (null if not signed in)
async function getSession(): Promise<Session> {
  const res = await fetch("/api/auth/get-session", { credentials: "include" });
  if (!res.ok) return null;
  return (await res.json()) as Session;
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    // Keeps session reasonably fresh without refetching too often
    staleTime: 30_000,
  });
}
