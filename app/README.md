# @rjvr/buzzsaw-app

Buzzsaw Studio: the web front end for [`@rjvr/buzzsaw`](https://github.com/ruandre/buzzsaw/tree/main/packages/core#readme) and [`@rjvr/buzzsaw-wav`](https://github.com/ruandre/buzzsaw/tree/main/packages/wav#readme).

Live at **[ruandre.github.io/buzzsaw](https://ruandre.github.io/buzzsaw/)**.

## Views

- **Presets**: browse and audition the 113 built-in sounds by category.
- **Synth**: edit a `SoundDefinition` against a live oscilloscope, then copy it as code or export a `.wav`.
- **AI**: describe a sound in words. Uses the browser's built-in Prompt API where available, and a deterministic local heuristic otherwise.
- **Library**: your saved sounds, kept in `localStorage` and importable or exportable as a sound pack.
- **Docs**: the API reference, rendered in-app.

Nothing leaves the browser. Synthesis, rendering, and sound design all run on-device.

## Development

Run from the repository root:

```bash
just dev     # start the dev server
just build   # typecheck and build every workspace
just ci      # lint, typecheck, test, build
```

Vite and `vue-tsc` resolve `@rjvr/buzzsaw` and `@rjvr/buzzsaw-wav` to package **source**, not `dist`, so library edits hot-reload without a rebuild.

## Stack

Vue 3, Pinia, Vue Router, UnoCSS, Reka UI, Vite.

State lives in `src/stores/`. In a WebMCP-capable browser the Studio registers tools on `document.modelContext`, or `navigator.modelContext` where that is absent, letting an in-browser agent list presets, play them, and design new ones. See `src/utils/webmcp.ts`.

## License

[MIT](../LICENSE)
