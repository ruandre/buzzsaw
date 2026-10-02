---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix `SoundManager.play` starting a voice after it was stopped. A `play` still waiting for a suspended context to resume ignored a `stopAll`, `clear`, `dispose`, `unregister`, or re-`register` that ran meanwhile, then started a voice nothing could reach to stop. Such a `play` now resolves to `null` without starting, and without calling `onMissing`.
