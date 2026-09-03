# @rjvr/buzzsaw-wav

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
