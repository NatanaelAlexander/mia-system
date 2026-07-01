import { apiFetch, apiFetchDetalle } from "@/lib/api/client";

export interface AssetListItem {
  id: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface AssetDownloadUrl {
  url: string;
  expiresInSeconds: number;
}

export function listAssets() {
  return apiFetch<AssetListItem[]>("/internal/assets", {}, true);
}

export function getAssetDownloadUrl(assetId: string) {
  return apiFetchDetalle<AssetDownloadUrl>(
    "/internal/assets/descarga",
    { id: assetId },
    true,
  );
}

export function deleteAsset(assetId: string) {
  return apiFetch<void>(
    `/internal/assets/${assetId}`,
    { method: "DELETE" },
    true,
  );
}
