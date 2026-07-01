export interface PendingAttachment {
  file: File;
  displayName?: string;
}

export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;

export function pickFirstFile(files: FileList | null): File | null {
  if (!files?.length) {
    return null;
  }

  return files[0] ?? null;
}

export function collectFiles(
  files: FileList | null,
  options?: { onRejected?: (file: File) => void },
): File[] {
  if (!files?.length) {
    return [];
  }

  const accepted: File[] = [];

  for (const file of Array.from(files)) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      options?.onRejected?.(file);
      continue;
    }

    accepted.push(file);
  }

  return accepted;
}

export function filesToPendingAttachments(files: File[]): PendingAttachment[] {
  return files.map((file) => ({ file }));
}

export function resolveAttachmentDisplayName(
  customName: string,
  file: File,
): string | undefined {
  const trimmed = customName.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.includes(".")) {
    return trimmed;
  }

  const dot = file.name.lastIndexOf(".");
  const extension = dot > 0 ? file.name.slice(dot) : "";
  return `${trimmed}${extension}`;
}

export function getAttachmentLabel(attachment: PendingAttachment): string {
  return attachment.displayName ?? attachment.file.name;
}
