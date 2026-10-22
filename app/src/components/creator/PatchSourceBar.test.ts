import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAiStore } from '../../stores'
import { installStudioStores } from '../../testing/studioStores'
import PatchSourceBar from './PatchSourceBar.vue'

const { designSound } = vi.hoisted(() => ({ designSound: vi.fn() }))

vi.mock('../../ai', async importOriginal => ({
  ...await importOriginal<typeof import('../../ai')>(),
  designSound,
  checkPromptApiAvailability: vi.fn(async () => ({ availability: 'unsupported', isSupported: false, isReady: false, message: '' })),
}))

const stubs = { RouterLink: { template: '<a><slot /></a>' } }

function mountBar() {
  return mount(PatchSourceBar, { attachTo: document.body, global: { stubs } })
}

describe('patchSourceBar', () => {
  let teardown: () => void

  beforeEach(() => {
    teardown = installStudioStores()
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    teardown()
  })

  it('keeps the prompt, flags the input and refocuses it when its own run fails', async () => {
    designSound.mockRejectedValueOnce(new Error('The model declined.'))
    const wrapper = mountBar()

    await wrapper.get('#creator-ai-prompt').setValue('8-bit laser')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const input = wrapper.get<HTMLInputElement>('#creator-ai-prompt')
    expect(input.element.value).toBe('8-bit laser')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('[role="alert"]').text()).toContain('The model declined.')
    expect(document.activeElement).toBe(input.element)
  })

  it('does not show a failure from the AI view as its own', async () => {
    const wrapper = mountBar()
    const ai = useAiStore()

    designSound.mockRejectedValueOnce(new Error('Elsewhere.'))
    await ai.generate('laser').catch(() => {})
    await flushPromises()

    expect(ai.lastError).toBe('Elsewhere.')
    expect(wrapper.get('#creator-ai-prompt').attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
