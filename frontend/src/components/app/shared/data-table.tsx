import type React from "react";

export interface DataColumn<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  data: T[];
}

export function DataTable<T>({ columns, data }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <div
        className="grid gap-3 border-b bg-muted/40 p-3 text-xs font-medium uppercase tracking-wide text-muted-foreground"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
        }}
      >
        {columns.map((column) => (
          <div key={column.key}>{column.label}</div>
        ))}
      </div>

      <div className="divide-y divide-border/70">
        {data.map((item, index) => (
          <div
            key={index}
            className="grid gap-3 p-3 text-sm hover:bg-muted/30"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
            }}
          >
            {columns.map((column) => (
              <div key={column.key} className="min-w-0 truncate">
                {column.render(item)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
