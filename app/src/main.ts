import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import './styles/base.css'
import './styles/syntax.css'
import './styles/tokens.css'

import '@fontsource-variable/geist-mono'
import '@fontsource-variable/instrument-sans'

createApp(App).use(createPinia()).use(router).mount('#app')
