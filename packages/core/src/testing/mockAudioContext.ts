import type { AudioContextState, BaseAudioContextLike } from '../webAudio.js'
import { vi } from 'vitest'

export function createMockAudioContext(options: MockAudioContextOptions = {}): MockAudioContext {
  const gainNodes: MockGainNode[] = []
  const oscillators: MockOscillatorNode[] = []

  const context = {
    createAnalyser: vi.fn(() => createMockAnalyser()),
    createDynamicsCompressor: vi.fn(() => createMockCompressor()),
    createGain: vi.fn(() => {
      const node = createMockGain()
      gainNodes.push(node)
      return node
    }),
    createOscillator: vi.fn(() => {
      const node = createMockOscillator()
      oscillators.push(node)
      return node
    }),
    createPeriodicWave: vi.fn((real: Float32Array, imag: Float32Array) => ({ real, imag })),
    currentTime: options.currentTime ?? 0,
    destination: { connect: vi.fn(), disconnect: vi.fn() },
    state: 'running' as AudioContextState,
    gainNodes,
    oscillators,
  }

  return context as unknown as MockAudioContext
}

export interface MockAudioContextOptions {
  currentTime?: number
}

export type MockAudioContext = BaseAudioContextLike & {
  gainNodes: MockGainNode[]
  oscillators: MockOscillatorNode[]
}

export type MockGainNode = ReturnType<typeof createMockGain>
export type MockOscillatorNode = ReturnType<typeof createMockOscillator>

function createMockAudioParam(value: number) {
  return {
    cancelScheduledValues: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    setValueAtTime: vi.fn(),
    value,
  }
}

function createMockGain() {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: createMockAudioParam(1),
  }
}

function createMockOscillator() {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    frequency: createMockAudioParam(440),
    onended: null as (() => void) | null,
    setPeriodicWave: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    type: 'sine' as OscillatorType,
  }
}

function createMockCompressor() {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    attack: createMockAudioParam(0),
    knee: createMockAudioParam(0),
    ratio: createMockAudioParam(1),
    release: createMockAudioParam(0),
    threshold: createMockAudioParam(0),
  }
}

function createMockAnalyser() {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    fftSize: 2048,
    smoothingTimeConstant: 0,
    getFloatTimeDomainData: vi.fn(),
  }
}
