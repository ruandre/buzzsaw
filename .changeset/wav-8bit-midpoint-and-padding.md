---
'@rjvr/buzzsaw': patch
'@rjvr/buzzsaw-wav': patch
---

Fix two `WavEncoder` details that strict readers notice.

- 8-bit silence now encodes as 128, the unsigned midpoint, rather than 127, which added a small DC offset to every 8-bit file.
- An odd-sized data chunk, such as 8-bit or 24-bit mono with an odd sample count, is now followed by the zero pad byte RIFF requires, and the RIFF size counts it. The `data` chunk size, and `decodeHeader().dataSize`, still report the unpadded byte count.
