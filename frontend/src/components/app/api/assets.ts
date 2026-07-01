import { apiFetch } from "@/lib/api/client";

export interface AssetListItem {
  id: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export function listAssets() {
  return apiFetch<AssetListItem[]>("/internal/assets", {}, true);
}
