import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EnvelopeStepEditor from './EnvelopeStepEditor.vue'

const GAIN_EDITOR = {
  idPrefix: 'gain-step',
  valueLabel: 'Gain level',
  valueMin: 0,
  valueMax: 1,
  valueStep: 0.01,
  addLabel: 'Add gain point',
  timeMax: 0.3,
}

describe('envelopeStepEditor', () => {
  it('updates a preset level off the step grid by one step', async () => {
    const wrapper = mount(EnvelopeStepEditor, { props: { ...GAIN_EDITOR, steps: [{ value: 0.0005, time: 0.005 }] } })

    await wrapper.get('#gain-step-value-0').trigger('keydown', { key: 'ArrowUp' })

    expect(wrapper.emitted('update')).toEqual([[0, { value: 0.0105 }]])
  })

  it('updates then re-sorts when a step time is committed', async () => {
    const wrapper = mount(EnvelopeStepEditor, { props: { ...GAIN_EDITOR, steps: [{ value: 0.5, time: 0.005 }] } })
    const time = wrapper.get('#gain-step-time-0')

    await time.setValue('0.2')
    await time.trigger('blur')

    expect(wrapper.emitted('update')).toEqual([[0, { time: 0.2 }]])
    expect(wrapper.emitted('sort')).toHaveLength(1)
  })
})
