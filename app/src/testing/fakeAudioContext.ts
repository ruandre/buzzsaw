import type { AudioContextLike } from '@rjvr/buzzsaw'

/** Running AudioContext stand-in for stores that play through the shared singleton */
export function createFakeAudioContext(): AudioContextLike {
  const node = () => ({ connect: () => {}, disconnect: () => {} })
  const param = (value: number) => ({
    value,
    setValueAtTime: () => {},
    linearRampToValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
    setTargetAtTime: () => {},
    cancelScheduledValues: () => {},
  })

  return {
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    destination: node(),
    createGain: () => ({ ...node(), gain: param(1) }),
    createOscillator: () => ({
      ...node(),
      type: 'sine',
      frequency: param(440),
      onended: null,
      setPeriodicWave: () => {},
      start: () => {},
      stop: () => {},
    }),
    resume: async () => {},
    close: async () => {},
  }
}
