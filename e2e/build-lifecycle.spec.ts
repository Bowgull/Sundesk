import { expect, test } from '@playwright/test'

const dismissedEducationState = {
  version: 1,
  onboarding: {
    status: 'dismissed',
    currentStepId: null,
    completedStepIds: ['welcome'],
    completedActionIds: [],
    startedAt: null,
    completedAt: null,
    lastSeenAt: null,
  },
  lab: {
    activeModuleId: null,
    sampleWorkspaceVersion: 1,
    sampleWorkspaceResetAt: null,
    modules: {},
  },
  help: {
    recentQueries: [],
    dismissedCardIds: [],
    lastArticleId: null,
  },
  copyMode: {
    rupaulMode: false,
    updatedAt: null,
  },
  meetingPdf: {
    templateVersion: 1,
    lastExportedMeetingId: null,
  },
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((state) => {
    if (!window.localStorage.getItem('sundesk-build-lifecycle-seeded')) {
      window.localStorage.removeItem('sundesk-build-view-state-v1')
      window.localStorage.removeItem('sundesk-local-workbase-v1')
      window.localStorage.setItem('sundesk-build-lifecycle-seeded', 'true')
    }
    window.localStorage.setItem('sundesk-theme', 'moss-paper')
    if (!window.localStorage.getItem('sundesk-education-state-v1')) {
      window.localStorage.setItem('sundesk-education-state-v1', JSON.stringify(state))
    }
  }, dismissedEducationState)
})

async function openTableMenu(page: import('@playwright/test').Page) {
  await page.locator('summary').filter({ hasText: /^Table$/ }).click()
}

test('Build table lifecycle persists create, rename, switch, duplicate, and delete', async ({ page }) => {
  await page.goto('/#build')

  await expect(page.getByRole('heading', { name: 'Work' })).toBeVisible()
  await expect(page.getByRole('tab', { name: /Work/ })).toHaveAttribute('aria-selected', 'true')

  await page.getByRole('button', { name: 'Add table' }).click()
  const addTableModal = page.getByRole('dialog', { name: 'Add table' })

  await addTableModal.getByLabel('Table name').fill('Vendors')
  await addTableModal.getByLabel('Purpose').fill('Outside partners for this test.')
  await addTableModal.getByRole('button', { name: 'Add table' }).click()
  await expect(page.getByTestId('build-table-vendors')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('heading', { name: 'Vendors' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: /Name/ }).first()).toBeVisible()

  await page.reload()
  await expect(page.getByTestId('build-table-vendors')).toHaveAttribute('aria-selected', 'true')

  await openTableMenu(page)
  await page.getByRole('button', { name: 'Rename table' }).click()
  const settingsModal = page.getByRole('dialog', { name: 'Table settings' })

  await settingsModal.getByLabel('Table name').fill('Vendor partners with a very long name for launch testing')
  await settingsModal.getByRole('button', { name: 'Save table' }).click()
  await expect(page.getByTestId('build-table-vendors')).toContainText('Vendor partners with a very long name for launch testing')

  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByRole('heading', { name: 'Work' })).toBeVisible()
  await page.getByTestId('build-table-vendors').click()
  await expect(page.getByRole('heading', { name: 'Vendor partners with a very long name for launch testing' })).toBeVisible()

  await page.getByRole('button', { name: 'Add table' }).click()
  await addTableModal.getByLabel('Table name').fill('Vendors')
  await addTableModal.getByRole('button', { name: 'Add table' }).click()
  await expect(page.getByTestId('build-table-vendors_2')).toHaveAttribute('aria-selected', 'true')

  await openTableMenu(page)
  await page.getByRole('button', { name: 'Delete table' }).click()
  await page.getByRole('dialog', { name: 'Delete table' }).getByRole('button', { name: 'Delete table' }).click()
  await expect(page.getByTestId('build-table-vendors_2')).toHaveCount(0)

  await page.getByTestId('build-table-vendors').click()
  await openTableMenu(page)
  await page.getByRole('button', { name: 'Delete table' }).click()
  await page.getByRole('dialog', { name: 'Delete table' }).getByRole('button', { name: 'Delete table' }).click()
  await expect(page.getByTestId('build-table-vendors')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Work' })).toBeVisible()

  await page.reload()
  await expect(page.getByTestId('build-table-vendors')).toHaveCount(0)
  await expect(page.getByTestId('build-table-vendors_2')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Work' })).toBeVisible()

  const storedState = await page.evaluate(() => ({
    base: JSON.parse(window.localStorage.getItem('sundesk-local-workbase-v1') || '{}') as {
      base?: {
        tables?: Array<{ id: string }>
        fields?: Array<{ tableId: string }>
        records?: Array<{ tableId: string }>
      }
    },
    buildView: JSON.parse(window.localStorage.getItem('sundesk-build-view-state-v1') || '{}') as {
      selectedBuildTableId?: string
      visibleFieldIdsByTable?: Record<string, string[]>
    },
  }))

  expect(storedState.base.base?.tables?.some((table) => table.id.startsWith('vendors'))).toBe(false)
  expect(storedState.base.base?.fields?.some((field) => field.tableId.startsWith('vendors'))).toBe(false)
  expect(storedState.base.base?.records?.some((record) => record.tableId.startsWith('vendors'))).toBe(false)
  expect(storedState.buildView.selectedBuildTableId).toBe('tasks')
  expect(Object.keys(storedState.buildView.visibleFieldIdsByTable || {}).some((tableId) => tableId.startsWith('vendors'))).toBe(false)
})
