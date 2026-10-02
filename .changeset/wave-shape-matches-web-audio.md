---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix `evaluateWaveShape` drawing shapes that differ from what the oscillator plays.

- Sawtooth and triangle were half a cycle out of phase with Web Audio's. They started at -1 rather than rising through zero, as the spec defines every built-in shape.
- Custom partials were divided by the sum of their amplitudes rather than by the series' own peak, the normalization `PeriodicWave` applies. A `[1, 1]` series peaked at 0.88 rather than 1.
