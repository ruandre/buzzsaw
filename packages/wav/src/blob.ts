// Keeps published types free of `lib.dom`, matching the same invariant in @rjvr/buzzsaw's webAudio.ts

/** Minimal Blob surface this package produces and consumes */
export interface MinimalBlob {
  readonly size: number
  readonly type: string
  arrayBuffer: () => Promise<ArrayBuffer>
  text: () => Promise<string>
}

/** Host's own `Blob` where declared (`lib.dom`, `@types/node`), keeping results assignable to `URL.createObjectURL`; structural shape otherwise */
export type BlobLike = typeof globalThis extends { Blob: abstract new (...args: never) => infer B }
  ? B
  : MinimalBlob
