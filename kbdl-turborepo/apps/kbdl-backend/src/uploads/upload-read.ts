import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_BUCKET, s3Client } from '../config/s3';
import { AppError } from '../utils/api-error';
import { UPLOAD_READ_URL_TTL_SECONDS, UPLOAD_TYPE_CONFIG, type UploadActor } from './upload-types';

function assertValidFileKey(fileKey: string) {
  const raw = fileKey.trim();
  if (!raw || raw.includes('..') || raw.startsWith('/') || raw.startsWith('s3://')) {
    throw new AppError(400, 'INVALID_FILE_KEY', 'fileKey must be the S3 object key returned from upload');
  }
  return raw;
}

function assertActorOwnsKey(actor: UploadActor, fileKey: string) {
  const ownerSegment = `/${actor.role}/${actor.id}/`;
  const knownFolders = Object.values(UPLOAD_TYPE_CONFIG).map((c) => c.folder);
  const hasFolder = knownFolders.some((folder) => fileKey.startsWith(`${folder}/`));
  if (!hasFolder || !fileKey.includes(ownerSegment)) {
    throw new AppError(403, 'UPLOAD_FORBIDDEN', 'You do not have access to this file');
  }
}

/** Private S3 object → 5-minute signed GET URL */
export async function createReadUrl(actor: UploadActor, fileKeyInput: string) {
  const fileKey = assertValidFileKey(fileKeyInput);
  assertActorOwnsKey(actor, fileKey);

  let contentType: string | undefined;
  try {
    const head = await s3Client.send(
      new HeadObjectCommand({
        Bucket: S3_BUCKET,
        Key: fileKey,
      }),
    );
    contentType = head.ContentType;
  } catch {
    throw new AppError(404, 'FILE_NOT_FOUND', 'Object not found in private storage');
  }

  const fileName = fileKey.split('/').pop() || 'file';
  const downloadUrl = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileKey,
      ...(contentType ? { ResponseContentType: contentType } : {}),
      ResponseContentDisposition: `inline; filename="${fileName.replace(/"/g, '')}"`,
    }),
    { expiresIn: UPLOAD_READ_URL_TTL_SECONDS },
  );

  return {
    fileKey,
    downloadUrl,
    expiresInSeconds: UPLOAD_READ_URL_TTL_SECONDS,
  };
}
