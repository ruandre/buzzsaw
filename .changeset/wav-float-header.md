---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix 32-bit float WAV files omitting header fields the format requires, and make `decodeHeader` read real-world files.

- A 32-bit IEEE float file now carries the 18-byte `fmt ` chunk with its `cbSize` field and the `fact` chunk with the frame count that non-PCM WAVE formats require. Its header is 58 bytes rather than 44, so code that skipped a fixed 44 bytes to reach float samples must read the `data` chunk offset instead. 8, 16, and 24-bit PCM output is unchanged.
- `decodeHeader` now walks the RIFF chunks rather than reading fixed offsets. It decodes files with `fact`, `LIST`, or other chunks before `data`, which it previously misread.
