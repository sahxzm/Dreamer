import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

// Production routes
const routes = [
  { path: '/', component: () => import('./pages/Dashboard.vue') },
  { path: '/tasks', component: () => import('./pages/Tasks.vue') },
  { path: '/routines', component: () => import('./pages/Routines.vue') },
  { path: '/focus', component: () => import('./pages/Focus.vue') },
  { path: '/journal', component: () => import('./pages/Journal.vue') },
  { path: '/goals', component: () => import('./pages/Goals.vue') },
  { path: '/bookmarks', component: () => import('./pages/Bookmarks.vue') },
  { path: '/settings', component: () => import('./pages/Settings.vue') },
]

const router = createRouter({ history: createWebHistory(), routes })
const pinia = createPinia()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
