import { apiFetch, apiUpload } from "@/lib/api/client";

export interface CompanyFolderItem {
  id: string;
  companyId: string;
  parentId: string | null;
  name: string;
  createdById: string | null;
  createdAt: string;
}

export interface CompanyFileItem {
  id: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  uploadedById: string | null;
  createdAt: string;
  folderId: string | null;
}

export interface CompanyFolderBreadcrumbItem {
  id: string;
  name: string;
}

export interface CompanyFolderContents {
  companyId: string;
  folderId: string | null;
  breadcrumb: CompanyFolderBreadcrumbItem[];
  folders: CompanyFolderItem[];
  files: CompanyFileItem[];
}

export interface CompanyFileDownloadUrl {
  url: string;
  expiresInSeconds: number;
}

export function listCompanyFolderContents(
  companyId: string,
  folderId?: string | null,
) {
  return apiFetch<CompanyFolderContents>(
    "/internal/company-files/contenido",
    {
      method: "POST",
      body: JSON.stringify({
        companyId,
        ...(folderId ? { folderId } : {}),
      }),
    },
    true,
  );
}

export function createCompanyFolder(
  companyId: string,
  name: string,
  parentId?: string | null,
) {
  return apiFetch<CompanyFolderItem>(
    "/internal/company-files/carpetas",
    {
      method: "POST",
      body: JSON.stringify({
        companyId,
        name,
        ...(parentId ? { parentId } : {}),
      }),
    },
    true,
  );
}

export function renameCompanyFolder(folderId: string, name: string) {
  return apiFetch<CompanyFolderItem>(
    "/internal/company-files/carpetas",
    {
      method: "PATCH",
      body: JSON.stringify({ folderId, name }),
    },
    true,
  );
}

export function deleteCompanyFolder(folderId: string) {
  return apiFetch<{ ok: boolean }>(
    "/internal/company-files/carpetas/eliminar",
    {
      method: "POST",
      body: JSON.stringify({ folderId }),
    },
    true,
  );
}

export function uploadCompanyFile(
  companyId: string,
  file: File,
  folderId?: string | null,
  displayName?: string,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("companyId", companyId);
  if (folderId) {
    formData.append("folderId", folderId);
  }
  if (displayName?.trim()) {
    formData.append("displayName", displayName.trim());
  }

  return apiUpload<CompanyFileItem>(
    "/internal/company-files/subir-archivo",
    formData,
    true,
  );
}

export function getCompanyFileDownloadUrl(assetId: string) {
  return apiFetch<CompanyFileDownloadUrl>(
    "/internal/company-files/archivos/descarga",
    {
      method: "POST",
      body: JSON.stringify({ assetId }),
    },
    true,
  );
}

export function deleteCompanyFile(assetId: string) {
  return apiFetch<{ ok: boolean }>(
    "/internal/company-files/archivos/eliminar",
    {
      method: "POST",
      body: JSON.stringify({ assetId }),
    },
    true,
  );
}
