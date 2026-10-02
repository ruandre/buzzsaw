---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix `playSoundFromDefinition` leaving a wall-clock fallback timer running on an `OfflineAudioContext`. The render finished in milliseconds while the timer waited out the sound's full duration, holding a Node process or test worker open. Offline contexts now get no fallback timer.
