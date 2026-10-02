import type { SoundDefinition } from '@rjvr/buzzsaw'
import type { Mock } from 'vitest'
import type { MockAudioContext } from '../../../packages/core/src/testing/mockAudioContext'
import { runInNewContext } from 'node:vm'
import { playSoundFromDefinition } from '@rjvr/buzzsaw'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { buildRegisterAllSnippet, buildSnippets } from '.'
import { createMockAudioContext } from '../../../packages/core/src/testing/mockAudioContext'

const definition: SoundDefinition = { frequency: 440, duration: 0.2 }
const hostileName = `x'); alert(1); ('`

function syntaxErrors(code: string): string[] {
  const { diagnostics = [] } = ts.transpileModule(code, { fileName: 'snippet.ts', reportDiagnostics: true })
  return diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
}

function literalArguments(code: string): string[] {
  const literals: string[] = []
  const visit = (node: ts.Node): void => {
    if ((ts.isCallExpression(node) || ts.isNewExpression(node)) && node.arguments)
      literals.push(...node.arguments.filter(ts.isStringLiteral).map(argument => argument.text))
    ts.forEachChild(node, visit)
  }
  visit(ts.createSourceFile('snippet.ts', code, ts.ScriptTarget.Latest))
  return literals
}

function snippetCode(name: string, id: string): string {
  return buildSnippets(name, definition).find(snippet => snippet.id === id)!.code
}

describe('buildSnippets', () => {
  it('quotes an ordinary name as a plain single-quoted literal', () => {
    const code = snippetCode('laser', 'core')

    expect(code).toContain(`new SoundManager().register('laser', `)
    expect(code).toContain(`await sounds.play('laser')`)
    expect(code).toContain(`const laser = new Sound('laser', `)
  })

  it('names the wav download after an ordinary name', () => {
    expect(snippetCode('laser', 'wav')).toContain(`downloadWav(definition, 'laser.wav')`)
  })

  it('escapes a name that tries to break out of its literal', () => {
    expect(snippetCode(hostileName, 'core')).toContain(`await sounds.play('x\\'); alert(1); (\\'')`)
  })

  it('keeps a hostile name inside each core literal', () => {
    const code = snippetCode(hostileName, 'core')

    expect(syntaxErrors(code)).toEqual([])
    expect(literalArguments(code).filter(literal => literal === hostileName)).toHaveLength(3)
  })

  it('keeps a hostile name inside the wav file name', () => {
    expect(literalArguments(snippetCode(hostileName, 'wav'))).toContain(`${hostileName}.wav`)
  })

  it('keeps the vanilla snippet parseable for a hostile name', () => {
    expect(syntaxErrors(snippetCode(hostileName, 'vanilla'))).toEqual([])
  })

  it.each([`back\\slash`, `double"quote`, 'line\nbreak', 'para\u2028graph'])('keeps %j inside its literal', (name) => {
    expect(literalArguments(snippetCode(name, 'core'))).toContain(name)
  })

  it.each(['class', 'await', 'default'])('avoids the reserved word %s as a variable name', (name) => {
    expect(syntaxErrors(snippetCode(name, 'core'))).toEqual([])
  })

  it.each(['sounds', 'handle', 'Sound', 'SoundManager'])('avoids shadowing the snippet\'s own %s binding', (name) => {
    expect(snippetCode(name, 'core')).toContain(`const _${name} = new Sound('${name}', `)
  })
})

describe('buildRegisterAllSnippet', () => {
  it('plays the first sound by its ordinary name', () => {
    expect(buildRegisterAllSnippet({ laser: definition }).code).toContain(`await sounds.play('laser')`)
  })

  it('keeps a hostile name inside the play literal', () => {
    const { code } = buildRegisterAllSnippet({ [hostileName]: definition })

    expect(syntaxErrors(code)).toEqual([])
    expect(literalArguments(code)).toContain(hostileName)
  })
})

type MockAudioParam = MockAudioContext['oscillators'][number]['frequency']

const AUTOMATION_METHODS = ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime'] as const

// Absorbs float noise from equivalent arithmetic; `+ 0` folds -0
function rounded(values: unknown[]): unknown[] {
  return values.map(value => typeof value === 'number' ? Math.round(value * 1e9) / 1e9 + 0 : value)
}

function automation(param: MockAudioParam): unknown[][] {
  return AUTOMATION_METHODS
    .flatMap(method => param[method].mock.calls.map((args, index) => ({
      order: param[method].mock.invocationCallOrder[index],
      call: rounded([method, ...args]),
    })))
    .sort((a, b) => a.order - b.order)
    .map(({ call }) => call)
}

function recordedSchedule(context: MockAudioContext) {
  const [oscillator] = context.oscillators
  const [gainNode] = context.gainNodes
  return {
    frequency: automation(oscillator.frequency),
    gain: automation(gainNode.gain),
    start: rounded(oscillator.start.mock.calls.flat()),
    stop: rounded(oscillator.stop.mock.calls.flat()),
    type: oscillator.type,
    // vm realm's Float32Array never deep-equals ours
    periodicWaves: context.createPeriodicWave.mock.calls.map(tables => tables.map(table => Array.from(table))),
  }
}

function chainable<Node extends { connect: Mock }>(create: () => Node): () => Node {
  return () => {
    const node = create()
    node.connect.mockImplementation(destination => destination)
    return node
  }
}

// AudioNode.connect returns its destination, which the snippet chains on
function createContext(): MockAudioContext {
  const context = createMockAudioContext({ currentTime: 1.5 })
  context.createGain.mockImplementation(chainable(context.createGain.getMockImplementation()!))
  context.createOscillator.mockImplementation(chainable(context.createOscillator.getMockImplementation()!))
  return context
}

function libraryScheduleOf(soundDefinition: SoundDefinition) {
  const context = createContext()
  playSoundFromDefinition(context, soundDefinition)
  return recordedSchedule(context)
}

async function vanillaScheduleOf(soundDefinition: SoundDefinition) {
  const context = createContext()
  const { code } = buildSnippets('probe', soundDefinition).find(snippet => snippet.id === 'vanilla')!
  const playing: Promise<void> = runInNewContext(`${code}\nplayProbe(context)`, { context })
  context.oscillators[0]?.onended?.()
  await playing
  return recordedSchedule(context)
}

describe('vanilla Web Audio snippet', () => {
  it.each<[string, SoundDefinition]>([
    ['scalar gain and frequency', { frequency: 440, gain: 0.3, duration: 0.4, attack: 0.02, decay: 0.15 }],
    ['default gain', { frequency: 220 }],
    ['attack filling the whole sound', { frequency: 220, duration: 0.1, attack: 0.5, decay: 0.5 }],
    ['stepless gain envelope', { frequency: 330, gain: { start: 0.6, steps: [] }, duration: 0.3 }],
    ['linear gain envelope with attack past its first step', {
      frequency: 440,
      gain: { start: 0.2, steps: [{ time: 0.05, value: 0.8 }, { time: 0.2, value: 0.4 }], interpolation: 'linear' },
      duration: 0.4,
      attack: 0.1,
    }],
    ['step gain envelope with attack past its first step', {
      frequency: 440,
      gain: { start: 0.2, steps: [{ time: 0.2, value: 0.4 }, { time: 0.05, value: 0.8 }] },
      duration: 0.4,
      attack: 0.1,
    }],
    ['linear gain envelope with attack before its first step', {
      frequency: 440,
      gain: { start: 0.2, steps: [{ time: 0.3, value: 0.9 }], interpolation: 'linear' },
      duration: 0.5,
      attack: 0.1,
    }],
    ['gain envelope starting on a step at zero', {
      frequency: 440,
      gain: { start: 0.2, steps: [{ time: 0, value: 0.7 }] },
    }],
    ['stepped frequency envelope', {
      frequency: { start: 220, steps: [{ time: 0.1, value: 440 }, { time: 0.2, value: 330 }], interpolation: 'step' },
      duration: 0.3,
    }],
    ['last step at duration', {
      frequency: { start: 880, steps: [{ time: 0.25, value: 110 }] },
      gain: { start: 0.5, steps: [{ time: 0.25, value: 0.1 }] },
      duration: 0.25,
    }],
    ['custom partials wave', { waveType: 'custom', partials: [1, 0.5, 0.25], frequency: 440, gain: 0.4 }],
  ])('schedules what the library schedules for %s', async (_, soundDefinition) => {
    expect(await vanillaScheduleOf(soundDefinition)).toEqual(libraryScheduleOf(soundDefinition))
  })
})
