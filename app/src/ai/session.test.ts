import type { StructuredPromptRequest } from './session'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runStructuredPrompt } from './session'

const REQUEST: StructuredPromptRequest = {
  systemPrompt: 'system',
  userPrompt: 'user',
  responseSchema: {},
  sampling: 'creative',
  workingMessage: 'Designing...',
}

function progressEvent(loaded: number): Event {
  return Object.assign(new Event('downloadprogress'), { loaded })
}

// Mirrors Chrome: monitor fires synchronously inside create(), before the session resolves
function stubLanguageModel(loadedSteps: number[]): void {
  vi.stubGlobal('LanguageModel', {
    create: async (options: { monitor: (monitor: EventTarget) => void }) => {
      const monitor = new EventTarget()
      options.monitor(monitor)
      loadedSteps.forEach(loaded => monitor.dispatchEvent(progressEvent(loaded)))
      return { prompt: async () => '{}' }
    },
  })
}

async function recordProgress(loadedSteps: number[]): Promise<Array<[string, number | undefined]>> {
  stubLanguageModel(loadedSteps)
  const reports: Array<[string, number | undefined]> = []
  await runStructuredPrompt(REQUEST, { onProgress: (message, percent) => reports.push([message, percent]) })
  return reports
}

describe('runStructuredPrompt progress', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports download percent, then loading into memory, then the working step', async () => {
    expect(await recordProgress([0, 0.5, 1])).toEqual([
      ['Starting the on-device model...', undefined],
      ['Downloading the on-device model... 50%', 50],
      ['Loading the on-device model into memory...', undefined],
      ['Designing...', undefined],
    ])
  })

  it('reports no download when an already-downloaded model fires its 0 and 1 events', async () => {
    const messages = (await recordProgress([0, 1])).map(([message]) => message)

    expect(messages.some(message => message.startsWith('Downloading'))).toBe(false)
    expect(messages).toContain('Loading the on-device model into memory...')
  })
})
