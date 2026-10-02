---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix the `SoundManager.audioContext` getter creating the shared `AudioContext` when read. Reading a property built a context before any user gesture, which browsers start suspended and warn about, and which costs an audio thread. The getter now returns the context given in the options, otherwise the shared one if it already exists, otherwise `null`. Call `getAudioContextInstance()` or `ensureAudioContextReady()` to create it on purpose.
