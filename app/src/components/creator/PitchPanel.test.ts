import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useCreatorStore } from '../../stores'
import { installStudioStores } from '../../testing/studioStores'
import PitchPanel from './PitchPanel.vue'

const stubs = { EnvelopeStepEditor: true, ParameterModeSwitch: true }

describe('pitchPanel base pitch slider', () => {
  let teardown: () => void

  beforeEach(() => {
    teardown = installStudioStores()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    teardown()
  })

  it.each([4000, 30])('keeps %i Hz, which octave shifts can reach, inside the slider range', async (hz) => {
    const creator = useCreatorStore()
    creator.state.fixedFrequency = hz
    const wrapper = mount(PitchPanel, { attachTo: document.body, global: { stubs } })
    await nextTick()
    const thumb = wrapper.get('[role="slider"]')

    expect(thumb.attributes('aria-valuetext')).toBe(`${hz} Hz`)
    expect(Number(thumb.attributes('aria-valuenow'))).toBeLessThanOrEqual(Number(thumb.attributes('aria-valuemax')))
    expect(Number(thumb.attributes('aria-valuenow'))).toBeGreaterThanOrEqual(Number(thumb.attributes('aria-valuemin')))
  })

  it('nudges a high pitch by a small step instead of snapping it to the range end', async () => {
    const creator = useCreatorStore()
    creator.state.fixedFrequency = 4000
    const wrapper = mount(PitchPanel, { attachTo: document.body, global: { stubs } })

    await wrapper.get('[role="slider"]').trigger('keydown', { key: 'ArrowLeft' })

    expect(creator.state.fixedFrequency).toBeLessThan(4000)
    expect(creator.state.fixedFrequency).toBeGreaterThan(3900)
  })
})
