import type React from "react";
import { cn } from "@/lib/utils";

export interface DataColumn<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  width?: "fill" | "wide" | "auto";
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  data: T[];
}

function columnWidth(width: DataColumn<unknown>["width"] = "fill") {
  if (width === "auto") {
    return "auto";
  }

  if (width === "wide") {
    return "minmax(0, 2fr)";
  }

  return "minmax(0, 1fr)";
}

function buildGridTemplate<T>(columns: DataColumn<T>[]) {
  return columns.map((column) => columnWidth(column.width)).join(" ");
}

export function DataTable<T>({ columns, data }: DataTableProps<T>) {
  const gridTemplateColumns = buildGridTemplate(columns);

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <div
        className="grid gap-3 border-b bg-muted/40 p-3 text-xs font-medium uppercase tracking-wide text-muted-foreground"
        style={{ gridTemplateColumns }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(column.headerClassName, column.width === "auto" && "text-right")}
          >
            {column.label}
          </div>
        ))}
      </div>

      <div className="divide-y divide-border/70">
        {data.map((item, index) => (
          <div
            key={index}
            className="grid gap-3 p-3 text-sm hover:bg-muted/30"
            style={{ gridTemplateColumns }}
          >
            {columns.map((column) => (
              <div
                key={column.key}
                className={cn(
                  "min-w-0",
                  column.width === "auto" ? "flex justify-end" : "truncate",
                  column.className,
                )}
              >
                {column.render(item)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
