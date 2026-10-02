---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix `Sound.stop` missing a `play` still waiting for the shared context to resume. That `play` started its voice after the `stop`, with nothing left to stop it. It now resolves to a handle that never played, matching how `SoundManager.stopAll` cancels pending plays.
