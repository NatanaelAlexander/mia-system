"use client";

import { useAuth } from "@/hooks/use-auth";
import { DashboardHome } from "./dashboard-home";
import { DashboardSkeleton } from "./dashboard-skeleton";

export function DashboardHomeClient() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <DashboardHome
      userName={session?.user.firstName}
      surfaces={session?.user.surfaces ?? []}
    />
  );
}
