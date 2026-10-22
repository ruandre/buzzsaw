import type { DesignedSound } from '../ai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { redesignSound } from '../ai'
import { useCreatorStore } from '../stores'
import { installStudioStores } from '../testing/studioStores'
import { useStudioActions } from './useStudioActions'

vi.mock('../ai', async importOriginal => ({
  ...await importOriginal<typeof import('../ai')>(),
  redesignSound: vi.fn(),
  checkPromptApiAvailability: vi.fn(async () => ({ availability: 'unsupported', isSupported: false, isReady: false, message: '' })),
}))
// The real ui store pulls in the router and its .vue views
vi.mock('../stores/ui', () => ({ useUiStore: () => ({ showView: vi.fn() }) }))

const refined: DesignedSound = { name: 'blip_mod', description: '', definition: { frequency: 220, duration: 0.4 }, source: 'offline', designedAt: 1 }

describe('refineCreatorPatchWithAi', () => {
  let teardown: () => void

  beforeEach(() => {
    teardown = installStudioStores()
  })

  afterEach(() => {
    teardown()
    vi.clearAllMocks()
  })

  it('loads the refined patch into the creator', async () => {
    vi.mocked(redesignSound).mockResolvedValueOnce(refined)
    const creator = useCreatorStore()

    await useStudioActions().refineCreatorPatchWithAi('lower')

    expect(creator.state.name).toBe('blip_mod')
  })

  it('keeps edits made to the patch while the refine ran', async () => {
    let finishDesign: (sound: DesignedSound) => void = () => {}
    vi.mocked(redesignSound).mockReturnValueOnce(new Promise((resolve) => {
      finishDesign = resolve
    }))
    const creator = useCreatorStore()
    const pending = useStudioActions().refineCreatorPatchWithAi('lower')

    creator.state.duration = 1.5
    finishDesign(refined)
    await pending

    expect(creator.state.duration).toBe(1.5)
    expect(creator.state.name).not.toBe('blip_mod')
  })
})
