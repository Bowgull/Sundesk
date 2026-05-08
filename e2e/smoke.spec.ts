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
  await expect(page.getByRole('button', { name: 'Preview unavailable' })).toBeDisabled()
  await expect(page.getByTestId('today-lane-now')).toBeVisible()
  await expect(page.getByTestId('today-lane-waiting')).toBeVisible()
  await expect(page.getByTestId('today-lane-next')).toBeVisible()
  await expect(page.getByTestId('today-lane-rules')).toHaveCount(0)
  await expect(page.getByTestId('today-rule-receipts').getByText('Rule matched').first()).toBeVisible()
  await expect(page.getByTestId('today-rule-receipts').getByText('No automation ran').first()).toBeVisible()
  await expect(page.getByTestId('today-lane-now').getByText('Blocked by: Venue readiness may slip.')).toBeVisible()
  await page.getByRole('button', { name: 'Open setup' }).click()
  await expect(page.getByRole('heading', { name: 'Browser state.' })).toBeVisible()
})

test('Build renders table workshop, record drawer, dependency editor, and Rules panel', async ({ page }) => {
  await page.goto('/#build')

  await expect(page.getByRole('heading', { name: 'Risks' })).toBeVisible()
  await expect(page.getByTestId('build-table-tasks')).toBeVisible()
  await page.getByTestId('build-table-tasks').click()

  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
  await expect(page.getByTestId('record-drawer')).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByLabel('Record status')).toContainText('Blocked')
  await expect(page.getByTestId('record-drawer').getByLabel('Record status')).toContainText('2026-05-12')
  await expect(page.getByTestId('record-drawer').getByText('Linked records')).toBeVisible()
  await expect(page.getByTestId('dependency-editor')).toBeVisible()
  await expect(page.getByTestId('dependency-editor').getByPlaceholder('Search records')).toBeVisible()
  await expect(page.getByTestId('dependency-editor').getByRole('button', { name: 'Add dependency' })).toBeDisabled()
  await expect(page.getByTestId('rules-panel').getByRole('heading', { name: 'When this happens, do this.' })).toBeVisible()
  await expect(page.getByTestId('rules-panel').getByText('matching records').first()).toBeVisible()
})

test('Build record drawer supports linked-record picker editing', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('edit-record-task_coi_halifax').click()

  await expect(page.getByTestId('record-drawer')).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByPlaceholder('Search Communities')).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByRole('button', { name: /Halifax.*Remove/ })).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByText('Backlinks', { exact: true })).toBeVisible()
})

test('Build linked-record edits persist across reloads', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByRole('row', { name: /Build Charlottetown meeting prep/ }).click()

  const drawer = page.getByTestId('record-drawer')

  await drawer.getByRole('button', { name: /Charlottetown.*Remove/ }).click()
  await drawer.getByRole('button', { name: /Halifax · At risk/ }).click()
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

test('Build grid supports inline cell editing and keyboard movement', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const titleCell = page.getByTestId('grid-cell-task_coi_halifax-title')

  await titleCell.click()
  await titleCell.press('Enter')
  await page.getByLabel('Title editor').fill('Confirm COI certificate')
  await page.getByLabel('Title editor').press('Escape')
  await expect(page.getByRole('row', { name: /Confirm COI status/ })).toBeVisible()
  await expect(page.getByRole('row', { name: /Confirm COI certificate/ })).toBeHidden()

  await titleCell.press('Enter')
  await page.getByLabel('Title editor').fill('Confirm COI certificate')
  await page.getByLabel('Title editor').press('Tab')
  await expect(page.getByRole('row', { name: /Confirm COI certificate/ })).toBeVisible()
  await expect(page.getByTestId('grid-cell-task_coi_halifax-status')).toBeFocused()
})

test('Build grid cells keep a visible keyboard focus ring', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const titleCell = page.getByTestId('grid-cell-task_coi_halifax-title')

  await titleCell.focus()
  await expect(titleCell).toBeFocused()
  await expect(titleCell).toHaveCSS('outline-style', 'solid')
})

test('Build field header menu exposes view and field actions', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const titleHeader = page.getByRole('columnheader', { name: /Title/ }).first()
  const titleMenuTrigger = titleHeader.locator('.grid-field-menu-trigger')

  await expect(titleMenuTrigger).toHaveAttribute('aria-haspopup', 'menu')
  await expect(titleMenuTrigger).toHaveAttribute('aria-expanded', 'false')
  await titleMenuTrigger.click()
  await expect(titleMenuTrigger).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('menuitem', { name: 'Edit field' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Rename', exact: true })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Change type' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Hide from view' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Sort ascending' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Sort descending' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Group by this field' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Sort descending' }).click()
  await expect(page.getByLabel('Direction')).toHaveValue('desc')

  await titleHeader.locator('.grid-field-menu-trigger').click()
  await page.getByRole('menuitem', { name: 'Duplicate field' }).click()
  await expect(page.getByRole('columnheader', { name: /Title copy/ }).first()).toBeVisible()
})

test('Build menus and non-destructive modals close on Escape', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await page.getByRole('columnheader', { name: /Title/ }).first().locator('.grid-field-menu-trigger').click()
  await expect(page.getByRole('menu', { name: /Title field actions/ })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu', { name: /Title field actions/ })).toBeHidden()

  await page.getByRole('button', { name: 'Add table' }).click()
  await expect(page.getByRole('dialog', { name: 'Add table' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Add table' })).toBeHidden()

  await page.getByRole('button', { name: 'Delete table' }).click()
  await expect(page.getByRole('dialog', { name: 'Delete table' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Delete table' })).toBeVisible()
  await page.getByRole('dialog', { name: 'Delete table' }).getByRole('button', { name: 'Cancel' }).click()
})

test('Build toolbar exposes ordered view controls and persists density', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await expect(page.getByRole('link', { name: 'Build' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('tab', { name: /Tasks/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('View')).toBeVisible()
  await expect(page.getByLabel('Fields')).toBeVisible()
  await expect(page.getByLabel('Filter')).toBeVisible()
  await expect(page.getByLabel('Sort')).toBeVisible()
  await expect(page.getByLabel('Group')).toBeVisible()
  await expect(page.getByLabel('Colour')).toBeVisible()
  await expect(page.getByLabel('Density')).toBeVisible()

  await page.getByLabel('Density').selectOption('compact')
  await expect(page.locator('.record-table').first()).toHaveClass(/density-compact/)

  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByLabel('Density')).toHaveValue('compact')
  await expect(page.locator('.record-table').first()).toHaveClass(/density-compact/)
})

test('Build toolbar colour applies semantic row tinting', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await page.getByLabel('Colour').selectOption('status')
  await expect(page.getByRole('row', { name: /Confirm COI status/ })).toHaveClass(/grid-row-color-coral/)
  await expect(page.getByRole('row', { name: /Send permit follow-up/ })).toHaveClass(/grid-row-color-gold/)
  await expect(page.getByRole('row', { name: /Build Charlottetown meeting prep/ })).toHaveClass(/grid-row-color-lavender/)
})

test('Build chips use semantic colour and field type treatment', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await expect(page.getByTestId('grid-cell-task_coi_halifax-status').locator('.select-tag')).toHaveClass(/chip-coral/)
  await expect(page.getByTestId('grid-cell-task_permit_moncton-status').locator('.select-tag')).toHaveClass(/chip-gold/)
  await expect(page.getByTestId('grid-cell-task_meeting_charlottetown-status').locator('.select-tag')).toHaveClass(/chip-lavender/)
  await expect(page.getByTestId('record-drawer').locator('.field-type-chip').first()).toBeVisible()
})

test('Build grid linked-record editor searches and commits readable records', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const communityCell = page.getByTestId('grid-cell-task_coi_halifax-community')

  await communityCell.click()
  await communityCell.press('Enter')

  const editor = page.getByLabel('Community editor')

  await editor.getByPlaceholder('Search records').fill('charlottetown')
  await editor.getByRole('button', { name: /Charlottetown · Prep · 2026-05-28/ }).click()
  await editor.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('row', { name: /Confirm COI status/ })).toContainText('Charlottetown')
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
  await expect(page.getByTestId('record-drawer').getByText('Choose a linked table in field settings.').first()).toBeVisible()

  await page.reload()
  await expect(page.getByTestId('build-table-people')).toBeHidden()
  await page.getByTestId('build-table-tasks').click()
  await page.getByRole('row', { name: /Confirm COI status/ }).click()
  await expect(page.getByTestId('record-drawer').getByText('Owner').first()).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByText('Choose a linked table in field settings.').first()).toBeVisible()
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
  await page.getByRole('button', { name: 'Add field', exact: true }).click()

  const addFieldModal = page.getByRole('dialog', { name: 'Add field' })

  await addFieldModal.getByLabel('Field name').fill('Notes')
  await addFieldModal.getByLabel('Type').selectOption('longText')
  await addFieldModal.getByRole('button', { name: 'Add field' }).click()
  await expect(page.getByRole('status')).toHaveText('Field added.')
  await expect(page.getByRole('columnheader', { name: /Notes/ }).first()).toBeVisible()
  await page.getByRole('columnheader', { name: /Notes/ }).first().locator('.grid-field-menu-trigger').click()
  await page.getByRole('menuitem', { name: 'Edit field' }).click()

  const settingsModal = page.getByRole('dialog', { name: 'Field settings' })

  await settingsModal.getByLabel('Field name').fill('Internal notes')
  await settingsModal.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('columnheader', { name: /Internal notes/ }).first()).toBeVisible()
  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByRole('columnheader', { name: /Internal notes/ }).first()).toBeVisible()
  await page.getByRole('columnheader', { name: /Internal notes/ }).first().locator('.grid-field-menu-trigger').click()
  await page.getByRole('menuitem', { name: 'Delete field' }).click()
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

test('Daily support actions open real local surfaces', async ({ page }) => {
  await page.goto('/#tasks')
  await page.getByRole('button', { name: 'Open dependency editor' }).click()
  await expect(page.getByTestId('record-drawer')).toBeVisible()
  await page.getByTestId('record-drawer').getByRole('button', { name: 'Close' }).click()

  await page.goto('/#followups')
  await page.getByRole('button', { name: 'Adjust rule' }).click()
  await expect(page.getByTestId('build-screen')).toBeVisible()

  await page.goto('/#meetings')
  await expect(page.getByTestId('meeting-prep').getByText('Computed prep').first()).toBeVisible()
  await expect(page.getByTestId('meeting-prep').getByText('Source records').first()).toBeVisible()
  await expect(page.getByTestId('meeting-agenda').getByText('Generated agenda').first()).toBeVisible()
  await expect(page.getByTestId('meeting-agenda').getByText('Assign next steps.').first()).toBeVisible()
  await expect(page.getByTestId('meeting-agenda').getByRole('button', { name: 'Copy agenda' }).first()).toBeVisible()
  await expect(page.getByTestId('meeting-agenda').getByRole('button', { name: 'Export .md' }).first()).toBeVisible()
  await page.getByTestId('meeting-agenda').getByRole('button', { name: 'Preview digest' }).first().click()
  await expect(page.getByTestId('agenda-digest-preview').getByText('Daily digest preview.').first()).toBeVisible()
  await expect(page.getByTestId('agenda-digest-preview').getByText('Agenda items: 5. Source records: 2.').first()).toBeVisible()
  await expect(page.getByTestId('meeting-prep').getByText('Next steps').first()).toBeVisible()
  await page.getByRole('button', { name: 'Open next meeting' }).click()
  await expect(page.getByTestId('record-drawer')).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByTestId('meeting-prep')).toBeVisible()
})

test('Settings exposes local engine and Rule destination health', async ({ page }) => {
  await page.goto('/#settings')

  await expect(page.getByRole('heading', { name: 'Browser state.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Paper Light' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sunrise Soft' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Paper Light' }).click()
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'paper-light')
  await expect(page.getByRole('button', { name: 'Paper Light' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Write gate. Disabled. No Firestore writes can run in this build.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Read targets.' })).toBeVisible()
  await expect(page.getByTestId('rule-destination-grid').getByText('Today')).toBeVisible()
  await expect(page.getByTestId('rule-destination-grid').getByText('Timeline')).toBeVisible()
})

test('Mobile keeps navigation and touch targets usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#build')

  const railPosition = await page.locator('.rail').evaluate((element) => window.getComputedStyle(element).position)
  const buildLinkHeight = await page.getByRole('link', { name: 'Build' }).evaluate((element) => element.getBoundingClientRect().height)

  expect(railPosition).toBe('fixed')
  expect(buildLinkHeight).toBeGreaterThanOrEqual(44)
  await expect(page.getByTestId('build-screen')).toBeVisible()
})
