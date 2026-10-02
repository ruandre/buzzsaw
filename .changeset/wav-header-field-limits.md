---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix `WavEncoder.encode` writing corrupt headers for option values the WAV format cannot hold, and `decodeHeader` accepting truncated files.

- A fractional `sampleRate` such as 22050.5 wrote a sample rate and byte rate that disagreed. A `sampleRate` or `numChannels` too large for its header field, alone or once multiplied out at the chosen `bitDepth`, silently wrapped. Each now throws a `RangeError` naming the value. `OfflineSoundRenderer.render` rejects a fractional `sampleRate` too, so a render can no longer succeed only for its encode to fail.
- `decodeHeader` returns `null`, as documented, when the `data` chunk claims more bytes than the buffer holds, rather than reporting the claimed size and duration.
