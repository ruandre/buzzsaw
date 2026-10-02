---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix `WavEncoder.encode` and `encodeToBlob` labelling every audio buffer as 44100 Hz when no `sampleRate` was given. A 48 kHz buffer, the usual rate of a browser `AudioContext`, came out about 8% slow and flat. The header now carries the buffer's own rate unless `sampleRate` overrides it. Raw `Float32Array[]` input still defaults to 44100 Hz.

The `sampleRate` docs now state that encoding writes the rate into the header without resampling.
