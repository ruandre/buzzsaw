import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SoundCard from './SoundCard.vue'

const stubs = { WaveformVisualizer: true, DropdownMenu: true, Tooltip: { template: '<div><slot /></div>' } }

describe('soundCard', () => {
  it.each([
    [false, 'Audition laser'],
    [true, 'Stop laser'],
  ])('names the waveform button for what a click does when playing is %s', (isPlaying, label) => {
    const wrapper = mount(SoundCard, { props: { name: 'laser', definition: { frequency: 440 }, isPlaying }, global: { stubs } })

    const waveformButton = wrapper.findAll('button').find(button => button.find('waveform-visualizer-stub').exists())

    expect(waveformButton?.attributes('aria-label')).toBe(label)
  })
})
