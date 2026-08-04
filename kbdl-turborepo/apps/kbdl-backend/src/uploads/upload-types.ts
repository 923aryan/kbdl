/**
 * Central registry for upload intents.
 * Upload via multipart; later reads use 5-minute signed GET URLs.
 *
 * Add new types here only; routes/services stay generic.
 */

import type { Role } from '../utils/constants';

export type UploadActor = {
  role: Role;
  id: string;
};

export type UploadTypeKey = 'userProfile' | 'userPrivateDocs' | 'userFiles';

export type UploadMediaKind = 'image' | 'document' | 'audio' | 'video';

export type UploadTypeDefinition = {
  key: UploadTypeKey;
  label: string;
  description: string;
  /** Max object size accepted for this intent */
  maxSizeBytes: number;
  allowedMimeTypes: readonly string[];
  allowedExtensions: readonly string[];
  mediaKinds: readonly UploadMediaKind[];
  /** S3 key prefix under the private bucket */
  folder: string;
};

const MB = 1024 * 1024;

export const UPLOAD_TYPE_CONFIG = {
  userProfile: {
    key: 'userProfile',
    label: 'User profile',
    description: 'Profile / avatar images only',
    maxSizeBytes: 2 * MB,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'] as const,
    mediaKinds: ['image'] as const,
    folder: 'profiles',
  },
  userPrivateDocs: {
    key: 'userPrivateDocs',
    label: 'User private documents',
    description: 'Identity / KYC docs (PAN, Aadhaar, etc.)',
    maxSizeBytes: 5 * MB,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'] as const,
    mediaKinds: ['image', 'document'] as const,
    folder: 'private-docs',
  },
  userFiles: {
    key: 'userFiles',
    label: 'User files',
    description: 'Larger general files including audio / video',
    maxSizeBytes: 25 * MB,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'audio/mpeg',
      'audio/mp4',
      'audio/wav',
      'audio/webm',
      'video/mp4',
      'video/quicktime',
      'video/webm',
    ] as const,
    allowedExtensions: [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.pdf',
      '.mp3',
      '.m4a',
      '.wav',
      '.webm',
      '.mp4',
      '.mov',
    ] as const,
    mediaKinds: ['image', 'document', 'audio', 'video'] as const,
    folder: 'files',
  },
} as const satisfies Record<UploadTypeKey, UploadTypeDefinition>;

/** How long a confirmed upload stays claimable in Redis before a business API uses it */
export const UPLOAD_REDIS_TTL_SECONDS = 5 * 60;

/** Presign / pending window (client must PUT + confirm within this) */
export const UPLOAD_PRESIGN_TTL_SECONDS = 5 * 60;

/** Temporary GET URL when serving a private object to the client */
export const UPLOAD_READ_URL_TTL_SECONDS = 5 * 60;

export function getUploadTypeConfig(type: string): UploadTypeDefinition {
  const cfg = UPLOAD_TYPE_CONFIG[type as UploadTypeKey];
  if (!cfg) {
    throw new Error(`Unknown upload type: ${type}`);
  }
  return cfg;
}

export function listUploadTypeConfigs(): UploadTypeDefinition[] {
  return Object.values(UPLOAD_TYPE_CONFIG);
}

export function extensionOf(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  if (idx < 0) return '';
  return fileName.slice(idx).toLowerCase();
}
