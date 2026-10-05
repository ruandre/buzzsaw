---
'@rjvr/buzzsaw': patch
---

Fix a `SoundManager` created muted or quiet briefly playing its first sound at full volume. The master bus opened at gain 1 and glided down to `masterVolume`; it now opens at `masterVolume`.
