import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { installStudioStores } from '../testing/studioStores'
import StudioHeader from './StudioHeader.vue'

const isDesktop = ref(false)

vi.mock('@vueuse/core', async importOriginal => ({
  ...await importOriginal<typeof import('@vueuse/core')>(),
  useMediaQuery: () => isDesktop,
}))
// The real router module pulls in every view
vi.mock('../router', () => ({ viewBadge: () => undefined }))
vi.mock('../stores/ui', () => ({
  useUiStore: () => ({ activeView: 'browser', isDark: false, setShortcutsSheetOpen: vi.fn(), toggleTheme: vi.fn() }),
}))

const stubs = {
  RouterLink: { template: '<a><slot /></a>' },
  StudioNav: true,
  MasterVolume: true,
  VuMeter: true,
  ShortcutsSheet: true,
  BuzzsawLogo: true,
  Tooltip: { template: '<div><slot /></div>' },
}

describe('studioHeader drawer', () => {
  let teardown: () => void

  beforeEach(() => {
    teardown = installStudioStores()
    isDesktop.value = false
  })

  afterEach(() => {
    document.body.innerHTML = ''
    teardown()
  })

  it('closes the mobile drawer once the viewport reaches desktop width, where it is hidden', async () => {
    const wrapper = mount(StudioHeader, { attachTo: document.body, global: { stubs } })
    await wrapper.get('[aria-controls="studio-drawer"]').trigger('click')
    await flushPromises()
    expect(document.getElementById('studio-drawer')).not.toBeNull()

    isDesktop.value = true
    await flushPromises()

    expect(document.getElementById('studio-drawer')).toBeNull()
  })
})
