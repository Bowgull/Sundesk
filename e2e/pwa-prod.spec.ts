import { expect, test } from '@playwright/test'

const productionPreviewUrl = 'http://127.0.0.1:5177'

test('production preview registers the Sundesk offline shell and icons', async ({ page }) => {
  await page.goto(productionPreviewUrl)
  await expect(page.getByRole('heading', { name: 'Start with what can slip.' })).toBeVisible()

  const serviceWorkerScript = await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) {
      return ''
    }

    const registration = await navigator.serviceWorker.ready

    return registration.active?.scriptURL || ''
  })

  await expect.poll(() => serviceWorkerScript.jsonValue()).toContain('/sundesk-sw.js')

  for (const assetPath of [
    '/manifest.webmanifest',
    '/apple-touch-icon.png',
    '/icon-192.png',
    '/icon-512.png',
    '/sundesk-sw.js',
  ]) {
    const response = await page.request.get(`${productionPreviewUrl}${assetPath}`)

    await expect(response).toBeOK()
  }

  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { name: 'Start with what can slip.' })).toBeVisible()

  await page.context().setOffline(true)
  await page.goto(productionPreviewUrl)
  await expect(page.getByRole('heading', { name: 'Start with what can slip.' })).toBeVisible()
})
