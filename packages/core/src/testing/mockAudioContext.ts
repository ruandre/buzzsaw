import type { Mock } from 'vitest'
import type { AudioContextLike, AudioContextState } from '../webAudio.js'
import { vi } from 'vitest'

export function createMockAudioContext(options: MockAudioContextOptions = {}): MockAudioContext {
  return buildMockAudioContext(options) as unknown as MockAudioContext
}

function buildMockAudioContext(options: MockAudioContextOptions): MockAudioContextMembers {
  const gainNodes: MockGainNode[] = []
  const oscillators: MockOscillatorNode[] = []

  const context: MockAudioContextMembers = {
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
    state: 'running',
    resume: vi.fn(async () => {
      context.state = 'running'
    }),
    close: vi.fn(async () => {
      context.state = 'closed'
    }),
    gainNodes,
    oscillators,
  }

  return context
}

export interface MockAudioContextOptions {
  currentTime?: number
}

// Explicit types: vitest 4 `Mock` is an alias over unexported types, so inferred returns fail declaration emit (TS2742)
interface MockAudioContextMembers {
  createAnalyser: Mock<() => MockAnalyserNode>
  createDynamicsCompressor: Mock<() => MockCompressorNode>
  createGain: Mock<() => MockGainNode>
  createOscillator: Mock<() => MockOscillatorNode>
  createPeriodicWave: Mock<(real: Float32Array, imag: Float32Array) => { real: Float32Array, imag: Float32Array }>
  currentTime: number
  destination: MockConnectable
  state: AudioContextState
  resume: Mock<() => Promise<void>>
  close: Mock<() => Promise<void>>
  gainNodes: MockGainNode[]
  oscillators: MockOscillatorNode[]
}

// Mock members stay visible, so optional factories such as createAnalyser read as defined
export type MockAudioContext = AudioContextLike & MockAudioContextMembers

interface MockConnectable {
  connect: Mock
  disconnect: Mock
}

interface MockAudioParam {
  cancelScheduledValues: Mock
  exponentialRampToValueAtTime: Mock
  linearRampToValueAtTime: Mock
  setTargetAtTime: Mock
  setValueAtTime: Mock
  value: number
}

export interface MockGainNode extends MockConnectable {
  gain: MockAudioParam
}

export interface MockOscillatorNode extends MockConnectable {
  frequency: MockAudioParam
  onended: (() => void) | null
  setPeriodicWave: Mock
  start: Mock
  stop: Mock
  type: OscillatorType
}

interface MockCompressorNode extends MockConnectable {
  attack: MockAudioParam
  knee: MockAudioParam
  ratio: MockAudioParam
  release: MockAudioParam
  threshold: MockAudioParam
}

interface MockAnalyserNode extends MockConnectable {
  fftSize: number
  smoothingTimeConstant: number
  getFloatTimeDomainData: Mock
}

function createMockAudioParam(value: number): MockAudioParam {
  return {
    cancelScheduledValues: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    setValueAtTime: vi.fn(),
    value,
  }
}

function createMockGain(): MockGainNode {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: createMockAudioParam(1),
  }
}

function createMockOscillator(): MockOscillatorNode {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    frequency: createMockAudioParam(440),
    onended: null,
    setPeriodicWave: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    type: 'sine',
  }
}

function createMockCompressor(): MockCompressorNode {
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

function createMockAnalyser(): MockAnalyserNode {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    fftSize: 2048,
    smoothingTimeConstant: 0,
    getFloatTimeDomainData: vi.fn(),
  }
}
