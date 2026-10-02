---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

`playSoundFromDefinition` no longer throws on a `NaN` or infinite `frequency`, `gain`, or envelope `start`. It handed those values straight to the oscillator and gain node, and Web Audio rejects non-finite values with a `TypeError`, after the voice was already connected. They now fall back to the same defaults `sampleFrequencyAtTime` and `sampleGainAtTime` report, as the README promises for this unvalidated entry point.
