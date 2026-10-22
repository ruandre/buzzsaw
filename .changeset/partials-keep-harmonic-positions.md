---
'@rjvr/buzzsaw': patch
---

Fix a non-finite entry in `partials` shifting every later harmonic down one place. Such entries were dropped, so `[1, NaN, 0.5]` played 0.5 on the second harmonic instead of the third; they are now silenced in place.
