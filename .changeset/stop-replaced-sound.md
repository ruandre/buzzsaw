---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix `SoundManager.register` stranding voices of the sound it replaces. Registering a new definition under a name that was playing left the old voices running where `stop`, `stopAll`, and `unregister` could no longer reach them. `register` (and `registerAll`) now stop the replaced sound first, as `unregister` already did. Registering the same `Sound` instance again leaves it playing.
