---
'@rjvr/buzzsaw': major
---

Drop a play the browser will not let start. Before a user gesture a browser keeps the `AudioContext` suspended with its clock frozen at 0, so a play made then was scheduled at time 0 and sounded seconds later, together with every other queued play, at the first click. Now, if the context is still not running about 500 ms after the call, `SoundManager.play` resolves `null` and `Sound.play` resolves a handle that never plays. `Sound.play` with an `audioContext` in its options plays in any state, so offline rendering is unchanged. To hear early sounds, call `ensureAudioContextReady()` in a user gesture handler such as `pointerdown`.
