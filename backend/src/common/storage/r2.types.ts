export interface R2UploadInput {
  ownerType: string;
  ownerId: string;
  fileName: string;
  mimeType: string;
  body: Buffer;
}

/** Bucket privado: en BD guardar `key`, no URL pública. */
export interface R2UploadResult {
  key: string;
  mimeType: string;
  fileSize: number;
}
