import { z } from 'zod';
import { loadMonorepoEnv } from './load-monorepo-env';

loadMonorepoEnv();

export const dbEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

export const dbEnv = dbEnvSchema.parse(process.env);
