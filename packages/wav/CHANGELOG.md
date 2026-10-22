# @rjvr/buzzsaw-wav

## 4.0.0

### Patch Changes

- f3c0304: Fix the `SoundManager.audioContext` getter creating the shared `AudioContext` when read. Reading a property built a context before any user gesture, which browsers start suspended and warn about, and which costs an audio thread. The getter now returns the context given in the options, otherwise the shared one if it already exists, otherwise `null`. Call `getAudioContextInstance()` or `ensureAudioContextReady()` to create it on purpose.
- 84a8ee4: Fix `SoundManager.play` starting a voice after it was stopped. A `play` still waiting for a suspended context to resume ignored a `stopAll`, `clear`, `dispose`, `unregister`, or re-`register` that ran meanwhile, then started a voice nothing could reach to stop. Such a `play` now resolves to `null` without starting, and without calling `onMissing`.
- 5401cbc: `playSoundFromDefinition` no longer throws on a `NaN` or infinite `frequency`, `gain`, or envelope `start`. It handed those values straight to the oscillator and gain node, and Web Audio rejects non-finite values with a `TypeError`, after the voice was already connected. They now fall back to the same defaults `sampleFrequencyAtTime` and `sampleGainAtTime` report, as the README promises for this unvalidated entry point.
- 61dccd1: Fix `WavEncoder.encode` and `encodeToBlob` labelling every audio buffer as 44100 Hz when no `sampleRate` was given. A 48 kHz buffer, the usual rate of a browser `AudioContext`, came out about 8% slow and flat. The header now carries the buffer's own rate unless `sampleRate` overrides it. Raw `Float32Array[]` input still defaults to 44100 Hz.
  
  The `sampleRate` docs now state that encoding writes the rate into the header without resampling.
- 73dc8e6: Fix gain envelopes with `interpolation: 'linear'` jumping at the end of their attack. Playback ramped in only to the envelope's `start` value, then jumped or bent toward the first step, so an attack that outlasted the first step clicked. `sampleGainAtTime` reported a different curve again. The attack now ramps onto the envelope's own line, and `sampleGainAtTime` reports exactly what plays. Envelopes with `'step'` interpolation and scalar gains are unchanged.
- 18f8020: Fix `playSoundFromDefinition` leaving a wall-clock fallback timer running on an `OfflineAudioContext`. The render finished in milliseconds while the timer waited out the sound's full duration, holding a Node process or test worker open. Offline contexts now get no fallback timer.
- 8c264f0: Fix `OfflineSoundRenderer.render`, and the `WavExporter` methods built on it, rendering definitions that core rejects. A `gain` above 1 rendered clipped, and an unknown property was silently ignored, so an exported file could sound different from anything `Sound` or `SoundManager` would accept. Rendering now validates first and rejects with core's `SoundValidationError`, whose `errors` array lists every problem.
- cd742a1: Fix rendering with `numChannels` above 2 leaving channels silent. Web Audio's speaker up-mix put the mono voice only in the centre channel of a 6-channel render, only in front left and right of a 4-channel one, and only in the first channel of other counts. Every channel now holds the voice, as the `numChannels` documentation promises.
- 8a3e865: Fix `require('@rjvr/buzzsaw')` and `require('@rjvr/buzzsaw-wav')` failing with `ERR_PACKAGE_PATH_NOT_EXPORTED` on Node versions that load ES modules through `require`. The export maps offered only an `import` condition; they now use `default`, and expose `package.json` for tools that read it.
- 406ec7c: Fix `SoundManager.play` skipping the resume step for a context passed as `audioContext`. Only the shared singleton was resumed, so a context created before any user gesture stayed suspended and every sound played silently. `play` now resumes the given context too, and rejects if that context is closed, as it already did for the shared one.
- 2d81d74: Fix `Sound.stop` missing a `play` still waiting for the shared context to resume. That `play` started its voice after the `stop`, with nothing left to stop it. It now resolves to a handle that never played, matching how `SoundManager.stopAll` cancels pending plays.
- bdd710f: Fix a gain envelope with no steps ignoring `decay`. It held its `start` level to the end and then dropped straight to silence, which clicked. It now ramps down over the decay window like a scalar gain.
  
  `sampleGainAtTime` follows playback more closely as well. Its decay now starts at the later of the last envelope step and the decay window, as playback schedules it. Before, a last step landing after the decay window opened made the sampled tail fall well ahead of the audio.
- a8591d7: Fix `PlaybackHandle.stop()` clicking instead of fading out. It scheduled the 5 ms fade, then disconnected the voice at once, so the fade never reached the output. The voice now stays connected until its oscillator ends, with a timer as a fallback.
- da1e73d: Fix `SoundManager.register` stranding voices of the sound it replaces. Registering a new definition under a name that was playing left the old voices running where `stop`, `stopAll`, and `unregister` could no longer reach them. `register` (and `registerAll`) now stop the replaced sound first, as `unregister` already did. Registering the same `Sound` instance again leaves it playing.
- a0f9793: Fix two `WavEncoder` details that strict readers notice.
  
  - 8-bit silence now encodes as 128, the unsigned midpoint, rather than 127, which added a small DC offset to every 8-bit file.
  - An odd-sized data chunk, such as 8-bit or 24-bit mono with an odd sample count, is now followed by the zero pad byte RIFF requires, and the RIFF size counts it. The `data` chunk size, and `decodeHeader().dataSize`, still report the unpadded byte count.
- 3465c98: Fix 8-bit WAV export splitting near-silent samples unevenly around the midpoint. Zero sat on a rounding boundary, so any tiny negative sample dropped to 127 while positive ones stayed at 128. 8-bit samples now quantize like 16- and 24-bit, with zero at the centre of its step.
- 63544b4: Fix `downloadWav` naming the file `.wav` when given a blank filename. A whitespace-only name now falls back to `sound.wav` like an empty one.
- 52c1d8b: Fix `WavEncoder.encode` writing an audio buffer's own sample rate to the header unchecked. A fractional rate such as 22050.5 Hz was truncated, and a `NaN` from a hand-made buffer-like object wrote 0 Hz, an unplayable file. The buffer's rate is now rounded to whole Hz, and a rate that is not finite or rounds below 1 Hz throws a `RangeError`. The 8000 Hz floor still applies to the `sampleRate` option only, so low-rate browser buffers keep encoding.
- d5a865e: Fix 32-bit float WAV files omitting header fields the format requires, and make `decodeHeader` read real-world files.
  
  - A 32-bit IEEE float file now carries the 18-byte `fmt ` chunk with its `cbSize` field and the `fact` chunk with the frame count that non-PCM WAVE formats require. Its header is 58 bytes rather than 44, so code that skipped a fixed 44 bytes to reach float samples must read the `data` chunk offset instead. 8, 16, and 24-bit PCM output is unchanged.
  - `decodeHeader` now walks the RIFF chunks rather than reading fixed offsets. It decodes files with `fact`, `LIST`, or other chunks before `data`, which it previously misread.
- 4c86322: Fix 32-bit float WAV export clipping samples to [-1, 1]. Float WAV exists to carry headroom past full scale; samples above it are now written as rendered. 8-, 16- and 24-bit PCM still clip to their integer range.
- 03c2b57: Fix `downloadWav` mistaking a Blob made in another realm (an iframe or worker) for a sound definition and failing to render it. Blobs are now recognised by shape rather than `instanceof Blob`.
- caaf86a: Fix `WavEncoder.encode` writing corrupt headers for option values the WAV format cannot hold, and `decodeHeader` accepting truncated files.
  
  - A fractional `sampleRate` such as 22050.5 wrote a sample rate and byte rate that disagreed. A `sampleRate` or `numChannels` too large for its header field, alone or once multiplied out at the chosen `bitDepth`, silently wrapped. Each now throws a `RangeError` naming the value. `OfflineSoundRenderer.render` rejects a fractional `sampleRate` too, so a render can no longer succeed only for its encode to fail.
  - `decodeHeader` returns `null`, as documented, when the `data` chunk claims more bytes than the buffer holds, rather than reporting the claimed size and duration.
- 820199d: `WavEncoder.encode` now throws a `RangeError` for audio past the 4 GiB RIFF limit instead of writing a header whose sizes wrapped around and that players misread.
- 70305ea: Fix 16- and 24-bit WAV export biasing every sample half a step low. `Math.floor` rounded each scaled sample toward negative infinity, a constant DC offset. Samples now round to the nearest step, as 8-bit export already did.
- 26ae495: Fix `downloadWav` appending `.wav` to a filename that already ends in `.WAV`, which produced `Take1.WAV.wav`.
- 8a1ba19: Fix `evaluateWaveShape` drawing shapes that differ from what the oscillator plays.
  
  - Sawtooth and triangle were half a cycle out of phase with Web Audio's. They started at -1 rather than rising through zero, as the spec defines every built-in shape.
  - Custom partials were divided by the sum of their amplitudes rather than by the series' own peak, the normalization `PeriodicWave` applies. A `[1, 1]` series peaked at 0.88 rather than 1.
- Updated dependencies [f3c0304]
- Updated dependencies [84a8ee4]
- Updated dependencies [de92aa3]
- Updated dependencies [b59c990]
- Updated dependencies [5401cbc]
- Updated dependencies [5fbc6e6]
- Updated dependencies [61dccd1]
- Updated dependencies [73dc8e6]
- Updated dependencies [5c7d389]
- Updated dependencies [18f8020]
- Updated dependencies [8c264f0]
- Updated dependencies [f08794c]
- Updated dependencies [94b8c82]
- Updated dependencies [58b5036]
- Updated dependencies [540fe18]
- Updated dependencies [8a3e865]
- Updated dependencies [406ec7c]
- Updated dependencies [eff0eaf]
- Updated dependencies [6e86fdd]
- Updated dependencies [2d81d74]
- Updated dependencies [bdd710f]
- Updated dependencies [a8591d7]
- Updated dependencies [a76afa9]
- Updated dependencies [da1e73d]
- Updated dependencies [5b79c75]
- Updated dependencies [e5e0b45]
- Updated dependencies [a0f9793]
- Updated dependencies [d5a865e]
- Updated dependencies [caaf86a]
- Updated dependencies [8a1ba19]
  - @rjvr/buzzsaw@4.0.0

## 3.1.0

### Minor Changes

- 2d4cf31: Fix envelope gain ignoring `attack`, and align the gain sampler with what playback schedules.
  
  - `attack` now applies when `gain` is an envelope. It ramps in from silence to the envelope's `start` value instead of jumping straight to it, and yields to a step authored before the attack would end. Gain-envelope sounds began with a click before this; their onset now matches what a scalar gain has always done.
  - `sampleGainAtTime` models the decay exponentially, matching the `exponentialRampToValueAtTime` that playback schedules. It returned a straight line before, diverging from the rendered signal by up to 180x through the decay window, so waveform previews and meters built on it disagreed with what you heard. It now reflects the attack ramp as well, and returns the 0.0001 silence floor rather than 0 at the ends of a voice.
  - An `attack` at least as long as `duration` no longer truncates a voice at full amplitude. It is clamped to leave a 1 ms decay window, so a sound always fades out.
  - `getAudioContextInstance()`, and the `SoundManager.audioContext` getter that reads it, no longer log where Web Audio is absent. A property read spammed the console on every access, including during server-side rendering. Probe with `isAudioContextSupported()` instead.
  - The rejection from `play()` when no `AudioContext` can be created now names the remedy, and the README documents that `play()` can reject at all.
  - Export `AudioBus` and `resolveEnvelopeTiming`, both documented but previously unreachable, along with `AudioContextConstructor` and `OfflineAudioContextConstructor`. `@rjvr/buzzsaw-wav` re-exports core's `OfflineAudioContextConstructor` rather than declaring a second identical type.
  - An empty `SoundManager` now names the fix when `play` rejects a name, instead of reporting `never`. Calling `register` as a separate statement discards the widened type, and the resulting error said only that the name was `not assignable to parameter of type 'never'`. It now reads `not assignable to parameter of type '"no sounds registered; chain .register() or .registerAll() onto the constructor"'`. A manager with sounds registered is unaffected, and a typo still reports the registered names.
  - Document the exports that had none: `clamp`, `round`, `isEnvelope`, `freezeSoundDefinition`, `resolveEnvelopeTiming`, and `AudioBus`.
  - Published tarballs no longer carry `scripts` or `devDependencies`. Neither affects a consumer, but the wav manifest was shipping a `workspace:^` range for core in `devDependencies`.

### Patch Changes

- Updated dependencies [2d4cf31]
  - @rjvr/buzzsaw@3.1.0

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
