import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { prefetchLazyViews, router } from './router'
import { whenIdle } from './utils/scheduler'

import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import './styles/base.css'
import './styles/syntax.css'
import './styles/tokens.css'

import '@fontsource-variable/geist-mono'
import '@fontsource-variable/instrument-sans'

createApp(App).use(createPinia()).use(router).mount('#app')

// After the first view resolves, so prefetching cannot compete with a deep link's own chunk
void router.isReady().then(() => whenIdle(() => void prefetchLazyViews()))
