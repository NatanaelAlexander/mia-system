import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardCard } from "./dashboard-card";

interface DashboardStatCardProps {
  label: string;
  value: number | string;
  helper: string;
  icon: LucideIcon;
  className?: string;
}

export function DashboardStatCard({
  label,
  value,
  helper,
  icon: Icon,
  className,
}: DashboardStatCardProps) {
  return (
    <DashboardCard className={cn("h-full", className)}>
      <div className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/15">
            <Icon className="size-5" />
          </div>
          <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
            {value}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
      </div>
    </DashboardCard>
  );
}
