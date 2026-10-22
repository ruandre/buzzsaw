import type { RouteRecordRaw } from 'vue-router'
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

const BASE_TITLE = 'Buzzsaw Studio'

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title && to.name !== 'browser'
    ? `${title} · ${BASE_TITLE}`
    : `${BASE_TITLE} · Web Audio Synthesizer and Sound Library`
})

export * from './views'
