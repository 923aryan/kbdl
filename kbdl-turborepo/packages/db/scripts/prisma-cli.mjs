import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { loadDbEnv } from './resolve-database-url.mjs';

loadDbEnv();

const require = createRequire(import.meta.url);
const prismaBin = path.join(path.dirname(require.resolve('prisma/package.json')), 'build/index.js');
const args = process.argv.slice(2);

const result = spawnSync(process.execPath, [prismaBin, ...args], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
