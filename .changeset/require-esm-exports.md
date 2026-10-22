---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix `require('@rjvr/buzzsaw')` and `require('@rjvr/buzzsaw-wav')` failing with `ERR_PACKAGE_PATH_NOT_EXPORTED` on Node versions that load ES modules through `require`. The export maps offered only an `import` condition; they now use `default`, and expose `package.json` for tools that read it.
