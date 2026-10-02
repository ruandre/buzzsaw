import { setAudioContextInstance } from '@rjvr/buzzsaw'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLibraryStore, usePlaybackStore } from '../stores'
import { createFakeAudioContext } from '../testing/fakeAudioContext'
import { registerWebMcpTools } from './webmcp'

// The real ui store pulls in the router and its .vue views
vi.mock('../stores/ui', () => ({ useUiStore: () => ({ activeView: 'browser' }) }))

type Execute = (input: unknown) => unknown

function registerTools(): Map<string, Execute> {
  const tools = new Map<string, Execute>()
  vi.stubGlobal('document', {
    modelContext: {
      registerTool: (tool: { name: string, execute: Execute }) => tools.set(tool.name, tool.execute),
    },
  })
  registerWebMcpTools()
  return tools
}

describe('webMCP tools', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    setAudioContextInstance(createFakeAudioContext())
  })

  afterEach(() => {
    usePlaybackStore().soundManager.dispose()
    setAudioContextInstance(null)
    vi.unstubAllGlobals()
  })

  it('returns a structured error for parameters core would reject', async () => {
    const synthesize = registerTools().get('synthesize_sound')!

    const result = await synthesize({ name: 'shrill', frequency: 50000, duration: 0.2, saveToLibrary: true })

    expect(result).toMatchObject({ success: false, error: expect.stringContaining('frequency') })
    expect(useLibraryStore().customSounds).not.toHaveProperty('shrill')
  })

  it('returns a structured error for a name the studio would reject', async () => {
    const synthesize = registerTools().get('synthesize_sound')!

    const result = await synthesize({ name: '', frequency: 440, duration: 0.2 })

    expect(result).toMatchObject({ success: false })
  })

  it('finds no sound under an inherited object key', () => {
    const getDefinition = registerTools().get('get_sound_definition')!

    expect(getDefinition({ name: 'constructor' })).toEqual({ error: 'No sound named "constructor".' })
  })
})
