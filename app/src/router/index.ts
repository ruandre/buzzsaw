import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import SoundBrowser from '../components/SoundBrowser.vue'
import { STUDIO_VIEWS } from './views'

// Browser view is eagerly loaded, other views load dynamically
const LAZY_VIEWS = {
  creator: () => import('../components/SoundCreator.vue'),
  ai: () => import('../components/AiSoundGenerator.vue'),
  custom: () => import('../components/CustomSoundsList.vue'),
  docs: () => import('../components/DocumentationView.vue'),
} as const

const VIEW_COMPONENTS = { browser: SoundBrowser, ...LAZY_VIEWS } as const

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

/** Fetches every lazy view's code so a first visit skips the network wait */
export async function prefetchLazyViews(): Promise<void> {
  // Settled: a failed prefetch stays silent; navigating to the view calls its loader again
  await Promise.allSettled(Object.values(LAZY_VIEWS).map(load => load()))
}

const BASE_TITLE = 'Buzzsaw Studio'

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title && to.name !== 'browser'
    ? `${title} · ${BASE_TITLE}`
    : `${BASE_TITLE} · Web Audio Synthesizer and Sound Library`
})

export * from './views'
