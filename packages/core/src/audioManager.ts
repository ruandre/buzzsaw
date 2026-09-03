interface AudioContextGlobals {
  AudioContext?: typeof AudioContext
  webkitAudioContext?: typeof AudioContext
}

let sharedAudioContext: AudioContext | null = null
let hasLoggedSuspendedWarning = false
const pendingResumes = new WeakMap<AudioContext, Promise<AudioContext>>()

/** Returns AudioContext constructor with webkit prefix fallback */
export function getAudioContextClass(): typeof AudioContext | null {
  const scope = globalThis as AudioContextGlobals
  return scope.AudioContext ?? scope.webkitAudioContext ?? null
}

export function isAudioContextSupported(): boolean {
  return getAudioContextClass() !== null
}

/** Shared AudioContext singleton; null if Web Audio unsupported */
export function getAudioContextInstance(): AudioContext | null {
  if (sharedAudioContext) {
    return sharedAudioContext
  }

  const AudioContextClass = getAudioContextClass()
  if (!AudioContextClass) {
    console.error('Web Audio API is not supported in this browser.')
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

export function setAudioContextInstance(ctx: AudioContext | null): void {
  sharedAudioContext = ctx
  hasLoggedSuspendedWarning = false
}

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
export function ensureAudioContextReady(customCtx?: AudioContext): Promise<AudioContext> {
  const ctx = customCtx ?? getAudioContextInstance()

  if (!ctx) {
    return Promise.reject(new Error('AudioContext not supported or failed to create.'))
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
    new Promise<AudioContext>((resolve) => {
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
