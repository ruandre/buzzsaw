---
'@rjvr/buzzsaw': patch
---

Fix a stopped sound jumping in level before its fade-out. `stop` cancelled the envelope and then read the gain's level, which some engines report as the value before the cancelled ramp or as the node's intrinsic 1. The fade now starts from the level that was sounding: it uses `cancelAndHoldAtTime` where the engine has it, and otherwise reads the level before cancelling. `AudioParamLike` gains the optional `cancelAndHoldAtTime`.
