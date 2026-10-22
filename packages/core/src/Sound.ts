import type { AudioContextLike, PlaybackHandle, SoundDefinition, StandaloneSoundOptions } from './types.js'
import { ensureAudioContextReady, isAudioContextRunning } from './audioManager.js'
import { isOfflineContext, resolveLiveStartTime } from './contextClock.js'
import { playSoundAt } from './soundPlayer.js'
import { SoundValidationError } from './SoundValidationError.js'
import { calculateEffectiveDuration, cloneSoundDefinition, freezeSoundDefinition } from './utils.js'
import { validateSoundDefinition } from './validation.js'

const STOPPED_HANDLE: PlaybackHandle = Object.freeze({
  stop: () => {},
  isPlaying: false,
  promise: Promise.resolve(),
})

// Bumped by `stop`; module-scoped so SoundManager can cancel a play it holds while awaiting the context
const stopGenerations = new WeakMap<Sound, number>()

/** Package-internal; deliberately not exported from the entry point */
export function stopGenerationOf(sound: Sound): number {
  return stopGenerations.get(sound) ?? 0
}

export class Sound {
  readonly #name: string
  #definition: Readonly<SoundDefinition>
  #activeHandles: PlaybackHandle[] = []

  /** Throws SoundValidationError if the definition is malformed */
  constructor(name: string, definition: SoundDefinition) {
    if (!name || typeof name !== 'string') {
      throw new TypeError('Sound name must be a non-empty string.')
    }
    this.#name = name
    this.#definition = adopt(name, definition)
  }

  get name(): string {
    return this.#name
  }

  /** Deeply frozen; use `cloneSoundDefinition` to obtain an editable copy */
  get definition(): Readonly<SoundDefinition> {
    return this.#definition
  }

  /** Total playback length in seconds, matching `calculateEffectiveDuration` */
  get duration(): number {
    return calculateEffectiveDuration(this.#definition)
  }

  get isPlaying(): boolean {
    return this.#activeHandles.some(h => h.isPlaying)
  }

  /** Throws SoundValidationError if the definition is malformed */
  setDefinition(definition: SoundDefinition): this {
    this.#definition = adopt(this.#name, definition)
    return this
  }

  /**
   * Initializes and resumes the shared AudioContext when options omit one.
   * Resolves to a never-played handle if `stop` runs before the voice is scheduled, or if the
   * shared context is still not running about 500 ms after the call, as before a user gesture;
   * the play is dropped, not queued. A context passed in options plays in any state.
   * A live context schedules after one task, so it reads a fresh clock; an offline one
   * schedules before `play` returns, so `startRendering` may follow it directly.
   */
  async play(options?: StandaloneSoundOptions): Promise<PlaybackHandle> {
    const stopGeneration = stopGenerationOf(this)
    const ctx = options?.audioContext ?? await this.#awaitSharedContext()
    if (!ctx) {
      return STOPPED_HANDLE
    }
    const startTime = isOfflineContext(ctx) ? ctx.currentTime : await resolveLiveStartTime(ctx)
    if (stopGenerationOf(this) !== stopGeneration) {
      return STOPPED_HANDLE
    }
    const handle = playSoundAt(ctx, this.#definition, startTime, options)
    this.#activeHandles.push(handle)

    handle.promise.finally(() => {
      this.#activeHandles = this.#activeHandles.filter(h => h !== handle)
    })

    return handle
  }

  // A caller's own context may be an OfflineAudioContext, suspended by design until rendering starts
  async #awaitSharedContext(): Promise<AudioContextLike | null> {
    const ctx = await ensureAudioContextReady()
    return isAudioContextRunning(ctx) ? ctx : null
  }

  /** Also cancels plays still awaiting the context */
  stop(): void {
    stopGenerations.set(this, stopGenerationOf(this) + 1)
    for (const handle of this.#activeHandles) {
      handle.stop()
    }
    this.#activeHandles = []
  }

  /** Default name is `${name}_copy` */
  clone(newName?: string): Sound {
    return new Sound(
      newName ?? `${this.#name}_copy`,
      cloneSoundDefinition(this.#definition),
    )
  }

  toJSON(): { name: string, definition: SoundDefinition } {
    return {
      name: this.#name,
      definition: cloneSoundDefinition(this.#definition),
    }
  }

  static fromJSON(json: { name: string, definition: SoundDefinition }): Sound {
    if (!json || typeof json !== 'object' || !json.name || !json.definition) {
      throw new TypeError('Invalid JSON representation for Sound.')
    }
    return new Sound(json.name, json.definition)
  }
}

function adopt(name: string, definition: SoundDefinition): Readonly<SoundDefinition> {
  const errors = validateSoundDefinition(definition)
  if (errors.length > 0) {
    throw new SoundValidationError(name, errors)
  }
  return freezeSoundDefinition(cloneSoundDefinition(definition))
}
