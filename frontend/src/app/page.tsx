import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth/cookies";

export default async function Home() {
  const cookieStore = await cookies();

  if (cookieStore.has(SESSION_COOKIE)) {
    redirect("/app");
  }

  redirect("/login");
}
