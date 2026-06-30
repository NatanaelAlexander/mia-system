const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const BLOCKED_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.ps1',
  '.msi',
  '.dll',
  '.scr',
  '.com',
  '.vbs',
  '.js',
  '.jar',
  '.php',
  '.phtml',
]);

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/', 'text/'];
const ALLOWED_MIME_EXACT = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream',
]);

export interface UploadValidationInput {
  originalName: string;
  mimeType: string;
  size: number;
}

export function assertValidUpload(input: UploadValidationInput): void {
  if (!input.size || input.size <= 0) {
    throw new Error('ARCHIVO_VACIO');
  }

  if (input.size > MAX_UPLOAD_BYTES) {
    throw new Error('ARCHIVO_DEMASIADO_GRANDE');
  }

  const extension = extractExtension(input.originalName);
  if (extension && BLOCKED_EXTENSIONS.has(extension)) {
    throw new Error('TIPO_ARCHIVO_NO_PERMITIDO');
  }

  const mime = (input.mimeType || 'application/octet-stream').toLowerCase();
  if (!isAllowedMime(mime)) {
    throw new Error('TIPO_ARCHIVO_NO_PERMITIDO');
  }
}

function extractExtension(fileName: string): string | null {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0) {
    return null;
  }

  return fileName.slice(dot).toLowerCase();
}

function isAllowedMime(mime: string): boolean {
  if (ALLOWED_MIME_EXACT.has(mime)) {
    return true;
  }

  return ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
}
