import type { AudioContextConstructor, AudioContextLike } from './webAudio.js'

interface AudioContextGlobals {
  AudioContext?: AudioContextConstructor
  webkitAudioContext?: AudioContextConstructor
}

let sharedAudioContext: AudioContextLike | null = null
let hasLoggedSuspendedWarning = false
const pendingResumes = new WeakMap<AudioContextLike, Promise<AudioContextLike>>()

/** Returns AudioContext constructor with webkit prefix fallback; null if Web Audio is absent */
export function getAudioContextClass(): AudioContextConstructor | null {
  const scope = globalThis as AudioContextGlobals
  return scope.AudioContext ?? scope.webkitAudioContext ?? null
}

export function isAudioContextSupported(): boolean {
  return getAudioContextClass() !== null
}

/**
 * Shared AudioContext singleton, created on first use; returns null without logging
 * where Web Audio is absent, so probe with `isAudioContextSupported()`
 */
export function getAudioContextInstance(): AudioContextLike | null {
  if (sharedAudioContext) {
    return sharedAudioContext
  }

  const AudioContextClass = getAudioContextClass()
  if (!AudioContextClass) {
    return null
  }

  try {
    sharedAudioContext = new AudioContextClass({ latencyHint: 'interactive' })
    hasLoggedSuspendedWarning = false
    return sharedAudioContext
  }
  catch (e) {
    console.error('Failed to create AudioContext:', e)
    return null
  }
}

/** Replaces the shared singleton without closing it; caller disposes what it displaces */
export function setAudioContextInstance(ctx: AudioContextLike | null): void {
  sharedAudioContext = ctx
  hasLoggedSuspendedWarning = false
}

/** Closes and clears the shared singleton; the next play call creates a fresh one */
export async function closeAudioContext(): Promise<void> {
  if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
    try {
      await sharedAudioContext.close()
    }
    catch (e) {
      console.error('Error closing AudioContext:', e)
    }
  }
  sharedAudioContext = null
  hasLoggedSuspendedWarning = false
}

/** Resumes suspended AudioContext; concurrent calls share pending attempt */
export function ensureAudioContextReady(customCtx?: AudioContextLike): Promise<AudioContextLike> {
  const ctx = customCtx ?? getAudioContextInstance()

  if (!ctx) {
    return Promise.reject(new Error(
      'AudioContext not supported or failed to create. Outside the browser, pass a polyfill '
      + 'context to setAudioContextInstance(), for example from node-web-audio-api, or render '
      + 'offline with @rjvr/buzzsaw-wav.',
    ))
  }
  if (ctx.state === 'running') {
    return Promise.resolve(ctx)
  }
  if (ctx.state === 'closed') {
    return Promise.reject(new Error('AudioContext is closed and cannot be resumed.'))
  }

  if (!hasLoggedSuspendedWarning) {
    console.warn('AudioContext is suspended. User interaction (like a click) is needed to start audio.')
    hasLoggedSuspendedWarning = true
  }

  const pending = pendingResumes.get(ctx)
  if (pending) {
    return pending
  }

  // Timeout prevents hanging if browser blocks resume without user gesture
  const resume = Promise.race([
    ctx.resume().then(() => ctx),
    new Promise<AudioContextLike>((resolve) => {
      setTimeout(resolve, 500, ctx)
    }),
  ])
    .then((resolvedCtx) => {
      pendingResumes.delete(ctx)
      if (resolvedCtx.state === 'running') {
        hasLoggedSuspendedWarning = false
      }
      return resolvedCtx
    })
    .catch((err) => {
      pendingResumes.delete(ctx)
      console.error('Error resuming AudioContext:', err)
      throw err
    })

  pendingResumes.set(ctx, resume)
  return resume
}
