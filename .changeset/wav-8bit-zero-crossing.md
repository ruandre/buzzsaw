---
'@rjvr/buzzsaw-wav': patch
---

Fix 8-bit WAV export splitting near-silent samples unevenly around the midpoint. Zero sat on a rounding boundary, so any tiny negative sample dropped to 127 while positive ones stayed at 128. 8-bit samples now quantize like 16- and 24-bit, with zero at the centre of its step.
