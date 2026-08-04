import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'prisma/config';

/** Single source of truth: kbdl-turborepo/.env */
const rootEnv = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
config({ path: rootEnv });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node --env-file=../../.env ./prisma/seed.mjs',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
