---
'@rjvr/buzzsaw': patch
---

Fix `SoundManager.registerAll` half-applying a batch with a malformed entry. Entries before the bad one were registered, stopping any sounds they replaced, before the call threw. The whole batch is now validated first, so a throw leaves the manager unchanged.
