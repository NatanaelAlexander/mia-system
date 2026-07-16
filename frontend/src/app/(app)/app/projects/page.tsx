import { redirect } from "next/navigation";

/** La lista global de proyectos quedó deprecada; se navega desde cada empresa. */
export default function LegacyProjectsPage() {
  redirect("/app/companies");
}
