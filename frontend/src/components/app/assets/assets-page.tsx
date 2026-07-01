"use client";

import { listAssets } from "@/components/app/api/assets";
import { formatDate, formatFileSize } from "@/components/app/shared/format";
import { ResourcePageShell } from "@/components/app/shared/resource-page-shell";
import { assetsModule } from "./assets-module";

export function AssetsPage() {
  return (
    <ResourcePageShell
      title="Archivos"
      description="Metadata de archivos privados almacenados en R2."
      emptyTitle="No hay archivos"
      emptyDescription="Cuando se suban archivos al sistema aparecerá su metadata aquí."
      access={assetsModule}
      load={() => listAssets()}
      columns={[
        { key: "fileName", label: "Archivo", render: (item) => item.fileName },
        { key: "mimeType", label: "Tipo", render: (item) => item.mimeType ?? "—" },
        {
          key: "fileSize",
          label: "Tamaño",
          render: (item) => formatFileSize(item.fileSize),
        },
        {
          key: "createdAt",
          label: "Subido",
          render: (item) => formatDate(item.createdAt),
        },
      ]}
    />
  );
}
