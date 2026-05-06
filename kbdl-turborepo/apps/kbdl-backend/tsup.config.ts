import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["cjs"],
  clean: true,
  noExternal: ["@repo/db", "@repo/validator", "@repo/types"],
  // Tell tsup NOT to bundle Prisma's internal modules
  external: [
    "@prisma/client",
    "@prisma/client-runtime-utils",
    "@prisma/adapter-pg"
  ],
});