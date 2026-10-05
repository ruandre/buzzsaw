---
'@rjvr/buzzsaw-wav': patch
---

Fix `downloadWav` mistaking a Blob made in another realm (an iframe or worker) for a sound definition and failing to render it. Blobs are now recognised by shape rather than `instanceof Blob`.
