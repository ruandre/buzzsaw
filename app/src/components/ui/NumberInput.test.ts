import type { EnvelopeDefinition } from '@rjvr/buzzsaw'
import { isEnvelope } from '@rjvr/buzzsaw'
import { DEFAULT_SOUNDS } from '@rjvr/buzzsaw/sounds'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NumberInput from './NumberInput.vue'

function numbersIn(parameter?: number | EnvelopeDefinition): number[] {
  if (typeof parameter === 'number') {
    return [parameter]
  }
  return isEnvelope(parameter) ? [parameter.start, ...parameter.steps.flatMap(step => [step.value, step.time])] : []
}

const PRESET_NUMBERS = [...new Set(Object.values(DEFAULT_SOUNDS).flatMap(sound => [
  ...numbersIn(sound.frequency),
  ...numbersIn(sound.gain),
]))]

const GAIN = { id: 'gain', min: 0, max: 1, step: 0.05 }

describe('numberInput', () => {
  it('exposes a spinbutton with no native step check to flag off-grid values', () => {
    const wrapper = mount(NumberInput, { props: { ...GAIN, modelValue: 0.06 } })
    const input = wrapper.get('input')

    expect(input.attributes('role')).toBe('spinbutton')
    expect(input.attributes('type')).toBe('text')
    expect(input.attributes('aria-invalid')).toBeUndefined()
    expect(input.attributes('aria-valuenow')).toBe('0.06')
  })

  it.each(PRESET_NUMBERS)('shows preset value %s without rounding it', (value) => {
    const wrapper = mount(NumberInput, { props: { id: 'value', min: 0, max: 20000, step: 1, modelValue: value } })

    expect(Number(wrapper.get('input').element.value)).toBe(value)
  })

  it('steps from an off-grid value by one step instead of jumping to the max', async () => {
    const wrapper = mount(NumberInput, { props: { ...GAIN, modelValue: 0.06 } })

    await wrapper.get('input').trigger('keydown', { key: 'ArrowUp' })

    expect(wrapper.emitted('update:modelValue')).toEqual([[0.11]])
  })

  it('commits a typed off-grid value unchanged', async () => {
    const wrapper = mount(NumberInput, { props: { ...GAIN, modelValue: 0.5 } })
    const input = wrapper.get('input')

    await input.setValue('0.06')
    await input.trigger('blur')

    expect(wrapper.emitted('update:modelValue')).toEqual([[0.06]])
  })

  it('keeps the last value when the field is cleared', async () => {
    const wrapper = mount(NumberInput, { props: { ...GAIN, modelValue: 0.5 } })
    const input = wrapper.get('input')

    await input.setValue('')
    await input.trigger('blur')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('passes the id to the input so a label can name it', () => {
    const wrapper = mount(NumberInput, { props: { ...GAIN, modelValue: 0.5 } })

    expect(wrapper.get('input').attributes('id')).toBe('gain')
  })
})
