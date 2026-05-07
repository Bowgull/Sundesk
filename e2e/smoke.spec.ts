import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  const consoleErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

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

test('Build linked-record edits persist across reloads', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByRole('row', { name: /Build Charlottetown meeting prep/ }).click()

  const drawer = page.getByTestId('record-drawer')

  await drawer.getByRole('button', { name: 'Charlottetown Remove' }).click()
  await drawer.getByRole('button', { name: /Halifax At risk/ }).click()
  await expect(page.getByRole('row', { name: /Build Charlottetown meeting prep/ })).toContainText('Halifax')

  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByRole('row', { name: /Build Charlottetown meeting prep/ })).toContainText('Halifax')
})

test('Build creates a local record from the grid', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('build-add-record').first().click()

  const modal = page.getByTestId('record-modal')

  await expect(modal.getByRole('heading', { name: 'New record.' })).toBeVisible()
  await modal.getByLabel('Title').fill('Book generator')
  await modal.getByLabel('Status').selectOption('In progress')
  await modal.getByLabel('Due date').fill('2026-05-19')
  await modal.getByRole('button', { name: 'Add record' }).click()

  await expect(modal.getByRole('heading', { name: 'Book generator' })).toBeVisible()
  await modal.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByTestId('build-screen').getByText('Book generator')).toBeVisible()
})

test('Build created records persist across reloads', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('build-add-record').first().click()

  const modal = page.getByTestId('record-modal')

  await modal.getByLabel('Title').fill('Confirm catering count')
  await modal.getByLabel('Status').selectOption('Waiting')
  await modal.getByRole('button', { name: 'Add record' }).click()
  await modal.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByTestId('build-screen').getByText('Confirm catering count')).toBeVisible()

  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByTestId('build-screen').getByText('Confirm catering count')).toBeVisible()
})

test('Build adds and removes a dependency link', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByRole('row', { name: /Build Charlottetown meeting prep/ }).click()

  const editor = page.getByTestId('dependency-editor')

  await editor.getByPlaceholder('Search records').fill('permit')
  await editor.getByRole('button', { name: /Permit approval/ }).click()
  await editor.getByPlaceholder('Why this link matters').fill('Permit needs agenda context.')
  await editor.getByRole('button', { name: 'Add dependency' }).click()

  const dependencyRow = page.locator('.editable-dependency-list li').filter({ hasText: 'Permit approval' })

  await expect(dependencyRow.getByRole('button', { name: 'Depends on Permit approval.' })).toBeVisible()
  await expect(dependencyRow.getByText('Permit needs agenda context.')).toBeVisible()
  await dependencyRow.getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(dependencyRow).toBeHidden()
})

test('Build dependencies persist across reloads', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByRole('row', { name: /Build Charlottetown meeting prep/ }).click()

  const editor = page.getByTestId('dependency-editor')

  await editor.getByPlaceholder('Search records').fill('permit')
  await editor.getByRole('button', { name: /Permit approval/ }).click()
  await editor.getByPlaceholder('Why this link matters').fill('Permit needs agenda context.')
  await editor.getByRole('button', { name: 'Add dependency' }).click()
  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await page.getByRole('row', { name: /Build Charlottetown meeting prep/ }).click()

  const dependencyRow = page.locator('.editable-dependency-list li').filter({ hasText: 'Permit approval' })

  await expect(dependencyRow.getByRole('button', { name: 'Depends on Permit approval.' })).toBeVisible()
  await expect(dependencyRow.getByText('Permit needs agenda context.')).toBeVisible()
})

test('Build table create and rename persist across reloads', async ({ page }) => {
  await page.goto('/#build')
  await page.getByRole('button', { name: 'Add table' }).click()

  const addTableModal = page.getByRole('dialog', { name: 'Add table' })

  await addTableModal.getByLabel('Table name').fill('Partners')
  await addTableModal.getByLabel('Purpose').fill('Groups tied to local work.')
  await addTableModal.getByRole('button', { name: 'Add table' }).click()
  await expect(page.getByRole('heading', { name: 'Partners' })).toBeVisible()
  await page.getByRole('button', { name: 'Rename table' }).click()

  const settingsModal = page.getByRole('dialog', { name: 'Table settings' })

  await settingsModal.getByLabel('Table name').fill('Vendors')
  await settingsModal.getByRole('button', { name: 'Save table' }).click()
  await expect(page.getByRole('heading', { name: 'Vendors' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Vendors' })).toBeVisible()
  await expect(page.getByTestId('build-table-partners').getByText('Vendors')).toBeVisible()
})

test('Build table delete repairs linked fields and persists', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-people').click()
  await page.getByRole('button', { name: 'Delete table' }).click()
  await page.getByRole('dialog', { name: 'Delete table' }).getByRole('button', { name: 'Delete table' }).click()
  await expect(page.getByTestId('build-table-people')).toBeHidden()
  await page.getByTestId('build-table-tasks').click()
  await page.getByRole('row', { name: /Confirm COI status/ }).click()
  await expect(page.getByTestId('record-drawer').getByText('Owner').first()).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByText('Empty').first()).toBeVisible()

  await page.reload()
  await expect(page.getByTestId('build-table-people')).toBeHidden()
  await page.getByTestId('build-table-tasks').click()
  await page.getByRole('row', { name: /Confirm COI status/ }).click()
  await expect(page.getByTestId('record-drawer').getByText('Owner').first()).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByText('Empty').first()).toBeVisible()
})

test('Build saves, applies, pins, and deletes a view', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByLabel('Filter').fill('permit')
  await page.getByRole('button', { name: 'Save view' }).click()

  const savedView = page.getByLabel('View name').locator('xpath=ancestor::article[1]')

  await expect(savedView).toBeVisible()
  await expect(page.getByLabel('View name')).toHaveValue(/view 1/)
  await page.getByLabel('Filter').fill('coi')
  await savedView.getByRole('button', { name: 'Apply' }).click()
  await expect(page.getByLabel('Filter')).toHaveValue('permit')

  await savedView.getByRole('button', { name: 'Pin' }).click()
  await expect(page.getByLabel('Pinned Build views').getByRole('button', { name: /view 1/ })).toBeVisible()
  await page.getByLabel('Pinned Build views').getByRole('button', { name: /view 1/ }).click()
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()

  await savedView.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByLabel('View name')).toBeHidden()
  await expect(page.getByLabel('Pinned Build views')).toBeHidden()
})

test('Build view rename, update, copy, and reset persist locally', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByLabel('Filter').fill('permit')
  await page.getByRole('button', { name: 'Save view' }).click()

  const savedView = page.getByTestId('local-view-row').first()

  await savedView.getByLabel('View name').fill('Permit watch')
  await savedView.getByRole('button', { name: 'Rename' }).click()
  await page.getByLabel('Filter').fill('coi')
  await savedView.getByRole('button', { name: 'Update' }).click()
  await page.getByLabel('Filter').fill('zzz')
  await savedView.getByRole('button', { name: 'Reset' }).click()
  await expect(page.getByLabel('Filter')).toHaveValue('coi')

  await savedView.getByRole('button', { name: 'Copy' }).click()
  await expect(page.getByTestId('local-view-row')).toHaveCount(2)
  await expect(page.getByTestId('local-view-row').first().getByLabel('View name')).toHaveValue('Permit watch copy 1')

  await page.reload()
  await expect(page.getByTestId('local-view-row')).toHaveCount(2)
  await expect(page.getByTestId('local-view-row').first().getByLabel('View name')).toHaveValue('Permit watch copy 1')
  await expect(page.getByLabel('Filter')).toHaveValue('coi')
})

test('Build pinned views persist across reloads', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByLabel('Filter').fill('permit')
  await page.getByRole('button', { name: 'Save view' }).click()

  const savedView = page.getByLabel('View name').locator('xpath=ancestor::article[1]')

  await savedView.getByRole('button', { name: 'Pin' }).click()
  await page.reload()

  await expect(page.getByLabel('Pinned Build views').getByRole('button', { name: /view 1/ })).toBeVisible()
  await expect(page.getByLabel('Filter')).toHaveValue('permit')
})

test('Build field create, edit, and delete persist across reloads', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByRole('button', { name: 'Add field' }).click()

  const addFieldModal = page.getByRole('dialog', { name: 'Add field' })

  await addFieldModal.getByLabel('Field name').fill('Notes')
  await addFieldModal.getByLabel('Type').selectOption('longText')
  await addFieldModal.getByRole('button', { name: 'Add field' }).click()
  await expect(page.getByRole('columnheader', { name: /Notes/ }).first()).toBeVisible()
  await page.getByRole('columnheader', { name: /Notes/ }).first().locator('.grid-field-menu-trigger').click()
  await page.getByRole('button', { name: 'Field settings' }).click()

  const settingsModal = page.getByRole('dialog', { name: 'Field settings' })

  await settingsModal.getByLabel('Field name').fill('Internal notes')
  await settingsModal.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('columnheader', { name: /Internal notes/ }).first()).toBeVisible()
  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByRole('columnheader', { name: /Internal notes/ }).first()).toBeVisible()
  await page.getByRole('columnheader', { name: /Internal notes/ }).first().locator('.grid-field-menu-trigger').click()
  await page.getByRole('button', { name: 'Delete field' }).click()
  await page.getByRole('dialog', { name: 'Delete field' }).getByRole('button', { name: 'Delete field' }).click()
  await expect(page.getByRole('columnheader', { name: /Internal notes/ })).toBeHidden()
  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByRole('columnheader', { name: /Internal notes/ })).toBeHidden()
})

test('Build Rule edits persist as read-only previews', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('rules-panel').getByRole('button', { name: 'New rule' }).click()

  const rule = page.getByTestId('local-rule-row').first()

  await rule.getByLabel('Field').selectOption('status')
  await rule.getByLabel('Operator').selectOption('is')
  await rule.getByLabel('Value').fill('Blocked')
  await rule.getByLabel('Destination').selectOption('today')
  await expect(rule.getByText('Tasks.Status is "Blocked". show in screen: Today.')).toBeVisible()
  await expect(rule.getByText('1 matching records')).toBeVisible()
  await page.reload()
  await page.getByTestId('build-table-tasks').click()

  const persistedRule = page.getByTestId('local-rule-row').first()

  await expect(persistedRule.getByText('Tasks.Status is "Blocked". show in screen: Today.')).toBeVisible()
  await expect(persistedRule.getByText('1 matching records')).toBeVisible()
  await page.goto('/#today')
  await expect(page.getByTestId('today-rule-receipts').getByText('No automation ran').first()).toBeVisible()
})

test('Build edits reflect in Today and Timeline after reload', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('build-add-record').first().click()

  const modal = page.getByTestId('record-modal')

  await modal.getByLabel('Title').fill('Reflection smoke task')
  await modal.getByLabel('Status').selectOption('Blocked')
  await modal.getByLabel('Due date').fill('2026-05-10')
  await modal.getByRole('button', { name: 'Add record' }).click()
  await modal.getByRole('button', { name: 'Done' }).click()
  await page.reload()
  await page.goto('/#today')

  await expect(page.getByTestId('today-lane-now').getByText('Reflection smoke task')).toBeVisible()
  await page.goto('/#timeline')
  await page.getByPlaceholder('Find records').fill('reflection')
  await expect(page.getByTestId('timeline-list').getByText('Reflection smoke task')).toBeVisible()
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
