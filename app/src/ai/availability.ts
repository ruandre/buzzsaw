export type PromptApiAvailability
  = | 'available'
    | 'downloadable'
    | 'downloading'
    | 'unavailable'
    | 'unsupported'

export interface PromptApiStatus {
  availability: PromptApiAvailability
  isSupported: boolean
  isReady: boolean
  message: string
  modelName?: string
}

export interface LanguageModelApi {
  availability?: (options?: unknown) => Promise<string>
  capabilities?: () => Promise<{ available?: string }>
  params?: () => Promise<LanguageModelParams | null>
  create: (options: unknown) => Promise<LanguageModelSession>
}

export interface LanguageModelParams {
  defaultTopK?: number
  maxTopK?: number
  defaultTemperature?: number
  maxTemperature?: number
}

export interface LanguageModelSession {
  prompt: (input: string, options?: unknown) => Promise<string>
  destroy?: () => void
}

const MODEL_NAME = 'Gemini Nano'

/** Resolves LanguageModel or legacy window.ai.languageModel */
export function getLanguageModel(): LanguageModelApi | null {
  const scope = globalThis as {
    LanguageModel?: LanguageModelApi
    ai?: { languageModel?: LanguageModelApi }
  }
  return scope.LanguageModel ?? scope.ai?.languageModel ?? null
}

// Maps status strings across Chrome versions
const AVAILABILITY_BY_RAW_STATUS: Record<string, PromptApiStatus> = {
  'readily': ready(),
  'available': ready(),
  'after-download': downloadable(),
  'downloadable': downloadable(),
  'downloading': {
    availability: 'downloading',
    isSupported: true,
    isReady: false,
    message: `${MODEL_NAME} is downloading. Generation will use the offline synthesis engine until it finishes.`,
    modelName: MODEL_NAME,
  },
}

const UNAVAILABLE: PromptApiStatus = {
  availability: 'unavailable',
  isSupported: false,
  isReady: false,
  message: `${MODEL_NAME} cannot run on this device. It needs roughly 22 GB free storage and a supported GPU. The offline synthesis engine is used instead.`,
}

const UNSUPPORTED: PromptApiStatus = {
  availability: 'unsupported',
  isSupported: false,
  isReady: false,
  message: 'This browser has no built-in AI model. Chrome 138+ on desktop exposes the Prompt API; every other browser falls back to the offline synthesis engine.',
}

function ready(): PromptApiStatus {
  return {
    availability: 'available',
    isSupported: true,
    isReady: true,
    message: `${MODEL_NAME} is ready on-device. Prompts never leave this browser.`,
    modelName: MODEL_NAME,
  }
}

function downloadable(): PromptApiStatus {
  return {
    availability: 'downloadable',
    isSupported: true,
    isReady: false,
    message: `${MODEL_NAME} is available but not downloaded yet. The first generation will fetch it, showing progress as it goes.`,
    modelName: MODEL_NAME,
  }
}

/** Queries Prompt API availability; never throws, reports errors as unavailable */
export async function checkPromptApiAvailability(): Promise<PromptApiStatus> {
  const api = getLanguageModel()
  if (!api) {
    return UNSUPPORTED
  }

  try {
    return AVAILABILITY_BY_RAW_STATUS[await readRawStatus(api)] ?? UNAVAILABLE
  }
  catch (error) {
    return {
      ...UNAVAILABLE,
      message: `Could not query the built-in model (${errorMessage(error)}). The offline synthesis engine is used instead.`,
    }
  }
}

async function readRawStatus(api: LanguageModelApi): Promise<string> {
  if (typeof api.availability === 'function') {
    return api.availability({
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }],
    })
  }
  if (typeof api.capabilities === 'function') {
    return (await api.capabilities()).available ?? 'unavailable'
  }
  return 'unavailable'
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error'
}
