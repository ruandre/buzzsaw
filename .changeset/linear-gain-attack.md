---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix gain envelopes with `interpolation: 'linear'` jumping at the end of their attack. Playback ramped in only to the envelope's `start` value, then jumped or bent toward the first step, so an attack that outlasted the first step clicked. `sampleGainAtTime` reported a different curve again. The attack now ramps onto the envelope's own line, and `sampleGainAtTime` reports exactly what plays. Envelopes with `'step'` interpolation and scalar gains are unchanged.
