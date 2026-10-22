import { airRaidSiren } from '@rjvr/buzzsaw/sounds'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useCreatorStore } from '../../stores'
import { installStudioStores } from '../../testing/studioStores'
import OscillatorPanel from './OscillatorPanel.vue'

describe('oscillatorPanel duration slider', () => {
  let teardown: () => void

  beforeEach(() => {
    teardown = installStudioStores()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    teardown()
  })

  it('reports a preset longer than the default range inside its bounds', async () => {
    useCreatorStore().load('airRaidSiren', airRaidSiren)
    const wrapper = mount(OscillatorPanel, { attachTo: document.body })
    await nextTick()
    const thumb = wrapper.get('[role="slider"]')

    expect(Number(thumb.attributes('aria-valuenow'))).toBe(3.4)
    expect(Number(thumb.attributes('aria-valuemax'))).toBeGreaterThan(3.4)
  })

  it.each([['ArrowRight', 3.41], ['ArrowLeft', 3.39]])('nudges a long preset on %s to %s s instead of cutting it', async (key, expected) => {
    const creator = useCreatorStore()
    creator.load('airRaidSiren', airRaidSiren)
    const wrapper = mount(OscillatorPanel, { attachTo: document.body })

    await wrapper.get('[role="slider"]').trigger('keydown', { key })

    expect(creator.state.duration).toBeCloseTo(expected)
  })
})
