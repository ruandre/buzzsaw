---
'@rjvr/buzzsaw': minor
'@rjvr/buzzsaw-wav': minor
---

Fix envelope gain ignoring `attack`, and align the gain sampler with what playback schedules.

- `attack` now applies when `gain` is an envelope. It ramps in from silence to the envelope's `start` value instead of jumping straight to it, and yields to a step authored before the attack would end. Gain-envelope sounds began with a click before this; their onset now matches what a scalar gain has always done.
- `sampleGainAtTime` models the decay exponentially, matching the `exponentialRampToValueAtTime` that playback schedules. It returned a straight line before, diverging from the rendered signal by up to 180x through the decay window, so waveform previews and meters built on it disagreed with what you heard. It now reflects the attack ramp as well, and returns the 0.0001 silence floor rather than 0 at the ends of a voice.
- An `attack` at least as long as `duration` no longer truncates a voice at full amplitude. It is clamped to leave a 1 ms decay window, so a sound always fades out.
- `getAudioContextInstance()`, and the `SoundManager.audioContext` getter that reads it, no longer log where Web Audio is absent. A property read spammed the console on every access, including during server-side rendering. Probe with `isAudioContextSupported()` instead.
- The rejection from `play()` when no `AudioContext` can be created now names the remedy, and the README documents that `play()` can reject at all.
- Export `AudioBus` and `resolveEnvelopeTiming`, both documented but previously unreachable, along with `AudioContextConstructor` and `OfflineAudioContextConstructor`. `@rjvr/buzzsaw-wav` re-exports core's `OfflineAudioContextConstructor` rather than declaring a second identical type.
- An empty `SoundManager` now names the fix when `play` rejects a name, instead of reporting `never`. Calling `register` as a separate statement discards the widened type, and the resulting error said only that the name was `not assignable to parameter of type 'never'`. It now reads `not assignable to parameter of type '"no sounds registered; chain .register() or .registerAll() onto the constructor"'`. A manager with sounds registered is unaffected, and a typo still reports the registered names.
- Document the exports that had none: `clamp`, `round`, `isEnvelope`, `freezeSoundDefinition`, `resolveEnvelopeTiming`, and `AudioBus`.
- Published tarballs no longer carry `scripts` or `devDependencies`. Neither affects a consumer, but the wav manifest was shipping a `workspace:^` range for core in `devDependencies`.
