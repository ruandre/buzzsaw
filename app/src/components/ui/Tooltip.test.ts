import { mount } from '@vue/test-utils'
import { TooltipProvider } from 'reka-ui'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import Tooltip from './Tooltip.vue'

const TooltipHost = defineComponent(() => () =>
  h(TooltipProvider, () =>
    h(Tooltip, { content: 'Copy code' }, () => h('button', { type: 'button' }, 'Copy'))))

function portalNodeCount(host: HTMLElement): number {
  return [...document.body.childNodes].filter(node => node !== host).length
}

describe('tooltip', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('adds nothing to the document body until first opened', async () => {
    const host = document.createElement('div')
    document.body.append(host)

    mount(TooltipHost, { attachTo: host })
    await nextTick()

    expect(portalNodeCount(host)).toBe(0)
  })

  it('shows its content once opened', async () => {
    const host = document.createElement('div')
    document.body.append(host)

    const wrapper = mount(TooltipHost, { attachTo: host })
    await wrapper.get('button').trigger('focus')
    await nextTick()

    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toBe('Copy code')
  })
})
