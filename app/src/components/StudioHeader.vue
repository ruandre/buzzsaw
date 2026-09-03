<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { viewBadge } from '../router'
import { usePlaybackStore, useUiStore } from '../stores'
import MasterVolume from './MasterVolume.vue'
import ShortcutsSheet from './ShortcutsSheet.vue'
import StudioNav from './StudioNav.vue'
import BuzzsawLogo from './ui/BuzzsawLogo.vue'
import Tooltip from './ui/Tooltip.vue'
import VuMeter from './VuMeter.vue'

const ui = useUiStore()
const playback = usePlaybackStore()

const isDrawerOpen = ref(false)

watch(() => ui.activeView, () => {
  isDrawerOpen.value = false
})

// Plays hover sound for non-touch pointer events
function hoverLogo(event: PointerEvent): void {
  if (event.pointerType === 'touch') {
    return
  }
  playback.cue('logoHover')
}

function toggleDrawer(): void {
  playback.cue(isDrawerOpen.value ? 'dismiss' : 'open')
  isDrawerOpen.value = !isDrawerOpen.value
}
</script>

<template>
  <header
    role="banner"
    class="sticky top-0 z-40 border-b border-line bg-chrome shadow-[0_1px_3px_rgb(0_0_0/0.05)]"
  >
    <div class="layout-container h-14 flex items-center justify-between gap-2 xl:gap-3">
      <RouterLink
        to="/"
        class="group flex flex-shrink-0 select-none items-center rounded-md p-1 transition-transform duration-fast active:scale-97 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        aria-label="Buzzsaw Studio, go to presets"
        @pointerenter="hoverLogo"
      >
        <BuzzsawLogo :active="playback.isPlaying" size="md" />
      </RouterLink>

      <StudioNav />

      <div class="flex flex-shrink-0 items-center gap-2 sm:gap-2.5">
        <div class="hidden xl:block">
          <VuMeter :level="playback.outputLevel" :active-voices="playback.activeVoices" />
        </div>

        <div class="hidden lg:block">
          <MasterVolume />
        </div>

        <div class="hidden h-9 items-center gap-1 border border-line rounded-lg bg-surface-sunken p-1 shadow-bezel lg:flex">
          <Tooltip :content="ui.isDark ? 'Switch to light' : 'Switch to dark'">
            <button
              type="button"
              class="btn-icon h-7 w-7 rounded"
              :aria-label="ui.isDark ? 'Switch to light theme' : 'Switch to dark theme'"
              :aria-pressed="ui.isDark"
              @click="ui.toggleTheme()"
            >
              <span
                :class="ui.isDark ? 'i-ph-sun-bold text-warning' : 'i-ph-moon-bold'"
                class="shrink-0 text-xs leading-none"
                aria-hidden="true"
              />
            </button>
          </Tooltip>

          <Tooltip content="Keyboard shortcuts" shortcut="?">
            <button
              type="button"
              class="btn-icon h-7 w-7 rounded"
              aria-label="Show keyboard shortcuts"
              @click="ui.setShortcutsSheetOpen(true)"
            >
              <span class="i-ph-question-bold shrink-0 text-xs leading-none" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>

        <button
          type="button"
          class="btn-icon ml-1 lg:hidden"
          aria-label="Open navigation menu"
          :aria-expanded="isDrawerOpen"
          aria-controls="studio-drawer"
          @click="toggleDrawer"
        >
          <span :class="isDrawerOpen ? 'i-ph-x-bold' : 'i-ph-list-bold'" class="shrink-0 text-base leading-none" aria-hidden="true" />
        </button>
      </div>
    </div>

    <DialogRoot v-model:open="isDrawerOpen">
      <DialogPortal>
        <DialogOverlay class="drawer-scrim fixed inset-0 z-40 bg-scrim/35 lg:hidden" />
        <DialogContent
          id="studio-drawer"
          closedby="any"
          class="drawer fixed bottom-0 right-0 top-14 z-50 max-w-[21rem] w-[88%] flex flex-col overflow-y-auto border-l border-line bg-chrome lg:hidden"
        >
          <DialogTitle class="sr-only">
            Navigation
          </DialogTitle>
          <DialogDescription class="sr-only">
            Studio views and audio controls
          </DialogDescription>

          <div class="flex items-center justify-between border-b border-line bg-surface-sunken p-4">
            <span class="text-badge text-ink">Navigation</span>
            <DialogClose as-child>
              <button type="button" class="btn-icon" aria-label="Close navigation menu">
                <span class="i-ph-x-bold shrink-0 text-sm leading-none" aria-hidden="true" />
              </button>
            </DialogClose>
          </div>

          <nav class="p-3 space-y-1" aria-label="Studio views">
            <RouterLink
              v-for="view in ui.views"
              :key="view.id"
              :to="view.path"
              class="w-full flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm font-semibold font-mono no-underline transition-colors duration-fast"
              :class="ui.activeView === view.id
                ? 'bg-control border-accent text-accent-ink'
                : 'bg-surface border-line text-ink-muted hover:text-ink'"
              :aria-current="ui.activeView === view.id ? 'page' : undefined"
            >
              <span class="flex items-center gap-2.5">
                <span :class="[view.icon, view.accent ? 'text-accent' : '']" class="shrink-0 text-sm leading-none" aria-hidden="true" />
                <span class="leading-none">{{ view.label }}</span>
              </span>
              <span
                v-if="viewBadge(view)"
                :class="ui.activeView === view.id ? 'badge-count-active' : 'badge-count'"
              >{{ viewBadge(view) }}</span>
            </RouterLink>
          </nav>

          <div class="mt-auto border-t border-line bg-surface-sunken p-4 space-y-4">
            <div class="flex items-center justify-between border border-line rounded-lg bg-surface px-3 py-2.5">
              <span class="text-xs text-ink-subtle font-bold font-mono">ENGINE</span>
              <VuMeter :level="playback.outputLevel" :active-voices="playback.activeVoices" />
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-ink-muted font-bold">MASTER VOLUME</span>
                <span class="border border-line rounded bg-control px-2 py-0.5 text-accent-ink font-bold tabular-nums">
                  {{ playback.isMuted ? 'MUTED' : `${Math.round(playback.masterVolume * 100)}%` }}
                </span>
              </div>
              <MasterVolume variant="full" />
            </div>

            <div class="grid grid-cols-2 gap-2 pt-2">
              <button type="button" class="btn-secondary justify-center py-2.5" @click="ui.toggleTheme()">
                <span :class="ui.isDark ? 'i-ph-sun-bold text-warning' : 'i-ph-moon-bold'" class="shrink-0 text-sm leading-none" aria-hidden="true" />
                <span>{{ ui.isDark ? 'Light' : 'Dark' }}</span>
              </button>
              <button
                type="button"
                class="btn-secondary justify-center py-2.5"
                @click="ui.setShortcutsSheetOpen(true); isDrawerOpen = false"
              >
                <span class="i-ph-question-bold shrink-0 text-sm leading-none" aria-hidden="true" />
                <span>Shortcuts</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <ShortcutsSheet />
  </header>
</template>

<style scoped>
.drawer-scrim[data-state='open'] {
  animation: scrim-in var(--duration-base) var(--ease-out);
}

.drawer[data-state='open'] {
  animation: drawer-in var(--duration-modal) var(--ease-spring);
}

.drawer-scrim[data-state='closed'],
.drawer[data-state='closed'] {
  animation-direction: reverse;
}

@keyframes scrim-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes drawer-in {
  from {
    opacity: 0;
    transform: translateX(12px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .drawer-scrim,
  .drawer {
    animation: none !important;
  }
}
</style>
