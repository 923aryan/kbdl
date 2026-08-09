import { existsSync } from 'node:fs';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootEnv = path.resolve(pkgRoot, '../../.env');

/** Load kbdl-turborepo/.env when present; resolve DATABASE_URL (with POSTGRES_* fallback). */
export function loadDbEnv() {
  if (existsSync(rootEnv)) {
    config({ path: rootEnv });
  }

  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }

  const password = process.env.POSTGRES_PASSWORD;
  if (!password) {
    console.error('❌ DATABASE_URL is missing.');
    if (existsSync(rootEnv)) {
      console.error(`   Checked ${rootEnv}`);
    } else {
      console.error(`   No ${rootEnv} file (OK in Docker if DATABASE_URL is injected).`);
    }
    console.error('   Set DATABASE_URL or POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB (+ optional HOST/PORT).');
    process.exit(1);
  }

  const user = process.env.POSTGRES_USER ?? 'kbdl';
  const host = process.env.POSTGRES_HOST ?? 'localhost';
  const port = process.env.POSTGRES_PORT ?? '5432';
  const db = process.env.POSTGRES_DB ?? 'kbdl';
  const url = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${db}?schema=public`;
  process.env.DATABASE_URL = url;
  return url;
}

export { rootEnv };
