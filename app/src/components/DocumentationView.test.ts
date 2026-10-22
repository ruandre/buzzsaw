import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { installStudioStores } from '../testing/studioStores'
import DocumentationView from './DocumentationView.vue'

const stubs = { CodeBlock: true, WaveformVisualizer: true }

describe('documentationView', () => {
  let teardown: () => void

  beforeEach(() => {
    teardown = installStudioStores()
  })

  afterEach(() => {
    teardown()
  })

  it('selects the npm install tab by default', () => {
    const wrapper = mount(DocumentationView, { global: { stubs } })

    const pressed = wrapper.get('[aria-label="Package manager"] [aria-pressed="true"]')

    expect(pressed.text()).toBe('npm')
  })
})
