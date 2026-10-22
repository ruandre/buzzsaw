---
'@rjvr/buzzsaw': major
---

Reject unknown keys in envelope steps. Validation already rejected unknown top-level and envelope keys, but a step such as `{ value: 0.2, time: 0.1, interpolation: 'linear' }` passed and its extra key had no effect. A step now accepts only `value` and `time`, and any other key is a validation error that names the key and the step index. To migrate, remove every other key from your steps; `interpolation` belongs on the envelope, next to `start` and `steps`.
