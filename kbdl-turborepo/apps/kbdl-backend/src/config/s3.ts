import { S3Client } from '@aws-sdk/client-s3';
import { env } from '@repo/validator/server';

export const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

export const S3_BUCKET = env.S3_BUCKET;
export const AWS_REGION = env.AWS_REGION;
