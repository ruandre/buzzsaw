---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix a gain envelope with no steps ignoring `decay`. It held its `start` level to the end and then dropped straight to silence, which clicked. It now ramps down over the decay window like a scalar gain.

`sampleGainAtTime` follows playback more closely as well. Its decay now starts at the later of the last envelope step and the decay window, as playback schedules it. Before, a last step landing after the decay window opened made the sampled tail fall well ahead of the audio.
