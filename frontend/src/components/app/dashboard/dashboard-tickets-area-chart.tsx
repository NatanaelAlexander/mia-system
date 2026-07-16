"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  getTicketTimeline,
  type TicketTimelineRange,
} from "@/components/app/api/tickets";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { DashboardCard } from "./dashboard-card";

const chartConfig = {
  total: { label: "Total", color: "var(--chart-1)" },
  open: { label: "Abiertos", color: "var(--chart-2)" },
  closed: { label: "Cerrados", color: "var(--chart-3)" },
} satisfies ChartConfig;

const RANGES: Array<{ value: TicketTimelineRange; label: string }> = [
  { value: "day", label: "Último día" },
  { value: "month", label: "Último mes" },
  { value: "year", label: "Último año" },
];

function formatXAxis(value: string, range: TicketTimelineRange): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  if (range === "day") {
    return date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  }
  if (range === "year") {
    return date.toLocaleDateString("es", { month: "short" });
  }
  return date.toLocaleDateString("es", { day: "numeric", month: "short" });
}

function formatTooltipLabel(value: string, range: TicketTimelineRange): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  if (range === "day") {
    return date.toLocaleString("es", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (range === "year") {
    return date.toLocaleDateString("es", { month: "long", year: "numeric" });
  }
  return date.toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DashboardTicketsAreaChart() {
  const [range, setRange] = React.useState<TicketTimelineRange>("month");
  const [data, setData] = React.useState<
    Array<{ date: string; total: number; open: number; closed: number }>
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getTicketTimeline(range)
      .then((rows) => {
        if (cancelled) {
          return;
        }
        setData(
          rows.map((row) => ({
            date: row.date,
            total: row.total,
            open: row.open,
            closed: row.closed,
          })),
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudo cargar el gráfico de tickets.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  const rangeLabel =
    RANGES.find((option) => option.value === range)?.label ?? "Último mes";

  return (
    <DashboardCard className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-base font-medium">Evolución de tickets</p>
          <p className="text-sm text-muted-foreground">
            Tickets creados en el periodo · {rangeLabel.toLowerCase()}
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
          {RANGES.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={range === option.value ? "default" : "ghost"}
              className="h-7 rounded-md px-3 text-xs"
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-5 pt-4">
        {isLoading ? (
          <Skeleton className="h-[220px] w-full rounded-xl sm:h-[300px]" />
        ) : error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[220px] w-full sm:h-[300px]"
          >
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-total)"
                    stopOpacity={0.55}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-total)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient id="fillOpen" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-open)"
                    stopOpacity={0.45}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-open)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient id="fillClosed" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-closed)"
                    stopOpacity={0.45}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-closed)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={(value) => formatXAxis(String(value), range)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      formatTooltipLabel(String(value), range)
                    }
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey="closed"
                type="monotone"
                fill="url(#fillClosed)"
                stroke="var(--color-closed)"
                strokeWidth={2}
              />
              <Area
                dataKey="open"
                type="monotone"
                fill="url(#fillOpen)"
                stroke="var(--color-open)"
                strokeWidth={2}
              />
              <Area
                dataKey="total"
                type="monotone"
                fill="url(#fillTotal)"
                stroke="var(--color-total)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>
    </DashboardCard>
  );
}
