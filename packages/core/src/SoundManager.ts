import type {
  AudioContextLike,
  BaseAudioContextLike,
  PlaybackHandle,
  SoundDefinition,
  SoundManagerOptions,
  SoundPlaybackOptions,
} from './types.js'
import { AudioBus } from './audioBus.js'
import { ensureAudioContextReady, peekAudioContextInstance } from './audioManager.js'
import { MASTER_VOLUME_MAX, MASTER_VOLUME_MIN } from './constants.js'
import { Sound, stopGenerationOf } from './Sound.js'

/** Sounds a manager can be given, keyed by the names `play` will accept */
export type SoundRegistrations = Record<string, SoundDefinition | Sound>

type NamesOf<T extends SoundRegistrations> = Extract<keyof T, string>

// `never` rejects every name but says nothing; name the fix in the type a caller sees instead
type PlayableName<Name extends string>
  = [Name] extends [never] ? 'no sounds registered; chain .register() or .registerAll() onto the constructor' : Name

/**
 * Registry of named sounds sharing a master bus, volume, and audio context.
 *
 * `Name` is the set of keys `play` accepts, and widens as sounds are registered:
 * `new SoundManager().registerAll(DEFAULT_SOUNDS)` is typed over the preset names,
 * so typos fail to compile. Registering as a separate statement discards that widening,
 * and `play` then rejects every name. Use `new SoundManager<string>()` where names are dynamic.
 */
export class SoundManager<Name extends string = never> {
  #sounds: Map<Name, Sound> = new Map()
  #audioContext: AudioContextLike | null = null
  #masterVolume: number = 1.0
  readonly #useLimiter: boolean
  readonly #onMissing: (name: string) => void
  #bus: AudioBus | null = null
  #busContext: BaseAudioContextLike | null = null

  constructor(options: SoundManagerOptions = {}) {
    this.#masterVolume = requireMasterVolume(options.masterVolume)
    this.#audioContext = options.audioContext ?? null
    this.#useLimiter = options.limiter ?? true
    this.#onMissing = options.onMissing ?? logMissingSound
  }

  get masterVolume(): number {
    return this.#masterVolume
  }

  /** Master volume multiplier [0..2]; affects active playback immediately */
  set masterVolume(value: number) {
    this.#masterVolume = requireMasterVolume(value)
    if (this.#bus && this.#busContext) {
      this.#bus.setVolume(this.#masterVolume, this.#busContext.currentTime)
    }
  }

  /** Peak amplitude [0..1] on the master bus; 0 before the first `play` or without an analyser node */
  get outputLevel(): number {
    return this.#bus?.readPeakLevel() ?? 0
  }

  /** Context this manager plays on; null until the shared one is created by playback or `getAudioContextInstance` */
  get audioContext(): AudioContextLike | null {
    return this.#audioContext ?? peekAudioContextInstance()
  }

  get size(): number {
    return this.#sounds.size
  }

  /** Adds or replaces one sound, stopping a replaced one, and widens this manager to accept `name`; throws SoundValidationError if malformed */
  register<N extends string>(name: N, definitionOrSound: SoundDefinition | Sound): SoundManager<Name | N> {
    if (!name || typeof name !== 'string') {
      throw new TypeError('Invalid sound name provided.')
    }

    const sound = definitionOrSound instanceof Sound
      ? (definitionOrSound.name === name ? definitionOrSound : definitionOrSound.clone(name))
      : new Sound(name, definitionOrSound)

    const registry = this.#sounds as Map<Name | N, Sound>
    const replaced = registry.get(name)
    // A replaced sound would leave its voices beyond the reach of stop and stopAll
    if (replaced && replaced !== sound) {
      replaced.stop()
    }
    registry.set(name, sound)
    return this as SoundManager<Name | N>
  }

  /** Adds or replaces a map of sounds, returning this manager widened to accept their names */
  registerAll<T extends SoundRegistrations>(sounds: T): SoundManager<Name | NamesOf<T>> {
    for (const [name, def] of Object.entries(sounds)) {
      this.register(name, def)
    }
    return this as SoundManager<Name | NamesOf<T>>
  }

  /** Stops the sound before unregistering it */
  unregister(name: string): boolean {
    const sound = this.#lookup(name)
    if (sound) {
      sound.stop()
      return this.#sounds.delete(name as Name)
    }
    return false
  }

  get(name: string): Sound | undefined {
    return this.#lookup(name)
  }

  has(name: string): boolean {
    return this.#lookup(name) !== undefined
  }

  keys(): IterableIterator<Name> {
    return this.#sounds.keys()
  }

  values(): IterableIterator<Sound> {
    return this.#sounds.values()
  }

  entries(): IterableIterator<[Name, Sound]> {
    return this.#sounds.entries()
  }

  [Symbol.iterator](): IterableIterator<[Name, Sound]> {
    return this.#sounds.entries()
  }

  /** Names in registration order, each accepted by `play` */
  list(): Name[] {
    return Array.from(this.#sounds.keys())
  }

  getAll(): Sound[] {
    return Array.from(this.#sounds.values())
  }

  forEach(callback: (sound: Sound, name: Name, manager: this) => void): void {
    for (const [name, sound] of this.#sounds.entries()) {
      callback(sound, name, this)
    }
  }

  find(predicate: (sound: Sound, name: Name) => boolean): Sound | undefined {
    for (const [name, sound] of this.#sounds.entries()) {
      if (predicate(sound, name)) {
        return sound
      }
    }
    return undefined
  }

  filter(predicate: (sound: Sound, name: Name) => boolean): Sound[] {
    const results: Sound[] = []
    for (const [name, sound] of this.#sounds.entries()) {
      if (predicate(sound, name)) {
        results.push(sound)
      }
    }
    return results
  }

  /**
   * Plays through the master bus. Resolves to null, via `onMissing`, if the name is unregistered.
   * Resolves to null without `onMissing` if, while the context resumes, the name is unregistered
   * or replaced, or the sound is stopped by `stopAll` or its own `stop`.
   */
  async play(name: PlayableName<Name>, options?: SoundPlaybackOptions): Promise<PlaybackHandle | null> {
    const sound = this.#lookup(name)
    if (!sound) {
      this.#onMissing(name)
      return null
    }

    // Unregister, replace, stopAll and a direct `Sound.stop` all stop the sound
    const stopGeneration = stopGenerationOf(sound)
    const audioContext = await ensureAudioContextReady(this.#audioContext ?? undefined)
    if (this.#lookup(name) !== sound || stopGenerationOf(sound) !== stopGeneration) {
      return null
    }

    return sound.play({
      ...options,
      audioContext,
      destination: this.#resolveBus(audioContext).input,
    })
  }

  // `get`, `has` and `unregister` take any string so callers can probe names they have not registered
  #lookup(name: string): Sound | undefined {
    return this.#sounds.get(name as Name)
  }

  // Master bus is scoped to audioContext and recreated when context changes
  #resolveBus(audioContext: BaseAudioContextLike): AudioBus {
    if (this.#bus && this.#busContext === audioContext) {
      return this.#bus
    }

    this.#bus?.dispose()
    this.#bus = new AudioBus(audioContext, this.#useLimiter, this.#masterVolume)
    this.#busContext = audioContext
    return this.#bus
  }

  /** Also cancels plays still awaiting the context */
  stopAll(): void {
    for (const sound of this.#sounds.values()) {
      sound.stop()
    }
  }

  clear(): void {
    this.stopAll()
    this.#sounds.clear()
  }

  /** Stops playback, clears registry, and disconnects master bus */
  dispose(): void {
    this.clear()
    this.#bus?.dispose()
    this.#bus = null
    this.#busContext = null
  }
}

function requireMasterVolume(value: number | undefined): number {
  if (value === undefined) {
    return 1.0
  }
  if (!Number.isFinite(value) || value < MASTER_VOLUME_MIN || value > MASTER_VOLUME_MAX) {
    throw new RangeError(
      `Invalid masterVolume: ${value}. Must be a finite number between ${MASTER_VOLUME_MIN} and ${MASTER_VOLUME_MAX}.`,
    )
  }
  return value
}

function logMissingSound(name: string): void {
  console.error(`Sound "${name}" is not registered in this SoundManager.`)
}
