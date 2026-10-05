---
'@rjvr/buzzsaw-wav': patch
---

Fix 32-bit float WAV export clipping samples to [-1, 1]. Float WAV exists to carry headroom past full scale; samples above it are now written as rendered. 8-, 16- and 24-bit PCM still clip to their integer range.
