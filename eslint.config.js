import antfu from '@antfu/eslint-config'
import noUnsanitized from 'eslint-plugin-no-unsanitized'
import security from 'eslint-plugin-security'

export default antfu({
  formatters: true,
  unocss: true,
  vue: true,
}, noUnsanitized.configs.recommended, security.configs.recommended, {
  // Flags every `obj[key]` lookup; typed records and arrays make it noise here
  name: 'buzzsaw/security-overrides',
  rules: {
    'security/detect-object-injection': 'off',
  },
}, {
  // npm applies `files` patterns in order: a negation sorted above the include it narrows has no effect
  files: ['packages/*/package.json'],
  name: 'buzzsaw/package-files-order',
  rules: {
    'jsonc/sort-array-values': 'off',
  },
})
