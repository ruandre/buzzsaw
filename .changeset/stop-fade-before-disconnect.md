---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix `PlaybackHandle.stop()` clicking instead of fading out. It scheduled the 5 ms fade, then disconnected the voice at once, so the fade never reached the output. The voice now stays connected until its oscillator ends, with a timer as a fallback.
