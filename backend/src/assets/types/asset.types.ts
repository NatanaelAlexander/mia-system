export interface Asset {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  fileSize: number | null;
  uploadedById: string | null;
  createdAt: Date;
}

export interface AssetDownloadUrl {
  url: string;
  expiresInSeconds: number;
}
