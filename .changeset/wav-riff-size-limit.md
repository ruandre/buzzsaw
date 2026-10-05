---
'@rjvr/buzzsaw-wav': patch
---

`WavEncoder.encode` now throws a `RangeError` for audio past the 4 GiB RIFF limit instead of writing a header whose sizes wrapped around and that players misread.
