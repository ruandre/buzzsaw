import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { installStudioStores } from '../../testing/studioStores'
import DropdownMenu from './DropdownMenu.vue'

const DropdownHost = defineComponent(() => () =>
  h(DropdownMenu, { items: [{ id: 'rename', label: 'Rename' }] }, () =>
    h('button', { type: 'button' }, 'Actions')))

describe('dropdownMenu', () => {
  let teardown: () => void

  beforeEach(() => {
    teardown = installStudioStores()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.body.removeAttribute('style')
    teardown()
  })

  it('keeps the page scrollbar while open', async () => {
    const wrapper = mount(DropdownHost, { attachTo: document.body })
    await wrapper.get('button').trigger('keydown', { key: 'Enter' })
    await nextTick()
    await nextTick()

    expect(document.body.querySelector('[role="menu"]')).not.toBeNull()
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})
