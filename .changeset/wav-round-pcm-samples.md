---
'@rjvr/buzzsaw-wav': patch
---

Fix 16- and 24-bit WAV export biasing every sample half a step low. `Math.floor` rounded each scaled sample toward negative infinity, a constant DC offset. Samples now round to the nearest step, as 8-bit export already did.
