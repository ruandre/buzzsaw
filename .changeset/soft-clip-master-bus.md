---
'@rjvr/buzzsaw': minor
---

Replace the master bus limiter with a stateless soft clipper. The `DynamicsCompressorNode` limiter behaved differently per browser: in Firefox it cut square and sawtooth voices by up to 9 dB, and it kept quieter sounds turned down for seconds after a loud one. It also applied automatic makeup gain in every browser and muted the first sounds on a fresh bus. The bus now passes audio below -3 dBFS unchanged and bends louder peaks smoothly toward full scale, the same way in every browser. Quiet sounds play about 1.7 dB softer than before in Chromium, because the makeup gain is gone; manager playback now matches `@rjvr/buzzsaw-wav` exports below -3 dBFS. The `limiter` option keeps its name and default.
