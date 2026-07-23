export interface CompanyFolder {
  id: string;
  companyId: string;
  parentId: string | null;
  name: string;
  createdById: string | null;
  createdAt: Date;
}

export interface CompanyFolderAssetItem {
  id: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  uploadedById: string | null;
  createdAt: Date;
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
  folders: CompanyFolder[];
  files: CompanyFolderAssetItem[];
}
