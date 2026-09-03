import type { ViewId } from '../router'
import { useDark } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { DEFAULT_VIEW, router, STUDIO_VIEWS } from '../router'
import { clearScopeThemeCache } from '../theme/waveform'
import { STORAGE_KEYS } from '../utils/storage'
import { usePlaybackStore } from './playback'

export const useUiStore = defineStore('ui', () => {
  const playback = usePlaybackStore()

  const isDark = useDark({
    storageKey: STORAGE_KEYS.theme,
    initialValue: 'light',
    valueDark: 'dark',
    valueLight: '',
  })

  /** Active view ID derived from current route name */
  const activeView = computed<ViewId>(() => (router.currentRoute.value.name as ViewId | undefined) ?? DEFAULT_VIEW)
  const isShortcutsSheetOpen = ref(false)

  watch(isDark, (dark) => {
    // Invalidates cached CSS token colors used by oscilloscope
    clearScopeThemeCache()
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  }, { immediate: true })

  // Cues navigation sound on route transitions
  router.afterEach((to, from) => {
    if (to.name !== from.name) {
      playback.cue('navigate')
    }
  })

  /** Navigates to view by ID */
  async function showView(id: ViewId): Promise<void> {
    if (activeView.value !== id) {
      await router.push({ name: id })
    }
  }

  /** Navigates to view by 1-based index (keyboard shortcuts) */
  function showViewAt(position: number): void {
    const view = STUDIO_VIEWS[position - 1]
    if (view) {
      void showView(view.id)
    }
  }

  function toggleTheme(): void {
    playback.cue('toggle')
    isDark.value = !isDark.value
  }

  function setShortcutsSheetOpen(open: boolean): void {
    if (open && !isShortcutsSheetOpen.value) {
      playback.cue('open')
    }
    isShortcutsSheetOpen.value = open
  }

  function toggleShortcutsSheet(): void {
    setShortcutsSheetOpen(!isShortcutsSheetOpen.value)
  }

  return {
    isDark,
    activeView,
    views: STUDIO_VIEWS,
    isShortcutsSheetOpen,
    showView,
    showViewAt,
    toggleTheme,
    setShortcutsSheetOpen,
    toggleShortcutsSheet,
  }
})
