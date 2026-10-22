import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Slider from './Slider.vue'

describe('slider', () => {
  it('announces the formatted readout, not the raw number, on the thumb', () => {
    const wrapper = mount(Slider, {
      props: { modelValue: 0.012, min: 0, max: 1, step: 0.001, label: 'Attack', formatValue: value => `${(value * 1000).toFixed(1)} ms` },
    })

    const thumb = wrapper.get('[role="slider"]')
    expect(thumb.attributes('aria-valuetext')).toBe('12.0 ms')
    expect(thumb.attributes('aria-label')).toBe('Attack')
  })

  it('keeps the readout out of the live region so each change is announced once', () => {
    const wrapper = mount(Slider, { props: { modelValue: 40, label: 'Gain', unit: '%' } })

    expect(wrapper.get('output').attributes('aria-live')).toBe('off')
    expect(wrapper.get('output').text()).toBe('40 %')
  })
})
