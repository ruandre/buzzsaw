---
'@rjvr/buzzsaw': patch
---

Fix `closeAudioContext` racing with playback and `setAudioContextInstance`. A context set while the old one was closing was cleared once the close finished, and a play started meanwhile was scheduled on the closing context and never sounded. The shared context is now cleared as soon as closing starts.
