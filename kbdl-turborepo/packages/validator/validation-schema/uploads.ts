import { z } from 'zod';

export const uploadTypeEnum = z.enum(['userProfile', 'userPrivateDocs', 'userFiles']);

export const createUploadReadUrlSchema = z.object({
  body: z.object({
    fileKey: z.string().min(3).max(1024),
  }),
});
