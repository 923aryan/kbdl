/**
 * Clone a PostgreSQL database (structure + data) using TEMPLATE.
 *
 * Usage (from kbdl-turborepo):
 *   pnpm --filter @repo/db clone-db
 *   pnpm --filter @repo/db clone-db -- --from=kbdl --to=kbdl_dev
 *   pnpm --filter @repo/db clone-db -- --to=kbdl_dev --drop
 *
 * Requires DATABASE_URL in kbdl-turborepo/.env
 * Connects to the `postgres` maintenance DB, then:
 *   CREATE DATABASE <to> WITH TEMPLATE <from> OWNER <user>
 *
 * IMPORTANT:
 * - Stop backend / close DBeaver tabs on the source DB first
 *   (or this script will try to terminate other sessions).
 * - The DB user must have CREATEDB (or be superuser).
 */

import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

loadEnv({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const { Client } = pg;

function parseArgs(argv) {
  const args = { from: 'kbdl', to: 'kbdl_dev', drop: false };
  for (const arg of argv) {
    if (arg.startsWith('--from=')) args.from = arg.slice('--from='.length);
    else if (arg.startsWith('--to=')) args.to = arg.slice('--to='.length);
    else if (arg === '--drop') args.drop = true;
  }
  return args;
}

function parseDatabaseUrl(url) {
  const parsed = new URL(url);
  return {
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    host: parsed.hostname,
    port: Number(parsed.port || 5432),
  };
}

async function main() {
  const { from: sourceDb, to: targetDb, drop } = parseArgs(process.argv.slice(2));

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is missing. Set it in kbdl-turborepo/.env');
    process.exit(1);
  }

  if (sourceDb === targetDb) {
    console.error('❌ --from and --to must be different database names');
    process.exit(1);
  }

  const conn = parseDatabaseUrl(databaseUrl);
  const client = new Client({
    ...conn,
    database: 'postgres', // must not connect to source when using TEMPLATE
  });

  console.log(`🔌 Connecting to ${conn.host}:${conn.port} as ${conn.user}`);
  await client.connect();

  try {
    // End other sessions on source (TEMPLATE requires exclusive access)
    console.log(`🧹 Terminating connections to "${sourceDb}"...`);
    await client.query(
      `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1
        AND pid <> pg_backend_pid()
      `,
      [sourceDb],
    );

    if (drop) {
      console.log(`🗑  Dropping existing "${targetDb}" (if any)...`);
      await client.query(`DROP DATABASE IF EXISTS "${targetDb}"`);
    } else {
      const exists = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDb]);
      if (exists.rowCount > 0) {
        console.error(
          `❌ Database "${targetDb}" already exists. Re-run with --drop to replace it.`,
        );
        process.exit(1);
      }
    }

    console.log(`📦 Creating "${targetDb}" FROM TEMPLATE "${sourceDb}"...`);
    // CREATE DATABASE cannot run in a prepared statement / transaction.
    // Identifiers are validated above (no quotes in names from our defaults).
    const safeSource = sourceDb.replace(/"/g, '');
    const safeTarget = targetDb.replace(/"/g, '');
    const safeOwner = conn.user.replace(/"/g, '');

    await client.query(
      `CREATE DATABASE "${safeTarget}" WITH TEMPLATE "${safeSource}" OWNER "${safeOwner}"`,
    );

    console.log(`✅ Done. Clone ready: ${safeTarget}`);
    console.log('');
    console.log('Update both .env files to:');
    console.log(
      `DATABASE_URL="postgresql://${conn.user}:****@${conn.host}:${conn.port}/${safeTarget}?schema=public"`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ Failed to clone database:');
  console.error(err.message || err);
  if (String(err.message || '').includes('permission denied')) {
    console.error('\nHint: appuser may lack CREATEDB. Use a superuser DATABASE_URL temporarily.');
  }
  if (String(err.message || '').includes('being accessed by other users')) {
    console.error('\nHint: Stop backend and close DBeaver editors on the source DB, then retry.');
  }
  process.exit(1);
});
