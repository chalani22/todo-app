// hooks/useSession.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

type Role = "user" | "manager" | "admin";

type Session =
  | {
      user: {
        id: string;
        email: string;
        name: string | null;
        role: Role;
      };
      session: { id: string };
    }
  | null;

async function getSession(): Promise<Session> {
  try {
    // Better Auth client fetches the correct session endpoint + cookies
    const res = await authClient.getSession();
    // res shape can be { data } depending on version; normalize safely:
    const data = (res as any)?.data ?? res;
    return (data ?? null) as Session;
  } catch {
    return null;
  }
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    staleTime: 30_000,
  });
}
