<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useUiStore } from '../stores'

const ui = useUiStore()
</script>

<template>
  <nav
    aria-label="Studio views"
    class="hidden min-w-0 flex-1 items-center justify-center lg:flex"
  >
    <div class="max-w-full inline-flex items-center gap-1 border border-line rounded-lg bg-surface-sunken p-1 shadow-bezel">
      <RouterLink
        v-for="view in ui.views"
        :key="view.id"
        :to="view.path"
        class="nav-tab no-underline"
        :data-state="ui.activeView === view.id ? 'active' : 'inactive'"
        :aria-current="ui.activeView === view.id ? 'page' : undefined"
      >
        <span
          :class="[view.icon, view.accent ? 'text-accent' : '']"
          class="shrink-0 text-sm leading-none"
          aria-hidden="true"
        />
        <span class="inline-flex items-center leading-none">{{ view.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>
