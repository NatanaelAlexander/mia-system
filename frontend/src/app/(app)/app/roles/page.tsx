import { redirect } from "next/navigation";

export default function RolesRedirectPage() {
  redirect("/app/users/roles");
}
