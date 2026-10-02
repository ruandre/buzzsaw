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

  it('auditions an unsaved sound without replacing the preset it is named after', async () => {
    const synthesize = registerTools().get('synthesize_sound')!

    const result = await synthesize({ name: 'pop', frequency: 440, duration: 0.2 })

    expect(result).toMatchObject({ success: true, name: 'pop_custom', saved: false })
    expect(usePlaybackStore().soundManager.get('pop')?.definition.frequency).not.toBe(440)
  })

  it('auditions an unsaved sound without replacing the saved sound it is named after', async () => {
    const synthesize = registerTools().get('synthesize_sound')!
    useLibraryStore().save('laser', { frequency: 300, duration: 0.2 })

    await synthesize({ name: 'laser', frequency: 1200, duration: 0.2 })

    expect(usePlaybackStore().soundManager.get('laser')?.definition.frequency).toBe(300)
  })

  it('returns a structured error for an edit definition core would reject', async () => {
    const edit = registerTools().get('edit_sound_definition')!

    const result = await edit({ name: 'shrill', definition: { frequency: 50000 }, instruction: 'softer' })

    expect(result).toMatchObject({ success: false, error: expect.stringContaining('frequency') })
  })

  it('edits the named sound when the definition is null', async () => {
    const edit = registerTools().get('edit_sound_definition')!

    const result = await edit({ name: 'pop', definition: null, instruction: 'softer' })

    expect(result).toMatchObject({ success: true })
  })

  it('finds no sound under an inherited object key', () => {
    const getDefinition = registerTools().get('get_sound_definition')!

    expect(getDefinition({ name: 'constructor' })).toEqual({ error: 'No sound named "constructor".' })
  })
})
