import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useAiStore } from '../../stores'
import { installStudioStores } from '../../testing/studioStores'
import PromptComposer from './PromptComposer.vue'

vi.mock('../../ai', async importOriginal => ({
  ...await importOriginal<typeof import('../../ai')>(),
  checkPromptApiAvailability: vi.fn(async () => ({ availability: 'unsupported', isSupported: false, isReady: false, message: '' })),
}))

const stubs = { EngineNotice: true }

async function setGenerating(isGenerating: boolean) {
  useAiStore().isGenerating = isGenerating
  await nextTick()
  await nextTick()
}

describe('promptComposer', () => {
  let teardown: () => void

  beforeEach(() => {
    teardown = installStudioStores()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    teardown()
  })

  it('keeps keyboard focus in the composer when the Design button gives way to Cancel', async () => {
    const wrapper = mount(PromptComposer, { attachTo: document.body, global: { stubs } })
    await wrapper.get('textarea').setValue('laser')
    const design = wrapper.get<HTMLButtonElement>('button[type="submit"]').element
    design.focus()

    await setGenerating(true)

    expect(document.activeElement).toBe(wrapper.get('textarea').element)
  })

  it('leaves focus on the description while a run starts and ends', async () => {
    const wrapper = mount(PromptComposer, { attachTo: document.body, global: { stubs } })
    const textarea = wrapper.get<HTMLTextAreaElement>('textarea').element
    textarea.focus()

    await setGenerating(true)
    expect(document.activeElement).toBe(textarea)
    expect(textarea.readOnly).toBe(true)

    await setGenerating(false)
    expect(document.activeElement).toBe(textarea)
    expect(textarea.readOnly).toBe(false)
  })

  it('returns focus to the description when the focused Cancel button goes away', async () => {
    const wrapper = mount(PromptComposer, { attachTo: document.body, global: { stubs } })
    await setGenerating(true)
    wrapper.get<HTMLButtonElement>('button[type="button"]').element.focus()

    await setGenerating(false)

    expect(document.activeElement).toBe(wrapper.get('textarea').element)
  })

  it('lets Enter confirm an IME composition instead of submitting the half-typed prompt', async () => {
    const wrapper = mount(PromptComposer, { attachTo: document.body, global: { stubs } })
    await wrapper.get('textarea').setValue('ねこ')

    await wrapper.get('textarea').trigger('keydown', { key: 'Enter', isComposing: true })

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('submits on Enter outside a composition', async () => {
    const wrapper = mount(PromptComposer, { attachTo: document.body, global: { stubs } })
    await wrapper.get('textarea').setValue('laser')

    await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('submit')).toEqual([['laser']])
  })

  it('leaves focus alone when it was outside the composer', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    mount(PromptComposer, { attachTo: document.body, global: { stubs } })
    outside.focus()

    await setGenerating(true)

    expect(document.activeElement).toBe(outside)
  })
})
