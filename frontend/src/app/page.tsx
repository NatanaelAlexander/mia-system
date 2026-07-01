import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";

export default async function Home() {
  const cookieStore = await cookies();

  if (cookieStore.has(ACCESS_TOKEN_COOKIE)) {
    redirect("/app");
  }

  redirect("/login");
}
