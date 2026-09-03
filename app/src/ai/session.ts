import type { LanguageModelApi } from './availability'
import { getLanguageModel } from './availability'

export type ProgressReporter = (message: string, percent?: number) => void

export interface PromptRunOptions {
  signal?: AbortSignal
  onProgress?: ProgressReporter
}

export interface StructuredPromptRequest {
  systemPrompt: string
  userPrompt: string
  responseSchema: object
  sampling: SamplingIntent
  workingMessage: string
}

export type SamplingIntent = 'creative' | 'precise'

// Web platform takes samplingMode; extensions expose raw temperature/topK
const SAMPLING_PRESETS = {
  creative: { samplingMode: 'creative', temperature: 1.0, topK: 40 },
  precise: { samplingMode: 'most-predictable', temperature: 0.2, topK: 3 },
} as const

/** Runs schema-constrained prompt against transient session; null if unavailable */
export async function runStructuredPrompt(
  request: StructuredPromptRequest,
  options: PromptRunOptions = {},
): Promise<string | null> {
  const api = getLanguageModel()
  if (!api || typeof api.create !== 'function') {
    return null
  }

  options.onProgress?.('Connecting to the on-device model...')
  const session = await api.create({
    signal: options.signal,
    initialPrompts: [{ role: 'system', content: request.systemPrompt }],
    expectedInputs: [{ type: 'text', languages: ['en'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }],
    ...await resolveSampling(api, request.sampling),
    monitor(monitor: EventTarget) {
      monitor.addEventListener?.('downloadprogress', (event: Event) => {
        const percent = Math.round(((event as ProgressEvent).loaded ?? 0) * 100)
        options.onProgress?.(`Downloading the on-device model... ${percent}%`, percent)
      })
    },
  })

  try {
    options.onProgress?.(request.workingMessage)
    return await session.prompt(request.userPrompt, {
      signal: options.signal,
      responseConstraint: request.responseSchema,
    })
  }
  finally {
    session.destroy?.()
  }
}

type SamplingOptions
  = | { samplingMode: string }
    | { temperature: number, topK: number }

// Raw params and samplingMode are mutually exclusive; passing both throws TypeError
async function resolveSampling(
  api: LanguageModelApi,
  intent: SamplingIntent,
): Promise<SamplingOptions> {
  const preset = SAMPLING_PRESETS[intent]
  if (typeof api.params !== 'function') {
    return { samplingMode: preset.samplingMode }
  }

  try {
    const params = await api.params()
    if (!params) {
      return { samplingMode: preset.samplingMode }
    }
    return {
      temperature: Math.min(preset.temperature, params.maxTemperature ?? preset.temperature),
      topK: Math.min(preset.topK, params.maxTopK ?? preset.topK),
    }
  }
  catch {
    // Older Chrome builds throw on params()
    return { samplingMode: preset.samplingMode }
  }
}

export function isAbortError(error: unknown, signal?: AbortSignal): boolean {
  return signal?.aborted === true || (error instanceof Error && error.name === 'AbortError')
}
