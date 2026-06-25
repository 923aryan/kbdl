import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['cjs'],
  clean: true,
  // Bundle all local workspace packages into the final server build
  noExternal: [/@repo\/.*/],
});
