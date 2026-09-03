---
"@rjvr/buzzsaw": major
"@rjvr/buzzsaw-wav": major
---

Fix the published types for consumers outside a DOM-typed bundler, and reject definition values that were previously accepted and then silently mangled.

Declarations now carry explicit `.js` extensions. Under `"moduleResolution": "nodenext"` the previous extensionless re-exports made `export *` contribute nothing, so `SoundDefinition` and all 113 presets were invisible even though the runtime bundle was fine. `@rjvr/buzzsaw-wav` separately referenced the DOM `Blob` in public signatures, which broke the documented "no `lib.dom`" claim in every resolution mode; `Blob`-returning methods are now typed as `BlobLike`, which resolves to the host's own `Blob` wherever one is declared and to a structural equivalent where none is. `just verify-consumer` builds, packs and consumes both libraries inside a throwaway container, typechecking the tarballs under `nodenext` with `"lib": ["es2023"]`, no `@types/node`, and no `skipLibCheck`, so neither can regress silently. It runs in `just ci` and in CI.

Breaking changes:

- `gain` above 1 is a validation error. It used to clamp silently and hard-clip the rendered audio.
- `frequency` above 20000 Hz is a validation error. It used to render a file of pure zeros and report success.
- `duration` below 0.01 is a validation error. It used to clamp silently.
- An envelope step with a negative `time` is a validation error. It used to schedule before the sound started, where it could never be reached.
- An unrecognized property on a `SoundDefinition`, or on one of its envelopes, is a validation error, so `waveform` written for `waveType` fails instead of being dropped. Definitions hold no metadata; keep names and descriptions beside one.
- An array is rejected as a definition instead of being reported as merely missing `frequency`.
- `SoundManager`'s `list`, `keys`, `entries`, `forEach`, `find`, `filter`, and iterator are typed over the registered names rather than `string`, so iterating the registry and playing what it yields typechecks without a cast.
- `WavEncoder.encode` validates `sampleRate` and `numChannels` as `OfflineSoundRenderer.render` already did, and throws `RangeError` rather than `Error` on an unsupported `bitDepth`. It used to accept a 100 Hz sample rate and clamp a zero channel count.

Also: `downloadWav` checks for a DOM document before rendering, so a Node caller is told about the missing document instead of a missing `OfflineAudioContext`; `MAX_GAIN`, `MAX_FREQUENCY_HZ`, and `MIN_DURATION_S` are exported; tests no longer ship in the tarballs, whose sourcemaps now point at the published `src` instead of embedding a second copy of it; and the READMEs document Node playback via `setAudioContextInstance`, `playSoundFromDefinition`, `OfflineSoundRenderer`, the exported type and constant lists, the error taxonomy, the required `moduleResolution`, and the limiter asymmetry between `SoundManager` playback and WAV export.
