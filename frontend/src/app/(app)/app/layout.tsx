import { DashboardShell } from "@/components/app/dashboard-shell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
