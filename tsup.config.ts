import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/rfm.ts',
    'src/segments.ts',
    'src/loyalty.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  target: 'es2020',
  outDir: 'dist',
});
