import { z } from "zod";

export const dbEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

export const dbEnv = dbEnvSchema.parse(process.env);