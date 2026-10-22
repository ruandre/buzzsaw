---
'@rjvr/buzzsaw-wav': patch
---

Fix `downloadWav` appending `.wav` to a filename that already ends in `.WAV`, which produced `Take1.WAV.wav`.
