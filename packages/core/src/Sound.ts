import type { PlaybackHandle, SoundDefinition, SoundPlaybackOptions } from './types'
import { ensureAudioContextReady } from './audioManager'
import { playSoundFromDefinition } from './soundPlayer'
import { calculateEffectiveDuration, cloneSoundDefinition } from './utils'

export class Sound {
  private _name: string
  private _definition: SoundDefinition
  private _activeHandles: PlaybackHandle[] = []

  constructor(name: string, definition: SoundDefinition) {
    if (!name || typeof name !== 'string') {
      throw new TypeError('Sound name must be a non-empty string.')
    }
    this._name = name
    this._definition = cloneSoundDefinition(definition)
  }

  get name(): string {
    return this._name
  }

  get definition(): Readonly<SoundDefinition> {
    return this._definition
  }

  /** Duration in seconds, including envelope release */
  get duration(): number {
    return calculateEffectiveDuration(this._definition)
  }

  get isPlaying(): boolean {
    return this._activeHandles.some(h => h.isPlaying)
  }

  setDefinition(definition: SoundDefinition): this {
    this._definition = cloneSoundDefinition(definition)
    return this
  }

  /** Plays sound; initializes shared AudioContext if omitted from options */
  async play(options?: SoundPlaybackOptions): Promise<PlaybackHandle> {
    const ctx = options?.audioContext ?? await ensureAudioContextReady()
    const handle = playSoundFromDefinition(ctx, this._definition, options)
    this._activeHandles.push(handle)

    handle.promise.finally(() => {
      this._activeHandles = this._activeHandles.filter(h => h !== handle)
    })

    return handle
  }

  stop(): void {
    for (const handle of this._activeHandles) {
      handle.stop()
    }
    this._activeHandles = []
  }

  /** Clones sound; default name `${name}_copy` */
  clone(newName?: string): Sound {
    return new Sound(
      newName ?? `${this._name}_copy`,
      cloneSoundDefinition(this._definition),
    )
  }

  toJSON(): { name: string, definition: SoundDefinition } {
    return {
      name: this._name,
      definition: cloneSoundDefinition(this._definition),
    }
  }

  static fromJSON(json: { name: string, definition: SoundDefinition }): Sound {
    if (!json || typeof json !== 'object' || !json.name || !json.definition) {
      throw new TypeError('Invalid JSON representation for Sound.')
    }
    return new Sound(json.name, json.definition)
  }
}
