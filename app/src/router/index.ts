import type { RouteRecordRaw } from 'vue-router'
import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import SoundBrowser from '../components/SoundBrowser.vue'
import { STUDIO_VIEWS } from './views'

// View route definitions; browser view is eagerly loaded, other views load dynamically
const VIEW_COMPONENTS = {
  browser: SoundBrowser,
  creator: () => import('../components/SoundCreator.vue'),
  ai: () => import('../components/AiSoundGenerator.vue'),
  custom: () => import('../components/CustomSoundsList.vue'),
  docs: () => import('../components/DocumentationView.vue'),
} as const

const routes: RouteRecordRaw[] = [
  ...STUDIO_VIEWS.map(view => ({
    path: view.path,
    name: view.id,
    component: VIEW_COMPONENTS[view.id],
    meta: { title: view.label },
  })),
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // Preserves scroll position on popstate; scrolls to top on new route
  scrollBehavior: (_to, _from, savedPosition) => savedPosition ?? { top: 0 },
})

// Integrates document.startViewTransition with Vue Router lifecycle
export const supportsViewTransitions = typeof document !== 'undefined'
  && typeof document.startViewTransition === 'function'

const reducedMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)')

function canTransition(): boolean {
  return supportsViewTransitions && !(reducedMotion && reducedMotion.matches)
}

let finishTransition: (() => void) | null = null

router.beforeResolve(() => {
  // Skips transition if prior animation is still pending
  if (!canTransition() || finishTransition) {
    return
  }
  return new Promise<void>((proceed) => {
    const transition = document.startViewTransition(() => {
      proceed()
      return new Promise<void>((done) => {
        finishTransition = done
      })
    })
    // Handles aborted transitions without hanging navigation
    transition.finished.catch(() => {
      finishTransition = null
      proceed()
    })
  })
})

router.afterEach(async () => {
  await nextTick()
  finishTransition?.()
  finishTransition = null
})

const BASE_TITLE = 'Buzzsaw Studio'

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title && to.name !== 'browser'
    ? `${title} · ${BASE_TITLE}`
    : `${BASE_TITLE} · Web Audio Synthesizer and Sound Library`
})

export * from './views'
