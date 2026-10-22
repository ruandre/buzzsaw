import { spaceAmbience } from '@rjvr/buzzsaw/sounds'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useCreatorStore } from '../../stores'
import { installStudioStores } from '../../testing/studioStores'
import EnvelopePanel from './EnvelopePanel.vue'

const stubs = { EnvelopeStepEditor: true, ParameterModeSwitch: true }

describe('envelopePanel attack slider', () => {
  let teardown: () => void

  beforeEach(() => {
    teardown = installStudioStores()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    teardown()
  })

  it('nudges a preset attack past the default range instead of cutting it', async () => {
    const creator = useCreatorStore()
    creator.load('spaceAmbience', spaceAmbience)
    const wrapper = mount(EnvelopePanel, { attachTo: document.body, global: { stubs } })
    const attackThumb = wrapper.get('[role="slider"][aria-label="Attack"]')

    await attackThumb.trigger('keydown', { key: 'ArrowLeft' })

    expect(creator.state.attack).toBeCloseTo(0.798)
  })
})
