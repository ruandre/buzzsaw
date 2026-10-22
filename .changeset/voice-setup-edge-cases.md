---
'@rjvr/buzzsaw': patch
---

Fix two edge cases in starting a voice. A schedule the engine rejects, such as a `pitchScale` that pushes the frequency past float range, threw after the voice was already connected, leaving its nodes attached to the output; voices now connect only once scheduling succeeds. A sound longer than about 24.8 days overflowed the wall-clock fallback timer, which then ended it at once; the timer is now capped.
