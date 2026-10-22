// CommonJS consumers load the ESM build through require(esm), which needs a `default` export condition
const assert = require('node:assert/strict')

const core = require('@rjvr/buzzsaw')
const wav = require('@rjvr/buzzsaw-wav')
const sounds = require('@rjvr/buzzsaw/sounds')

assert.equal(typeof core.SoundManager, 'function', 'core loads through require')
assert.equal(typeof sounds.DEFAULT_SOUNDS, 'object', 'presets load through require')
assert.equal(typeof wav.WavEncoder, 'function', 'wav loads through require')
assert.equal(require('@rjvr/buzzsaw/package.json').name, '@rjvr/buzzsaw', 'core manifest is readable')
assert.equal(require('@rjvr/buzzsaw-wav/package.json').name, '@rjvr/buzzsaw-wav', 'wav manifest is readable')
