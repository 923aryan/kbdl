import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'prisma/config';

/** Single source of truth: kbdl-turborepo/.env */
const rootEnv = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
config({ path: rootEnv });

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }

  const password = process.env.POSTGRES_PASSWORD;
  if (!password) {
    throw new Error(
      `DATABASE_URL is required. Set it in ${rootEnv} or provide POSTGRES_PASSWORD (+ POSTGRES_USER/POSTGRES_DB).`,
    );
  }

  const user = process.env.POSTGRES_USER ?? 'kbdl';
  const host = process.env.POSTGRES_HOST ?? 'localhost';
  const port = process.env.POSTGRES_PORT ?? '5432';
  const db = process.env.POSTGRES_DB ?? 'kbdl';
  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${db}?schema=public`;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node --env-file=../../.env ./prisma/seed.mjs',
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
