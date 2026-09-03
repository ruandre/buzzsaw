import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  unocss: true,
  vue: true,
}, {
  // npm applies `files` patterns in order: a negation sorted above the include it narrows has no effect
  files: ['packages/*/package.json'],
  name: 'buzzsaw/package-files-order',
  rules: {
    'jsonc/sort-array-values': 'off',
  },
})
