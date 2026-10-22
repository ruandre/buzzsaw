---
'@rjvr/buzzsaw': patch
---

Fix `Sound.stop` missing a `SoundManager.play` of that sound still waiting for the context to resume. The voice started after the `stop`. That `play` now resolves to `null`, as it already did for `stopAll`, `unregister` and re-registering the name.
