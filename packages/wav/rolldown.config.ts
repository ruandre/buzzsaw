import { defineConfig } from 'rolldown'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
    // `src` ships in the tarball, so embedding it again would double the published bytes
    sourcemapExcludeSources: true,
  },
  external: ['@rjvr/buzzsaw'],
})
