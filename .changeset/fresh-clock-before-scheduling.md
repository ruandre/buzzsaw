---
'@rjvr/buzzsaw': patch
---

Fix short sounds in Firefox that played only partly, or not at all, when the page was busy. Firefox updates `AudioContext.currentTime` only between tasks, so after a long task the clock read stale and a voice was scheduled in the past: its attack, or the whole sound, was already over. `Sound.play` and `SoundManager.play` now wait one task on a live context before they read the clock, and in Firefox they start the voice 25 ms ahead to cover the render callback the clock can still trail. Other browsers add no latency. An `OfflineAudioContext` passed to `Sound.play` still schedules before `play` returns.
