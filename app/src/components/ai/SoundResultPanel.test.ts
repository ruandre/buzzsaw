import type { GeneratedSound } from '../../stores'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useAiStore } from '../../stores'
import { installStudioStores } from '../../testing/studioStores'
import SoundResultPanel from './SoundResultPanel.vue'

const { redesignSound, designSound } = vi.hoisted(() => ({
  redesignSound: vi.fn(),
  designSound: vi.fn(),
}))

vi.mock('../../ai', async importOriginal => ({
  ...await importOriginal<typeof import('../../ai')>(),
  designSound,
  redesignSound,
  checkPromptApiAvailability: vi.fn(async () => ({ availability: 'unsupported', isSupported: false, isReady: false, message: '' })),
}))

const sound: GeneratedSound = {
  id: 'ai-1',
  name: 'blip',
  description: 'A blip.',
  definition: { frequency: 880, duration: 0.2 },
  prompt: 'blip',
  source: 'offline',
  createdAt: 1,
}

const designed = { name: 'blip', description: 'Edited.', definition: { frequency: 440 }, source: 'offline' as const, designedAt: 2 }

/** Wires the panel the way AiSoundGenerator does: a refine request becomes a store run */
const Host = defineComponent({
  setup() {
    const ai = useAiStore()
    return () => h(SoundResultPanel, {
      sound,
      onRefine: (instruction: string) => ai.edit(sound.definition, sound.name, instruction).catch(() => {}),
    })
  },
})

const stubs = {
  WaveformVisualizer: true,
  CodeSnippetModal: true,
  Tooltip: { template: '<div><slot /></div>' },
}

function mountPanel() {
  return mount(Host, { attachTo: document.body, global: { stubs } })
}

async function refineWith(wrapper: ReturnType<typeof mountPanel>, instruction: string) {
  await wrapper.get('#refinement').setValue(instruction)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('soundResultPanel', () => {
  let teardown: () => void

  beforeEach(() => {
    teardown = installStudioStores()
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    teardown()
  })

  it('keeps the draft, flags the input and refocuses it when its own run fails', async () => {
    redesignSound.mockRejectedValueOnce(new Error('The model declined.'))
    const wrapper = mountPanel()

    await refineWith(wrapper, 'punchier')

    const input = wrapper.get<HTMLInputElement>('#refinement')
    expect(input.element.value).toBe('punchier')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('[role="alert"]').text()).toContain('The model declined.')
    expect(document.activeElement).toBe(input.element)
  })

  it('clears the draft after its own run succeeds', async () => {
    redesignSound.mockResolvedValueOnce(designed)
    const wrapper = mountPanel()

    await refineWith(wrapper, 'punchier')

    expect(wrapper.get<HTMLInputElement>('#refinement').element.value).toBe('')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('keeps the draft when its own run is cancelled', async () => {
    redesignSound.mockRejectedValueOnce(new DOMException('The user aborted a request.', 'AbortError'))
    const wrapper = mountPanel()

    await refineWith(wrapper, 'punchier')

    expect(wrapper.get<HTMLInputElement>('#refinement').element.value).toBe('punchier')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('moves focus from a disabled one-click edit to the refine input while a run starts', async () => {
    const wrapper = mountPanel()
    wrapper.get<HTMLButtonElement>('[aria-label="One-click edits"] button').element.focus()

    useAiStore().isGenerating = true
    await flushPromises()

    expect(document.activeElement).toBe(wrapper.get('#refinement').element)
  })

  it('ignores the outcome of a run started elsewhere', async () => {
    const wrapper = mountPanel()
    await wrapper.get('#refinement').setValue('punchier')
    const ai = useAiStore()

    designSound.mockRejectedValueOnce(new Error('Composer failed.'))
    await ai.generate('laser').catch(() => {})
    await flushPromises()

    const input = wrapper.get<HTMLInputElement>('#refinement')
    expect(input.element.value).toBe('punchier')
    expect(input.attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)

    designSound.mockResolvedValueOnce(designed)
    await ai.generate('laser')
    await flushPromises()

    expect(input.element.value).toBe('punchier')
  })
})
