import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"], // Change this if your entry point is named differently
  format: ["cjs"],
  clean: true,
  // This tells tsup to bundle your workspace packages instead of ignoring them
  noExternal: ["@repo/db", "@repo/validator", "@repo/types"],
});