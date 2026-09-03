# @rjvr/buzzsaw-wav

## 3.0.0

### Major Changes

- 9767906: Fix the published types for consumers outside a DOM-typed bundler, and reject definition values that were previously accepted and then silently mangled.
  
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

### Patch Changes

- Updated dependencies [9767906]
  - @rjvr/buzzsaw@3.0.0

## 2.0.0

### Major Changes

- ab7fd16: Fix the developer-experience problems a fresh integration turned up: wrong docs, untyped preset names, a false headless claim, and defaults that failed silently.
  
  ### Breaking
  
  - `SoundManager` is generic over its registered names. `register` and `registerAll` now return the manager, widened so `play` accepts the names just added, and a typo fails to compile. `register` no longer returns the `Sound`; use `get(name)`. Where names are dynamic, use `new SoundManager<string>()`.
  - `register` and the `Sound` constructor validate the definition and throw `SoundValidationError` instead of accepting garbage that fails silently at playback.
  - `Sound.definition` is deeply frozen, so `Readonly<SoundDefinition>` now holds at runtime. Use `cloneSoundDefinition` for an editable copy.
  - Out-of-range values throw a `RangeError` naming the value instead of being silently clamped: `masterVolume` outside `0..2`, negative `volume`, non-positive `pitchScale`, `sampleRate` below 8000, `numChannels` below 1.
  - `WavExporter.downloadWav` throws without a DOM document instead of logging a warning and resolving.
  - `SoundManager.play` options no longer accept `audioContext` or `destination`; they bypassed the master bus. Use `Sound.play` for custom routing.
  - `limiter` defaults to `true`. Overlapping UI voices clipped by default before.
  - `@rjvr/buzzsaw` is a peer dependency of `@rjvr/buzzsaw-wav`, not a hard dependency, so a duplicate copy can no longer create a second audio-context singleton.
  - Public types no longer reference `lib.dom`. `OscillatorType` is replaced by the exported `WaveType`, and Web Audio types by structural equivalents (`AudioContextLike`, `AudioNodeLike`, `AudioBufferLike`, …). Real DOM types satisfy them unchanged.
  - Removed from the public API: `AudioBus`, `applyWaveShape`, `atLeast`, `clampFinite`, `cloneEnvelope`, `finiteOr`, `latestStepTime`, `orderedSteps`, `resolveEnvelopeTiming`, `sampleEnvelope`, `sampleSteppedEnvelope`, and internal constants. Everything still exported is now documented.
  
  ### Added
  
  - Every preset is exported individually from `@rjvr/buzzsaw/sounds`, so five presets cost ~0.3 kB gzip instead of the full ~5.4 kB. `DEFAULT_SOUNDS` still bundles all 113, and `DefaultSoundName` types their names.
  - `EnvelopeDefinition.interpolation` (`'linear' | 'step'`) makes explicit what was an undocumented asymmetry: frequency envelopes ramp, gain envelopes hold. Either default can now be overridden.
  - `WavExportOptions.offlineAudioContextClass` makes headless rendering real. Node has no global `OfflineAudioContext`; pass a polyfill's instead of patching `globalThis`. The unsupported-environment error now says so.
  - `SoundManagerOptions.onMissing` replaces the unsilenceable `console.error` when `play` is given an unknown name.
  - `SoundValidationError`, which carries every validation message in `errors`.
  - `freezeSoundDefinition`.
  
  ### Documentation
  
  - Every code sample now typechecks; definitions are annotated with `SoundDefinition` rather than widening to `string`.
  - All 113 presets are listed by category. The count was previously given as "80+", and the core README's own example used a preset name (`coin`) that does not exist.
  - Documented that `attack` and `decay` are carved out of `duration` while envelope steps extend it. Three doc comments previously asserted the opposite.
  - Documented that noise is unsupported, that `numChannels: 2` duplicates mono, when `outputLevel` reads 0, and what the sample-rate floor is.
  - `src` is published, so source maps and go-to-definition resolve.

### Patch Changes

- Updated dependencies [ab7fd16]
  - @rjvr/buzzsaw@2.0.0

## 1.0.0

### Major Changes

- Initial release.
