---
'@rjvr/buzzsaw': patch
---

Fix playback failing for good after the shared context was closed directly, for example with `getAudioContextInstance().close()` instead of `closeAudioContext()`. Every later play rejected with "AudioContext is closed". `getAudioContextInstance` now replaces a closed shared context; a closed context passed in explicitly still rejects.
