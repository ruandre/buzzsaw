import type { PlaybackHandle, SoundDefinition, StandaloneSoundOptions } from './types.js'
import { ensureAudioContextReady } from './audioManager.js'
import { playSoundFromDefinition } from './soundPlayer.js'
import { SoundValidationError } from './SoundValidationError.js'
import { calculateEffectiveDuration, cloneSoundDefinition, freezeSoundDefinition } from './utils.js'
import { validateSoundDefinition } from './validation.js'

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

  /** Initializes and resumes the shared AudioContext when options omit one */
  async play(options?: StandaloneSoundOptions): Promise<PlaybackHandle> {
    const ctx = options?.audioContext ?? await ensureAudioContextReady()
    const handle = playSoundFromDefinition(ctx, this.#definition, options)
    this.#activeHandles.push(handle)

    handle.promise.finally(() => {
      this.#activeHandles = this.#activeHandles.filter(h => h !== handle)
    })

    return handle
  }

  stop(): void {
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
