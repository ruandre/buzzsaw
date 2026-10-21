---
'@rjvr/buzzsaw-wav': patch
---

Fix `downloadWav` naming the file `.wav` when given a blank filename. A whitespace-only name now falls back to `sound.wav` like an empty one.
