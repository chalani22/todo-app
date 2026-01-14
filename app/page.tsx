import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function Home() {
  const h = await headers();
  const session = await auth.api.getSession({
    headers: {
      cookie: h.get("cookie") ?? "",
    },
  });

  redirect(session ? "/todos" : "/sign-in");
}
