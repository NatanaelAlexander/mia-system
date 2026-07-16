import * as React from "react";
import { cn } from "@/lib/utils";

export function DashboardCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dashboard-card"
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-gradient-to-t from-primary/[0.03] to-card text-card-foreground shadow-xs",
        "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-md",
        className,
      )}
      {...props}
    />
  );
}
