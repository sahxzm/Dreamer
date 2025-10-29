import { createApp } from 'vue'
import './style.css'
import './assets/globals.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { persistPlugin } from './plugins/persist'

console.log('main.ts loaded')

// Production routes
const routes = [
  { path: '/', component: () => import('./pages/Dashboard.vue') },
  { path: '/tasks', component: () => import('./pages/Tasks.vue') },
  { path: '/routines', component: () => import('./pages/Routines.vue') },
  { path: '/focus', component: () => import('./pages/Focus.vue') },
  { path: '/journal', component: () => import('./pages/Journal.vue') },
  { path: '/goals', component: () => import('./pages/Goals.vue') },
  { path: '/streaks', component: () => import('./pages/Streaks.vue') },
  { path: '/bookmarks', component: () => import('./pages/Bookmarks.vue') },
  { path: '/settings', component: () => import('./pages/Settings.vue') },
]

const router = createRouter({ history: createWebHistory(), routes })
const pinia = createPinia()

// Apply persistence plugin to Pinia
pinia.use(persistPlugin)

console.log('Router and Pinia created with persistence')

const app = createApp(App)
console.log('Vue app created')

app.use(pinia)
app.use(router)
console.log('Plugins registered')

app.mount('#app')
console.log('App mounted to #app')
