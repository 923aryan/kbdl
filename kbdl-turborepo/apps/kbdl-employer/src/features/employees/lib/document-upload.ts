import { fetchDocumentReadUrl } from '../api';

export const UPLOAD_FILE_KEY_PREFIXES = ['profiles/', 'private-docs/', 'files/'] as const;

export function isStoredFileKey(value: string): boolean {
  const trimmed = value.trim();
  return UPLOAD_FILE_KEY_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function displayNameFromFileKey(fileKey: string): string {
  const last = fileKey.split('/').pop() ?? fileKey;
  const match = last.match(/^[0-9a-f-]{36}-(.+)$/i);
  return match?.[1] ?? last;
}

export function formatDocumentStoredValue(value: string): string {
  if (!value?.trim() || value === '-') return '-';
  if (isHttpUrl(value)) return 'External link';
  if (isStoredFileKey(value)) return displayNameFromFileKey(value);
  return value;
}

/** Open private doc in new tab — uses 5-minute signed URL from POST /uploads/read-url */
export async function openStoredDocument(fileRef: string): Promise<void> {
  const trimmed = fileRef.trim();
  if (!trimmed || trimmed === '-') return;

  if (isHttpUrl(trimmed)) {
    window.open(trimmed, '_blank', 'noopener,noreferrer');
    return;
  }

  if (!isStoredFileKey(trimmed)) {
    throw new Error('Document reference is invalid. Please re-upload the file.');
  }

  const { downloadUrl } = await fetchDocumentReadUrl(trimmed);
  window.open(downloadUrl, '_blank', 'noopener,noreferrer');
}
