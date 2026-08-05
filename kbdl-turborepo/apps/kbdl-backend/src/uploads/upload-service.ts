import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { S3_BUCKET, s3Client } from '../config/s3';
import { AppError } from '../utils/api-error';
import {
  extensionOf,
  getUploadTypeConfig,
  type UploadActor,
  type UploadTypeKey,
} from './upload-types';

export type { UploadActor };

function buildFileKey(actor: UploadActor, type: UploadTypeKey, fileId: string, fileName: string) {
  const cfg = getUploadTypeConfig(type);
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  return `${cfg.folder}/${actor.role}/${actor.id}/${yyyy}/${mm}/${fileId}-${safeName}`;
}

function validateFile(input: {
  type: UploadTypeKey;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}) {
  const cfg = getUploadTypeConfig(input.type);
  const ext = extensionOf(input.fileName);

  if (!(cfg.allowedExtensions as readonly string[]).includes(ext)) {
    throw new AppError(
      400,
      'UPLOAD_EXTENSION_NOT_ALLOWED',
      `Extension ${ext || '(none)'} is not allowed for ${cfg.key}`,
      { allowedExtensions: cfg.allowedExtensions },
    );
  }

  if (!(cfg.allowedMimeTypes as readonly string[]).includes(input.contentType)) {
    throw new AppError(
      400,
      'UPLOAD_MIME_NOT_ALLOWED',
      `Content-Type ${input.contentType} is not allowed for ${cfg.key}`,
      { allowedMimeTypes: cfg.allowedMimeTypes },
    );
  }

  if (input.sizeBytes <= 0) {
    throw new AppError(400, 'UPLOAD_EMPTY', 'Uploaded file is empty');
  }

  if (input.sizeBytes > cfg.maxSizeBytes) {
    throw new AppError(400, 'UPLOAD_TOO_LARGE', `File exceeds max size for ${cfg.key}`, {
      maxSizeBytes: cfg.maxSizeBytes,
      sizeBytes: input.sizeBytes,
    });
  }
}

/** Multipart upload → private S3. Save returned fileKey in your DB. */
export async function uploadFileToS3(
  actor: UploadActor,
  input: {
    type: UploadTypeKey;
    fileName: string;
    contentType: string;
    buffer: Buffer;
  },
) {
  validateFile({
    type: input.type,
    fileName: input.fileName,
    contentType: input.contentType,
    sizeBytes: input.buffer.byteLength,
  });

  const fileId = randomUUID();
  const fileKey = buildFileKey(actor, input.type, fileId, input.fileName);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileKey,
      Body: input.buffer,
      ContentType: input.contentType,
      Metadata: {
        'upload-type': input.type,
        'actor-role': actor.role,
        'actor-id': actor.id,
        'file-id': fileId,
      },
    }),
  );

  return {
    fileKey,
    fileName: input.fileName,
    type: input.type,
    contentType: input.contentType,
    sizeBytes: input.buffer.byteLength,
  };
}
