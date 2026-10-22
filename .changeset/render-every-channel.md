---
'@rjvr/buzzsaw-wav': patch
---

Fix rendering with `numChannels` above 2 leaving channels silent. Web Audio's speaker up-mix put the mono voice only in the centre channel of a 6-channel render, only in front left and right of a 4-channel one, and only in the first channel of other counts. Every channel now holds the voice, as the `numChannels` documentation promises.
