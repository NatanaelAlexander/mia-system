import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "./dashboard-card";

export function DashboardSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-7 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <DashboardCard key={index}>
            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between">
                <Skeleton className="size-10 rounded-lg" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </DashboardCard>
        ))}
      </div>

      <DashboardCard>
        <div className="space-y-4 p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </DashboardCard>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <DashboardCard key={index}>
            <div className="space-y-4 p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mx-auto size-44 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          </DashboardCard>
        ))}
      </div>

      <DashboardCard>
        <div className="space-y-4 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-48 rounded-lg" />
          </div>
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
      </DashboardCard>
    </div>
  );
}
