import type { GeneratedSound } from '../stores'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAiStore } from '../stores'
import { installStudioStores } from '../testing/studioStores'
import AiSoundGenerator from './AiSoundGenerator.vue'

vi.mock('../ai', async importOriginal => ({
  ...await importOriginal<typeof import('../ai')>(),
  checkPromptApiAvailability: vi.fn(async () => ({ availability: 'unsupported', isSupported: false, isReady: false, message: '' })),
}))

function entry(id: string, name: string): GeneratedSound {
  return { id, name, description: '', definition: { frequency: 440 }, prompt: name, source: 'offline', createdAt: 1 }
}

const stubs = {
  PromptComposer: true,
  ModelStatusBadge: true,
  WaveformVisualizer: true,
  CodeSnippetModal: true,
  Tooltip: { template: '<div><slot /></div>' },
}

describe('aiSoundGenerator', () => {
  let teardown: () => void

  beforeEach(() => {
    teardown = installStudioStores()
  })

  afterEach(() => teardown())

  it('falls back to the latest entry when the selected one is removed from history', async () => {
    const ai = useAiStore()
    ai.history = [entry('new', 'newest'), entry('old', 'older')]
    ai.latest = ai.history[0] ?? null
    const wrapper = mount(AiSoundGenerator, { global: { stubs } })

    const showOlder = wrapper.findAll('button').find(button => button.text().startsWith('Show and play older'))
    await showOlder?.trigger('click')
    expect(wrapper.get('h3').text()).toBe('older')

    await wrapper.get('[aria-label="Remove older from history"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('h3').text()).toBe('newest')
    expect(wrapper.find('[aria-label="Play older"]').exists()).toBe(false)
  })
})
