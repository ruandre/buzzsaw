---
'@rjvr/buzzsaw-wav': patch
---

Fix `WavEncoder.encode` writing an audio buffer's own sample rate to the header unchecked. A fractional rate such as 22050.5 Hz was truncated, and a `NaN` from a hand-made buffer-like object wrote 0 Hz, an unplayable file. The buffer's rate is now rounded to whole Hz, and a rate that is not finite or rounds below 1 Hz throws a `RangeError`. The 8000 Hz floor still applies to the `sampleRate` option only, so low-rate browser buffers keep encoding.
