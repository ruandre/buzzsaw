---
'@rjvr/buzzsaw': patch
---

Fix a voice going silent when its context suspends mid-play, as when a tab is backgrounded or iOS interrupts audio. The wall-clock fallback that ends a voice whose `onended` never fires disconnected it on schedule, so the rest of the sound played into nothing after the context resumed. The fallback now waits while the context is suspended or interrupted.
