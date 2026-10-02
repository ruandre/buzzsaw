---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix `SoundManager.play` skipping the resume step for a context passed as `audioContext`. Only the shared singleton was resumed, so a context created before any user gesture stayed suspended and every sound played silently. `play` now resumes the given context too, and rejects if that context is closed, as it already did for the shared one.
