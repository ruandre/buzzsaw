import { defineConfig } from 'rolldown'

export default defineConfig({
  // Separate entries allow consumers to exclude preset pack from main chunk
  input: {
    index: 'src/index.ts',
    sounds: 'src/sounds.ts',
  },
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
  },
})
