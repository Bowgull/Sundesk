import { expect, test } from '@playwright/test'

const authRequiredBaseUrl = 'http://127.0.0.1:5176'

test('local no-config path opens Today', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('auth-gate')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Start with what can slip.' })).toBeVisible()
})

test('allowlist config requires sign-in before Today opens', async ({ page }) => {
  await page.goto(authRequiredBaseUrl)

  await expect(page.getByTestId('auth-gate')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sign in required.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Start with what can slip.' })).toHaveCount(0)
})
