import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { getServiceWorkerReadiness } from './data/pwa'

const rootElement = document.getElementById('root')
const serviceWorkerReadiness = getServiceWorkerReadiness({
  isProduction: import.meta.env.PROD,
  hasServiceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
})

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

if (serviceWorkerReadiness.canRegister && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sundesk-sw.js').catch(() => undefined)
  })
}
