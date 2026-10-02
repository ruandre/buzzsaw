---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix `OfflineSoundRenderer.render`, and the `WavExporter` methods built on it, rendering definitions that core rejects. A `gain` above 1 rendered clipped, and an unknown property was silently ignored, so an exported file could sound different from anything `Sound` or `SoundManager` would accept. Rendering now validates first and rejects with core's `SoundValidationError`, whose `errors` array lists every problem.
