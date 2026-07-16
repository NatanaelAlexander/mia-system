"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  total: number;
  centerLabel?: string;
  className?: string;
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function DonutChart({
  segments,
  total,
  centerLabel = "Total",
  className,
}: DonutChartProps) {
  const { chartData, chartConfig } = React.useMemo(() => {
    const config: ChartConfig = {};
    const data = segments.map((segment) => {
      const key = slugify(segment.label);
      config[key] = { label: segment.label, color: segment.color };
      return {
        key,
        label: segment.label,
        value: segment.value,
        fill: segment.color,
      };
    });
    return { chartData: data, chartConfig: config };
  }, [segments]);

  const hasData = segments.some((segment) => segment.value > 0);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 sm:flex-row",
        className,
      )}
    >
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-44 w-44 shrink-0"
      >
        <PieChart>
          {hasData ? (
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="key" />}
            />
          ) : null}
          <Pie
            data={
              hasData
                ? chartData
                : [{ key: "empty", label: centerLabel, value: 1, fill: "var(--muted)" }]
            }
            dataKey="value"
            nameKey="key"
            innerRadius={58}
            outerRadius={80}
            paddingAngle={hasData ? 3 : 0}
            strokeWidth={2}
            isAnimationActive={hasData}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground font-mono text-3xl font-semibold"
                      >
                        {total}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 22}
                        className="fill-muted-foreground text-xs"
                      >
                        {centerLabel}
                      </tspan>
                    </text>
                  );
                }
                return null;
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="w-full max-w-xs space-y-3">
        {segments.map((segment) => (
          <li
            key={segment.label}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm transition-colors hover:bg-muted/40"
          >
            <span className="flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full ring-2 ring-background"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-muted-foreground">{segment.label}</span>
            </span>
            <span className="font-mono font-medium tabular-nums">
              {segment.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
