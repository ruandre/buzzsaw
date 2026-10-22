import type { BaseAudioContextLike } from './webAudio.js'
import { GECKO_START_LEAD_S } from './constants.js'

// Firefox for iOS runs WebKit and reports FxiOS, so it does not match
const GECKO_ENGINE = /\bFirefox\//

export function isOfflineContext(audioContext: BaseAudioContextLike): boolean {
  return 'startRendering' in audioContext
}

/**
 * Time to start a voice on a live context. Gecko updates `currentTime` only between tasks,
 * so after a busy task it reads stale and a voice scheduled there starts partly in the past:
 * yield one task, then lead past the render callback the clock can still trail
 */
export async function resolveLiveStartTime(audioContext: BaseAudioContextLike): Promise<number> {
  await yieldTask()
  return audioContext.currentTime + (isGecko() ? GECKO_START_LEAD_S : 0)
}

// MessageChannel skips the 4 ms clamp nested setTimeout calls get
function yieldTask(): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    channel.port1.onmessage = () => {
      channel.port1.close()
      resolve()
    }
    channel.port2.postMessage(null)
  })
}

// No feature exposes how currentTime updates, so engine detection is the only signal
function isGecko(): boolean {
  return GECKO_ENGINE.test(globalThis.navigator?.userAgent ?? '')
}
