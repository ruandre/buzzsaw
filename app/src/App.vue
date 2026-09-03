<script setup lang="ts">
import { ConfigProvider, TooltipProvider } from 'reka-ui'
import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import NoticeStack from './components/NoticeStack.vue'
import StudioFooter from './components/StudioFooter.vue'
import StudioHeader from './components/StudioHeader.vue'
import { useAriaInvalidSync, useKeyboardShortcuts } from './composables'
import { supportsViewTransitions } from './router'
import { useAiStore, useCreatorStore, usePlaybackStore, useUiStore } from './stores'
import { registerWebMcpTools } from './utils/webmcp'

// Tooltip hover delay and rapid subsequent hover skip window
const TOOLTIP_DELAY_MS = 200
const TOOLTIP_SKIP_MS = 300

const route = useRoute()
const ui = useUiStore()
const ai = useAiStore()
const playback = usePlaybackStore()
const creator = useCreatorStore()

useAriaInvalidSync()

// Moves focus to main landmark on route change for accessibility
watch(() => route.name, async () => {
  await nextTick()
  document.getElementById('main-content')?.focus({ preventScroll: true })
})

useKeyboardShortcuts({
  onNavigate: position => ui.showViewAt(position),
  onToggleShortcuts: () => ui.toggleShortcutsSheet(),
  onToggleMute: () => playback.toggleMute(),
  onStopAll: () => playback.stopAll(),
  onFocusSearch: () => void focusSearch(),
  onRandomizeCreator: () => creator.randomize(),
  onAuditionCreator: () => playback.preview(creator.definition),
  isCreatorActive: () => ui.activeView === 'creator',
})

async function focusSearch(): Promise<void> {
  await ui.showView('browser')
  await nextTick()
  document.getElementById('preset-search')?.focus()
}

let releaseWebMcpTools: (() => void) | null = null

onMounted(() => {
  ai.refreshAvailability()
  releaseWebMcpTools = registerWebMcpTools()
})

onUnmounted(() => releaseWebMcpTools?.())
</script>

<template>
  <ConfigProvider :scroll-body="false">
    <TooltipProvider :delay-duration="TOOLTIP_DELAY_MS" :skip-delay-duration="TOOLTIP_SKIP_MS">
      <div class="min-h-[100dvh] flex flex-col bg-canvas text-ink font-sans antialiased">
        <a href="#main-content" class="skip-link">Skip to main content</a>

        <StudioHeader />

        <main
          id="main-content"
          tabindex="-1"
          class="layout-container min-w-0 flex-1 py-6 sm:py-8 focus:outline-none"
        >
          <RouterView v-slot="{ Component, route: currentRoute }">
            <component :is="Component" v-if="supportsViewTransitions" :key="currentRoute.name" />
            <Transition v-else name="view" mode="out-in">
              <component :is="Component" :key="currentRoute.name" />
            </Transition>
          </RouterView>
        </main>

        <StudioFooter />
        <NoticeStack />
      </div>
    </TooltipProvider>
  </ConfigProvider>
</template>
