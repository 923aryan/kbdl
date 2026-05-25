import { z } from 'zod';
import { dbEnvSchema } from './db';
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val), {
      message: 'PORT must be a number',
    }),

  DATABASE_URL: dbEnvSchema.shape.DATABASE_URL,
  REDIS_URL: z.url().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  RESEND_API_KEY: z.string().min(1),
  EMPLOYER_URL: z.string().min(1)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(z.treeifyError(parsed.error), null, 2));
  process.exit(1);
}
export const env = parsed.data;
