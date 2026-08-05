import { existsSync } from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';

/**
 * Load kbdl-turborepo/.env (folder that contains pnpm-workspace.yaml).
 * Safe when env is already injected (Docker Compose) — dotenv does not override by default.
 */
export function loadMonorepoEnv() {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const workspace = path.join(dir, 'pnpm-workspace.yaml');
    const envFile = path.join(dir, '.env');
    if (existsSync(workspace)) {
      if (existsSync(envFile)) {
        config({ path: envFile });
      }
      return;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}
