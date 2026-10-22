import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WaveformVisualizer from './WaveformVisualizer.vue'

const LAYOUT_GETTERS = ['offsetWidth', 'offsetHeight'] as const

describe('waveformVisualizer', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('reads no layout while mounting', () => {
    const layoutReads = LAYOUT_GETTERS.map(getter => vi.spyOn(HTMLElement.prototype, getter, 'get'))

    mount(WaveformVisualizer, { props: { definition: { frequency: 440 } }, attachTo: document.body })

    for (const read of layoutReads) {
      expect(read).not.toHaveBeenCalled()
    }
  })
})
