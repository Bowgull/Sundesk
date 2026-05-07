import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  const consoleErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  await page.addInitScript(() => window.localStorage.clear())
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Today builds the day.' })).toBeVisible()
  expect(consoleErrors).toEqual([])
})

test('Today renders local lanes, rule receipts, and dependency receipts', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Today builds the day.' })).toBeVisible()
  await expect(page.getByTestId('today-lane-rules').getByText('Records matched by local Rules.')).toBeVisible()
  await expect(page.getByTestId('today-rule-receipts').getByText('Rule matched').first()).toBeVisible()
  await expect(page.getByTestId('today-rule-receipts').getByText('No automation ran').first()).toBeVisible()
  await expect(page.getByTestId('today-lane-now').getByText('Blocked by: Venue readiness may slip.')).toBeVisible()
})

test('Build renders table workshop, record drawer, dependency editor, and Rules panel', async ({ page }) => {
  await page.goto('/#build')

  await expect(page.getByRole('heading', { name: 'Risks' })).toBeVisible()
  await expect(page.getByTestId('build-table-tasks')).toBeVisible()
  await page.getByTestId('build-table-tasks').click()

  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
  await expect(page.getByTestId('record-drawer')).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByText('Linked records')).toBeVisible()
  await expect(page.getByTestId('dependency-editor')).toBeVisible()
  await expect(page.getByTestId('dependency-editor').getByPlaceholder('Search records')).toBeVisible()
  await expect(page.getByTestId('dependency-editor').getByRole('button', { name: 'Add dependency' })).toBeDisabled()
  await expect(page.getByTestId('rules-panel').getByRole('heading', { name: 'When this happens, do this.' })).toBeVisible()
  await expect(page.getByTestId('rules-panel').getByText('matching records').first()).toBeVisible()
})

test('Build record modal supports linked-record picker editing', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('edit-record-task_coi_halifax').click()

  await expect(page.getByRole('dialog', { name: 'Record editor' })).toBeVisible()
  await expect(page.getByTestId('record-modal').getByPlaceholder('Search Communities')).toBeVisible()
  await expect(page.getByTestId('record-modal').getByRole('button', { name: 'Halifax Remove' })).toBeVisible()
  await expect(page.getByTestId('record-modal').getByText('Backlinks')).toBeVisible()
})

test('Timeline filters records and keeps rule receipts visible', async ({ page }) => {
  await page.goto('/#timeline')
  await expect(page.getByRole('heading', { name: 'Records by date.' })).toBeVisible()

  await page.getByPlaceholder('Find records').fill('permit')

  await expect(page.getByTestId('timeline-row-task_permit_moncton')).toBeVisible()
  await expect(page.getByTestId('timeline-row-approval_permit_moncton')).toBeVisible()
  await expect(page.getByTestId('timeline-list').getByText('Rule: Tasks.Due date is within 7 days. show in screen: Timeline.')).toBeVisible()
})

test('Settings exposes local engine and Rule destination health', async ({ page }) => {
  await page.goto('/#settings')

  await expect(page.getByRole('heading', { name: 'Browser state.' })).toBeVisible()
  await expect(page.getByText('No Firebase writes in this local build.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Read targets.' })).toBeVisible()
  await expect(page.getByTestId('rule-destination-grid').getByText('Today')).toBeVisible()
  await expect(page.getByTestId('rule-destination-grid').getByText('Timeline')).toBeVisible()
})
