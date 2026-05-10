import { describe, expect, it } from 'vitest'
import { getServiceWorkerReadiness } from './pwa'

describe('PWA helpers', () => {
  it('allows service worker registration only for production builds with browser support', () => {
    expect(getServiceWorkerReadiness({ isProduction: true, hasServiceWorker: true })).toEqual({
      canRegister: true,
      statusText: 'Offline shell ready.',
    })
  })

  it('keeps service worker registration off outside production builds', () => {
    expect(getServiceWorkerReadiness({ isProduction: false, hasServiceWorker: true })).toEqual({
      canRegister: false,
      statusText: 'Offline shell runs in production builds.',
    })
  })

  it('reports unsupported browsers without touching browser APIs', () => {
    expect(getServiceWorkerReadiness({ isProduction: true, hasServiceWorker: false })).toEqual({
      canRegister: false,
      statusText: 'Offline shell is unavailable in this browser.',
    })
  })
})
