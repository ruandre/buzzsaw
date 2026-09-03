import type { PlaybackHandle, SoundDefinition, SoundManagerOptions, SoundPlaybackOptions } from './types'
import { AudioBus } from './audioBus'
import { ensureAudioContextReady, getAudioContextInstance } from './audioManager'
import { MASTER_VOLUME_MAX, MASTER_VOLUME_MIN } from './constants'
import { clamp, finiteOr } from './numeric'
import { Sound } from './Sound'

export class SoundManager {
  private _sounds: Map<string, Sound> = new Map()
  private _audioContext: AudioContext | null = null
  private _masterVolume: number = 1.0
  private readonly _useLimiter: boolean
  private _bus: AudioBus | null = null
  private _busContext: BaseAudioContext | null = null

  constructor(options: SoundManagerOptions = {}) {
    this._masterVolume = clampMasterVolume(options.masterVolume ?? 1.0)
    this._audioContext = options.audioContext ?? null
    this._useLimiter = options.limiter ?? false
  }

  get masterVolume(): number {
    return this._masterVolume
  }

  /** Master volume multiplier [0..2]; affects active playback immediately */
  set masterVolume(value: number) {
    this._masterVolume = clampMasterVolume(value)
    if (this._bus && this._busContext) {
      this._bus.setVolume(this._masterVolume, this._busContext.currentTime)
    }
  }

  /** Peak amplitude [0..1] leaving master bus; 0 if unmetered */
  get outputLevel(): number {
    return this._bus?.readPeakLevel() ?? 0
  }

  get audioContext(): AudioContext | null {
    return this._audioContext ?? getAudioContextInstance()
  }

  get size(): number {
    return this._sounds.size
  }

  register(name: string, definitionOrSound: SoundDefinition | Sound): Sound {
    if (!name || typeof name !== 'string') {
      throw new TypeError('Invalid sound name provided.')
    }

    const sound = definitionOrSound instanceof Sound
      ? (definitionOrSound.name === name ? definitionOrSound : definitionOrSound.clone(name))
      : new Sound(name, definitionOrSound)

    this._sounds.set(name, sound)
    return sound
  }

  registerAll(sounds: Record<string, SoundDefinition | Sound>): this {
    for (const [name, def] of Object.entries(sounds)) {
      this.register(name, def)
    }
    return this
  }

  /** Stops and unregisters sound by name */
  unregister(name: string): boolean {
    const sound = this._sounds.get(name)
    if (sound) {
      sound.stop()
      return this._sounds.delete(name)
    }
    return false
  }

  get(name: string): Sound | undefined {
    return this._sounds.get(name)
  }

  has(name: string): boolean {
    return this._sounds.has(name)
  }

  keys(): IterableIterator<string> {
    return this._sounds.keys()
  }

  values(): IterableIterator<Sound> {
    return this._sounds.values()
  }

  entries(): IterableIterator<[string, Sound]> {
    return this._sounds.entries()
  }

  [Symbol.iterator](): IterableIterator<[string, Sound]> {
    return this._sounds.entries()
  }

  list(): string[] {
    return Array.from(this._sounds.keys())
  }

  getAll(): Sound[] {
    return Array.from(this._sounds.values())
  }

  forEach(callback: (sound: Sound, name: string, manager: SoundManager) => void): void {
    for (const [name, sound] of this._sounds.entries()) {
      callback(sound, name, this)
    }
  }

  find(predicate: (sound: Sound, name: string) => boolean): Sound | undefined {
    for (const [name, sound] of this._sounds.entries()) {
      if (predicate(sound, name)) {
        return sound
      }
    }
    return undefined
  }

  filter(predicate: (sound: Sound, name: string) => boolean): Sound[] {
    const results: Sound[] = []
    for (const [name, sound] of this._sounds.entries()) {
      if (predicate(sound, name)) {
        results.push(sound)
      }
    }
    return results
  }

  /** Plays via master bus unless destination provided; null if not found */
  async play(name: string, options?: SoundPlaybackOptions): Promise<PlaybackHandle | null> {
    const sound = this._sounds.get(name)
    if (!sound) {
      console.error(`Sound "${name}" not found in SoundManager registry.`)
      return null
    }

    const audioContext = options?.audioContext ?? this._audioContext ?? await ensureAudioContextReady()

    return sound.play({
      ...options,
      audioContext,
      destination: options?.destination ?? this.resolveBus(audioContext).input,
    })
  }

  // Master bus is scoped to audioContext and recreated when context changes
  private resolveBus(audioContext: BaseAudioContext): AudioBus {
    if (this._bus && this._busContext === audioContext) {
      return this._bus
    }

    this._bus?.dispose()
    this._bus = new AudioBus(audioContext, this._useLimiter)
    this._busContext = audioContext
    this._bus.setVolume(this._masterVolume, audioContext.currentTime)
    return this._bus
  }

  stopAll(): void {
    for (const sound of this._sounds.values()) {
      sound.stop()
    }
  }

  clear(): void {
    this.stopAll()
    this._sounds.clear()
  }

  /** Stops playback, clears registry, and disconnects master bus */
  dispose(): void {
    this.clear()
    this._bus?.dispose()
    this._bus = null
    this._busContext = null
  }
}

function clampMasterVolume(value: number): number {
  return clamp(finiteOr(value, 1.0), MASTER_VOLUME_MIN, MASTER_VOLUME_MAX)
}
