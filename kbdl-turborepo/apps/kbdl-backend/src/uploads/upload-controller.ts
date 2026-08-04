import { Request, Response } from 'express';
import { createUploadReadUrlSchema, uploadTypeEnum } from '@repo/validator/shared';
import { AppError } from '../utils/api-error';
import type { Role } from '../utils/constants';
import { sendSuccess } from '../utils/send-success';
import { validate } from '../utils/validate';
import { createReadUrl } from './upload-read';
import { uploadFileToS3 } from './upload-service';
import type { UploadActor, UploadTypeKey } from './upload-types';

function getActor(req: Request): UploadActor {
  const role = req.role as Role | undefined;
  const payload = req.payload;
  if (!role || !payload) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  if (role === 'user' && 'user' in payload) {
    return { role, id: payload.user.id };
  }
  if (role === 'employer' && 'employer' in payload) {
    return { role, id: payload.employer.id };
  }
  if (role === 'admin' && 'admin' in payload) {
    return { role, id: payload.admin.id };
  }

  throw new AppError(401, 'UNAUTHORIZED', 'Unsupported auth role for uploads');
}

/** POST /uploads — multipart type + file */
export const uploadFileHandler = async (req: Request, res: Response) => {
  const typeRaw = String(req.body?.type || '');
  const parsedType = uploadTypeEnum.safeParse(typeRaw);
  if (!parsedType.success) {
    throw new AppError(400, 'INVALID_UPLOAD_TYPE', 'type must be userProfile | userPrivateDocs | userFiles');
  }

  const file = req.file;
  if (!file) {
    throw new AppError(400, 'FILE_REQUIRED', 'multipart field "file" is required');
  }

  const result = await uploadFileToS3(getActor(req), {
    type: parsedType.data as UploadTypeKey,
    fileName: file.originalname,
    contentType: file.mimetype,
    buffer: file.buffer,
  });

  sendSuccess(res, 'File uploaded to private S3', result, 201);
};

/** POST /uploads/read-url — { fileKey } → 5-min downloadUrl */
export const createReadUrlHandler = async (req: Request, res: Response) => {
  const { body } = validate<{ body: { fileKey: string } }>(createUploadReadUrlSchema, req);
  const result = await createReadUrl(getActor(req), body.fileKey);
  sendSuccess(res, 'Temporary read URL created (expires in 5 minutes)', result);
};
