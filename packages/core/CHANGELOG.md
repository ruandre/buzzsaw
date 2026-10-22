# @rjvr/buzzsaw

## 4.0.0

### Major Changes

- b59c990: Drop a play the browser will not let start. Before a user gesture a browser keeps the `AudioContext` suspended with its clock frozen at 0, so a play made then was scheduled at time 0 and sounded seconds later, together with every other queued play, at the first click. Now, if the context is still not running about 500 ms after the call, `SoundManager.play` resolves `null` and `Sound.play` resolves a handle that never plays. `Sound.play` with an `audioContext` in its options plays in any state, so offline rendering is unchanged. To hear early sounds, call `ensureAudioContextReady()` in a user gesture handler such as `pointerdown`.
- 58b5036: Reject unknown keys in envelope steps. Validation already rejected unknown top-level and envelope keys, but a step such as `{ value: 0.2, time: 0.1, interpolation: 'linear' }` passed and its extra key had no effect. A step now accepts only `value` and `time`, and any other key is a validation error that names the key and the step index. To migrate, remove every other key from your steps; `interpolation` belongs on the envelope, next to `start` and `steps`.

### Minor Changes

- eff0eaf: Replace the master bus limiter with a stateless soft clipper. The `DynamicsCompressorNode` limiter behaved differently per browser: in Firefox it cut square and sawtooth voices by up to 9 dB, and it kept quieter sounds turned down for seconds after a loud one. It also applied automatic makeup gain in every browser and muted the first sounds on a fresh bus. The bus now passes audio below -3 dBFS unchanged and bends louder peaks smoothly toward full scale, the same way in every browser. Quiet sounds play about 1.7 dB softer than before in Chromium, because the makeup gain is gone; manager playback now matches `@rjvr/buzzsaw-wav` exports below -3 dBFS. The `limiter` option keeps its name and default.

### Patch Changes

- f3c0304: Fix the `SoundManager.audioContext` getter creating the shared `AudioContext` when read. Reading a property built a context before any user gesture, which browsers start suspended and warn about, and which costs an audio thread. The getter now returns the context given in the options, otherwise the shared one if it already exists, otherwise `null`. Call `getAudioContextInstance()` or `ensureAudioContextReady()` to create it on purpose.
- 84a8ee4: Fix `SoundManager.play` starting a voice after it was stopped. A `play` still waiting for a suspended context to resume ignored a `stopAll`, `clear`, `dispose`, `unregister`, or re-`register` that ran meanwhile, then started a voice nothing could reach to stop. Such a `play` now resolves to `null` without starting, and without calling `onMissing`.
- de92aa3: Fix `closeAudioContext` racing with playback and `setAudioContextInstance`. A context set while the old one was closing was cleared once the close finished, and a play started meanwhile was scheduled on the closing context and never sounded. The shared context is now cleared as soon as closing starts.
- 5401cbc: `playSoundFromDefinition` no longer throws on a `NaN` or infinite `frequency`, `gain`, or envelope `start`. It handed those values straight to the oscillator and gain node, and Web Audio rejects non-finite values with a `TypeError`, after the voice was already connected. They now fall back to the same defaults `sampleFrequencyAtTime` and `sampleGainAtTime` report, as the README promises for this unvalidated entry point.
- 5fbc6e6: Fix short sounds in Firefox that played only partly, or not at all, when the page was busy. Firefox updates `AudioContext.currentTime` only between tasks, so after a long task the clock read stale and a voice was scheduled in the past: its attack, or the whole sound, was already over. `Sound.play` and `SoundManager.play` now wait one task on a live context before they read the clock, and in Firefox they start the voice 25 ms ahead to cover the render callback the clock can still trail. Other browsers add no latency. An `OfflineAudioContext` passed to `Sound.play` still schedules before `play` returns.
- 61dccd1: Fix `WavEncoder.encode` and `encodeToBlob` labelling every audio buffer as 44100 Hz when no `sampleRate` was given. A 48 kHz buffer, the usual rate of a browser `AudioContext`, came out about 8% slow and flat. The header now carries the buffer's own rate unless `sampleRate` overrides it. Raw `Float32Array[]` input still defaults to 44100 Hz.
  
  The `sampleRate` docs now state that encoding writes the rate into the header without resampling.
- 73dc8e6: Fix gain envelopes with `interpolation: 'linear'` jumping at the end of their attack. Playback ramped in only to the envelope's `start` value, then jumped or bent toward the first step, so an attack that outlasted the first step clicked. `sampleGainAtTime` reported a different curve again. The attack now ramps onto the envelope's own line, and `sampleGainAtTime` reports exactly what plays. Envelopes with `'step'` interpolation and scalar gains are unchanged.
- 5c7d389: Fix a `SoundManager` created muted or quiet briefly playing its first sound at full volume. The master bus opened at gain 1 and glided down to `masterVolume`; it now opens at `masterVolume`.
- 18f8020: Fix `playSoundFromDefinition` leaving a wall-clock fallback timer running on an `OfflineAudioContext`. The render finished in milliseconds while the timer waited out the sound's full duration, holding a Node process or test worker open. Offline contexts now get no fallback timer.
- 8c264f0: Fix `OfflineSoundRenderer.render`, and the `WavExporter` methods built on it, rendering definitions that core rejects. A `gain` above 1 rendered clipped, and an unknown property was silently ignored, so an exported file could sound different from anything `Sound` or `SoundManager` would accept. Rendering now validates first and rejects with core's `SoundValidationError`, whose `errors` array lists every problem.
- f08794c: Fix a non-finite entry in `partials` shifting every later harmonic down one place. Such entries were dropped, so `[1, NaN, 0.5]` played 0.5 on the second harmonic instead of the third; they are now silenced in place.
- 94b8c82: Fix `SoundManager.registerAll` half-applying a batch with a malformed entry. Entries before the bad one were registered, stopping any sounds they replaced, before the call threw. The whole batch is now validated first, so a throw leaves the manager unchanged.
- 540fe18: Fix playback failing for good after the shared context was closed directly, for example with `getAudioContextInstance().close()` instead of `closeAudioContext()`. Every later play rejected with "AudioContext is closed". `getAudioContextInstance` now replaces a closed shared context; a closed context passed in explicitly still rejects.
- 8a3e865: Fix `require('@rjvr/buzzsaw')` and `require('@rjvr/buzzsaw-wav')` failing with `ERR_PACKAGE_PATH_NOT_EXPORTED` on Node versions that load ES modules through `require`. The export maps offered only an `import` condition; they now use `default`, and expose `package.json` for tools that read it.
- 406ec7c: Fix `SoundManager.play` skipping the resume step for a context passed as `audioContext`. Only the shared singleton was resumed, so a context created before any user gesture stayed suspended and every sound played silently. `play` now resumes the given context too, and rejects if that context is closed, as it already did for the shared one.
- 6e86fdd: Fix `Sound.stop` missing a `SoundManager.play` of that sound still waiting for the context to resume. The voice started after the `stop`. That `play` now resolves to `null`, as it already did for `stopAll`, `unregister` and re-registering the name.
- 2d81d74: Fix `Sound.stop` missing a `play` still waiting for the shared context to resume. That `play` started its voice after the `stop`, with nothing left to stop it. It now resolves to a handle that never played, matching how `SoundManager.stopAll` cancels pending plays.
- bdd710f: Fix a gain envelope with no steps ignoring `decay`. It held its `start` level to the end and then dropped straight to silence, which clicked. It now ramps down over the decay window like a scalar gain.
  
  `sampleGainAtTime` follows playback more closely as well. Its decay now starts at the later of the last envelope step and the decay window, as playback schedules it. Before, a last step landing after the decay window opened made the sampled tail fall well ahead of the audio.
- a8591d7: Fix `PlaybackHandle.stop()` clicking instead of fading out. It scheduled the 5 ms fade, then disconnected the voice at once, so the fade never reached the output. The voice now stays connected until its oscillator ends, with a timer as a fallback.
- a76afa9: Fix a stopped sound jumping in level before its fade-out. `stop` cancelled the envelope and then read the gain's level, which some engines report as the value before the cancelled ramp or as the node's intrinsic 1. The fade now starts from the level that was sounding: it uses `cancelAndHoldAtTime` where the engine has it, and otherwise reads the level before cancelling. `AudioParamLike` gains the optional `cancelAndHoldAtTime`.
- da1e73d: Fix `SoundManager.register` stranding voices of the sound it replaces. Registering a new definition under a name that was playing left the old voices running where `stop`, `stopAll`, and `unregister` could no longer reach them. `register` (and `registerAll`) now stop the replaced sound first, as `unregister` already did. Registering the same `Sound` instance again leaves it playing.
- 5b79c75: Fix a voice going silent when its context suspends mid-play, as when a tab is backgrounded or iOS interrupts audio. The wall-clock fallback that ends a voice whose `onended` never fires disconnected it on schedule, so the rest of the sound played into nothing after the context resumed. The fallback now waits while the context is suspended or interrupted.
- e5e0b45: Fix two edge cases in starting a voice. A schedule the engine rejects, such as a `pitchScale` that pushes the frequency past float range, threw after the voice was already connected, leaving its nodes attached to the output; voices now connect only once scheduling succeeds. A sound longer than about 24.8 days overflowed the wall-clock fallback timer, which then ended it at once; the timer is now capped.
- a0f9793: Fix two `WavEncoder` details that strict readers notice.
  
  - 8-bit silence now encodes as 128, the unsigned midpoint, rather than 127, which added a small DC offset to every 8-bit file.
  - An odd-sized data chunk, such as 8-bit or 24-bit mono with an odd sample count, is now followed by the zero pad byte RIFF requires, and the RIFF size counts it. The `data` chunk size, and `decodeHeader().dataSize`, still report the unpadded byte count.
- d5a865e: Fix 32-bit float WAV files omitting header fields the format requires, and make `decodeHeader` read real-world files.
  
  - A 32-bit IEEE float file now carries the 18-byte `fmt ` chunk with its `cbSize` field and the `fact` chunk with the frame count that non-PCM WAVE formats require. Its header is 58 bytes rather than 44, so code that skipped a fixed 44 bytes to reach float samples must read the `data` chunk offset instead. 8, 16, and 24-bit PCM output is unchanged.
  - `decodeHeader` now walks the RIFF chunks rather than reading fixed offsets. It decodes files with `fact`, `LIST`, or other chunks before `data`, which it previously misread.
- caaf86a: Fix `WavEncoder.encode` writing corrupt headers for option values the WAV format cannot hold, and `decodeHeader` accepting truncated files.
  
  - A fractional `sampleRate` such as 22050.5 wrote a sample rate and byte rate that disagreed. A `sampleRate` or `numChannels` too large for its header field, alone or once multiplied out at the chosen `bitDepth`, silently wrapped. Each now throws a `RangeError` naming the value. `OfflineSoundRenderer.render` rejects a fractional `sampleRate` too, so a render can no longer succeed only for its encode to fail.
  - `decodeHeader` returns `null`, as documented, when the `data` chunk claims more bytes than the buffer holds, rather than reporting the claimed size and duration.
- 8a1ba19: Fix `evaluateWaveShape` drawing shapes that differ from what the oscillator plays.
  
  - Sawtooth and triangle were half a cycle out of phase with Web Audio's. They started at -1 rather than rising through zero, as the spec defines every built-in shape.
  - Custom partials were divided by the sum of their amplitudes rather than by the series' own peak, the normalization `PeriodicWave` applies. A `[1, 1]` series peaked at 0.88 rather than 1.

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

## 1.0.0

### Major Changes

- Initial release.
