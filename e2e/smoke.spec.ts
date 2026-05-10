import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test.beforeEach(async ({ page }) => {
  const consoleErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Start with what can slip.' })).toBeVisible()
  expect(consoleErrors).toEqual([])
})

test('Lindsay install basics are present and local no-config opens Today', async ({ page }) => {
  await expect(page).toHaveTitle('Sundesk')
  await expect(page.locator('head link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
  await expect(page.locator('head link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png')
  await expect(page.locator('head link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')
  await expect(page.locator('head meta[name="application-name"]')).toHaveAttribute('content', 'Sundesk')
  await expect(page.locator('head meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'Sundesk')

  const manifest = await page.request.get('/manifest.webmanifest')
  await expect(manifest).toBeOK()
  const manifestBody = await manifest.json()

  expect(manifestBody).toMatchObject({
    name: 'Sundesk',
    short_name: 'Sundesk',
  })
})

test('Today renders local lanes, rule receipts, and dependency receipts', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Start with what can slip.' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' })).toBeVisible()
  await expect(page.getByTestId('rail-workspace-card')).not.toHaveAttribute('open', '')
  await expect(page.getByTestId('rail-system-read-card')).not.toHaveAttribute('open', '')
  await expect(page.getByTestId('today-counts')).not.toHaveAttribute('open', '')
  await expect(page.getByRole('button', { name: 'Preview summary' })).toBeDisabled()
  await expect(page.getByTestId('today-first-read')).toContainText('Now')
  await expect(page.getByTestId('today-first-read')).toContainText('Waiting')
  await expect(page.getByTestId('today-first-read')).toContainText('Next')
  await expect(page.getByTestId('today-first-read')).toContainText('Changed')
  await expect(page.getByTestId('today-first-read')).toContainText('Can slip')
  await expect(page.getByTestId('today-focus')).toContainText('Touch first')
  await expect(page.getByTestId('today-focus')).toContainText('Confirm COI status.')
  await expect(page.getByTestId('today-focus')).toContainText('Status is Blocked.')
  await expect(page.getByTestId('today-lane-now')).toBeVisible()
  await expect(page.getByTestId('today-lane-waiting')).toBeVisible()
  await expect(page.getByTestId('today-lane-next')).toBeVisible()
  await expect(page.getByTestId('today-lane-rules')).toHaveCount(0)
  await page.getByText('Show why items surfaced').click()
  await expect(page.getByTestId('today-rule-receipts').getByText('Rule matched').first()).toBeVisible()
  await expect(page.getByTestId('today-rule-receipts').getByText('No send happened').first()).toBeVisible()
  await expect(page.getByTestId('today-lane-now').getByText('Blocked by: Venue readiness may slip.')).toBeVisible()
  await page.getByLabel(/Confirm COI status.*workflow tags/).getByRole('button', { name: 'COI' }).click()
  await expect(page.getByTestId('build-screen')).toBeVisible()
  await expect(page.getByLabel('Filter')).toHaveValue('COI')
  await expect(page.getByRole('row', { name: /Confirm COI status/ })).toBeVisible()
  await expect(page.getByRole('row', { name: /Send permit nudge/ })).toBeHidden()
  await expect(page.getByRole('status')).toContainText('Tag route opened: COI.')
})

test('Build renders table workshop, record drawer, dependency editor, and Rules panel', async ({ page }) => {
  await page.goto('/#build')

  await expect(page.getByRole('heading', { name: 'Build is freeform first.' })).toBeVisible()
  await expect(page.getByTestId('build-table-tasks')).toBeVisible()
  await page.getByTestId('build-table-tasks').click()

  await expect(page.getByRole('tab', { name: /Work/ })).toHaveAttribute('aria-selected', 'true')
  await page.getByTestId('edit-record-task_coi_halifax').click()
  await expect(page.getByTestId('record-drawer')).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByLabel('Record status')).toContainText('Blocked')
  await expect(page.getByTestId('record-drawer').getByLabel('Record status')).toContainText('2026-05-12')
  await expect(page.getByTestId('record-drawer').getByText('Linked records')).toBeVisible()
  await expect(page.getByTestId('dependency-editor')).toBeVisible()
  await expect(page.getByTestId('dependency-editor').getByPlaceholder('Search records')).toBeVisible()
  await expect(page.getByTestId('dependency-editor').getByRole('button', { name: 'Add dependency' })).toBeDisabled()
  await expect(page.getByTestId('rules-panel').getByRole('heading', { name: 'When this happens, do this.' })).toBeVisible()
  await expect(page.getByTestId('rules-panel').getByText('matches').first()).toBeVisible()
  await expect(page.getByTestId('local-rule-row').first().getByRole('button', { name: 'Edit' })).toBeVisible()
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
  await page.getByTestId('edit-record-task_meeting_charlottetown').click()

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

test('Build paste shows post-paste helpers', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByRole('tab', { name: /Work/ })).toHaveAttribute('aria-selected', 'true')
  const titleCell = page.getByTestId('grid-cell-task_coi_halifax-title')

  await titleCell.click()
  await titleCell.evaluate((element) => {
    const clipboardData = new DataTransfer()

    clipboardData.setData('text/plain', 'Pasted task\tWaiting')
    element.dispatchEvent(new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData,
    }))
  })

  await expect(page.getByLabel('Post-paste helpers')).toContainText('Rows')
  await expect(page.getByLabel('Post-paste helpers')).toContainText('0 new. 1 updated.')
  await expect(page.getByLabel('Post-paste helpers')).toContainText('Title, Status')
  await expect(page.getByLabel('Post-paste helpers')).toContainText('Status reads as a select field.')
  await expect(page.getByLabel('Paste apply controls')).toContainText('Use Status')
  await page.getByRole('button', { name: 'Use Status' }).click()
  await expect(page.getByRole('status')).toContainText('Status behavior applied.')

  await page.getByRole('button', { name: 'Add field', exact: true }).click()
  const addFieldModal = page.getByRole('dialog', { name: 'Add field' })
  await addFieldModal.getByLabel('Field name').fill('Imported tags')
  await addFieldModal.getByRole('button', { name: 'Add field' }).click()
  await expect(page.getByRole('columnheader', { name: /Imported tags/ }).first()).toBeVisible()

  const importedTagsCell = page.getByTestId('grid-cell-task_coi_halifax-imported_tags')
  await importedTagsCell.click()
  await importedTagsCell.evaluate((element) => {
    const clipboardData = new DataTransfer()

    clipboardData.setData('text/plain', 'Permit, Waiting')
    element.dispatchEvent(new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData,
    }))
  })

  await expect(page.getByLabel('Post-paste helpers')).toContainText('Imported tags may be tags.')
  await page.getByRole('button', { name: 'Use Imported tags as tags' }).click()
  await expect(page.getByRole('status')).toContainText('Imported tags behavior applied. Values migrated.')
  await expect(importedTagsCell.locator('.select-tag')).toContainText(['Permit', 'Waiting'])
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

  await page.getByText('Table options').click()
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
  await expect(page.getByRole('tab', { name: /Work/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('View')).toBeVisible()
  await expect(page.getByLabel('Filter')).toBeVisible()
  await expect(page.getByText('Shape grid')).toBeVisible()
  await page.getByText('Shape grid').click()
  await expect(page.getByLabel('Fields')).toBeVisible()
  await expect(page.getByLabel('Sort')).toBeVisible()
  await expect(page.getByLabel('Group')).toBeVisible()
  await expect(page.getByLabel('Colour')).toBeVisible()
  await expect(page.getByLabel('Density')).toBeVisible()

  await page.getByLabel('Density').selectOption('compact')
  await expect(page.locator('.record-table').first()).toHaveClass(/density-compact/)

  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await page.getByText('Shape grid').click()
  await expect(page.getByLabel('Density')).toHaveValue('compact')
  await expect(page.locator('.record-table').first()).toHaveClass(/density-compact/)
})

test('Build toolbar colour applies semantic row tinting', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await page.getByText('Shape grid').click()
  await page.getByLabel('Colour').selectOption('status')
  await expect(page.getByRole('row', { name: /Confirm COI status/ })).toHaveClass(/grid-row-color-coral/)
  await expect(page.getByRole('row', { name: /Send permit nudge/ })).toHaveClass(/grid-row-color-gold/)
  await expect(page.getByRole('row', { name: /Build Charlottetown meeting prep/ })).toHaveClass(/grid-row-color-lavender/)
})

test('Build chips use semantic colour and field type treatment', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('edit-record-task_coi_halifax').click()

  await expect(page.getByTestId('grid-cell-task_coi_halifax-status').locator('.select-tag')).toHaveClass(/chip-coral/)
  await expect(page.getByTestId('grid-cell-task_permit_moncton-status').locator('.select-tag')).toHaveClass(/chip-gold/)
  await expect(page.getByTestId('grid-cell-task_meeting_charlottetown-status').locator('.select-tag')).toHaveClass(/chip-lavender/)
  await expect(page.getByTestId('grid-cell-task_coi_halifax-tags').getByText('COI')).toBeVisible()
  await page.getByLabel('Tag workflow routes').getByRole('button', { name: 'Permit' }).click()
  await expect(page.getByRole('row', { name: /Send permit nudge/ })).toBeVisible()
  await expect(page.getByRole('row', { name: /Confirm COI status/ })).toBeHidden()
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
  await page.getByTestId('edit-record-task_meeting_charlottetown').click()

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
  await page.getByTestId('edit-record-task_meeting_charlottetown').click()

  const editor = page.getByTestId('dependency-editor')

  await editor.getByPlaceholder('Search records').fill('permit')
  await editor.getByRole('button', { name: /Permit approval/ }).click()
  await editor.getByPlaceholder('Why this link matters').fill('Permit needs agenda context.')
  await editor.getByRole('button', { name: 'Add dependency' }).click()
  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('edit-record-task_meeting_charlottetown').click()

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
  await expect(page.getByRole('tab', { name: /Partners/ })).toHaveAttribute('aria-selected', 'true')
  await page.getByText('Table options').click()
  await page.getByRole('button', { name: 'Rename' }).click()

  const settingsModal = page.getByRole('dialog', { name: 'Table settings' })

  await settingsModal.getByLabel('Table name').fill('Vendors')
  await settingsModal.getByRole('button', { name: 'Save table' }).click()
  await expect(page.getByRole('tab', { name: /Vendors/ })).toHaveAttribute('aria-selected', 'true')
  await page.reload()
  await expect(page.getByRole('tab', { name: /Vendors/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByTestId('build-table-partners').getByText('Vendors')).toBeVisible()
})

test('Build table delete repairs linked fields and persists', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-people').click()
  await page.getByText('Table options').click()
  await page.getByRole('button', { name: 'Delete table' }).click()
  await page.getByRole('dialog', { name: 'Delete table' }).getByRole('button', { name: 'Delete table' }).click()
  await expect(page.getByTestId('build-table-people')).toBeHidden()
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('edit-record-task_coi_halifax').click()
  await expect(page.getByTestId('record-drawer').getByText('Owner').first()).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByText('Choose a linked table in field settings.').first()).toBeVisible()

  await page.reload()
  await expect(page.getByTestId('build-table-people')).toBeHidden()
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('edit-record-task_coi_halifax').click()
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
  await expect(page.getByRole('tab', { name: /Work/ })).toHaveAttribute('aria-selected', 'true')

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
  await expect(rule.getByText('Work.Status is "Blocked". show in screen: Today.')).toBeVisible()
  await expect(rule.getByText('1 matches')).toBeVisible()
  await page.reload()
  await page.getByTestId('build-table-tasks').click()

  const persistedRule = page.getByTestId('local-rule-row').first()

  await expect(persistedRule.getByText('Work.Status is "Blocked". show in screen: Today.')).toBeVisible()
  await expect(persistedRule.getByText('1 matches')).toBeVisible()
  await page.goto('/#today')
  await page.getByText('Show why items surfaced').click()
  await expect(page.getByTestId('today-rule-receipts').getByText('No send happened').first()).toBeVisible()
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
  await expect(page.getByRole('heading', { name: 'Timeline has 5 ways to look.' })).toBeVisible()
  await expect(page.getByTestId('timeline-mode-receipt')).toContainText('Question')
  await expect(page.getByTestId('timeline-mode-receipt')).toContainText('Which rows need a clean read.')

  await page.getByPlaceholder('Find records').fill('permit')

  await expect(page.getByTestId('timeline-row-task_permit_moncton')).toBeVisible()
  await expect(page.getByTestId('timeline-row-approval_permit_moncton')).toBeVisible()
  await expect(page.getByTestId('timeline-list').getByText('Rule: Work.Due date is within 7 days. show in screen: Timeline.')).toBeVisible()
  await page.getByRole('tab', { name: 'Kanban' }).click()
  await expect(page.getByTestId('timeline-mode-receipt')).toContainText('Where is the work stuck.')
  await expect(page.getByTestId('timeline-kanban')).toBeVisible()
  await page.getByLabel('Waiting lane').getByRole('button', { name: 'Move to In progress' }).click()
  await expect(page.getByLabel('In progress lane')).toContainText('Send permit nudge')
  await expect(page.getByRole('status')).toContainText('Send permit nudge. moved to In progress.')
  await page.getByRole('tab', { name: 'Calendar' }).click()
  await expect(page.getByTestId('timeline-mode-receipt')).toContainText('Which dates are carrying pressure.')
  await expect(page.getByTestId('timeline-calendar')).toBeVisible()
  await expect(page.getByTestId('timeline-calendar').getByLabel('Calendar date focus')).toBeVisible()
  await page.getByTestId('timeline-calendar').getByLabel('Calendar date focus').getByRole('button', { name: /2026-05-13/ }).click()
  await expect(page.getByTestId('timeline-calendar').getByLabel('Calendar day detail')).toContainText('Send permit nudge')
  await page.getByRole('tab', { name: 'Timeline' }).click()
  await expect(page.getByTestId('timeline-mode-receipt')).toContainText('Which places are ready before event day.')
  await expect(page.getByTestId('timeline-readiness')).toBeVisible()
  await expect(page.getByTestId('timeline-readiness').getByLabel('Readiness place focus')).toBeVisible()
  await page.getByTestId('timeline-readiness').getByLabel('Readiness place focus').getByRole('button', { name: 'Moncton' }).click()
  await expect(page.getByTestId('timeline-readiness').getByLabel('Readiness place focus')).toContainText('Moncton')
  await expect(page.getByTestId('timeline-readiness').getByLabel('Focused readiness rows')).toContainText('Send permit nudge')
  await page.getByRole('tab', { name: 'Graph' }).click()
  await expect(page.getByTestId('timeline-mode-receipt')).toContainText('Why is this place at risk.')
  await expect(page.getByTestId('timeline-graph')).toBeVisible()
  await expect(page.getByTestId('timeline-graph').getByLabel('Graph place focus')).toBeVisible()
  await page.getByTestId('timeline-graph').getByLabel('Graph place focus').getByRole('button', { name: 'Moncton' }).click()
  await expect(page.getByTestId('timeline-graph').locator('.graph-node.center')).toContainText('Moncton')
  await page.getByLabel('Timeline tag routes').getByRole('button', { name: 'Permit' }).click()
  await expect(page.getByTestId('build-screen')).toBeVisible()
  await expect(page.getByLabel('Filter')).toHaveValue('Permit')
  await expect(page.getByRole('row', { name: /Send permit nudge/ })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Tag route opened: Permit.')
})

test('Daily support actions open real local surfaces', async ({ page }) => {
  await page.goto('/#communities')
  await expect(page.getByTestId('community-place-detail')).toContainText('Place detail')
  await expect(page.getByTestId('community-place-detail')).toContainText('Readiness')
  await expect(page.getByTestId('community-place-detail')).toContainText('Linked rows')
  await page.getByRole('button', { name: /Moncton/ }).click()
  await expect(page.getByTestId('community-place-detail')).toContainText('Moncton')
  await page.getByTestId('community-place-detail').getByLabel('Place quick edit').getByLabel('Readiness').fill('73')
  await expect(page.getByTestId('community-place-detail')).toContainText('73%')
  await page.getByTestId('community-place-detail').getByLabel('Place quick edit').getByLabel('Status').selectOption('Blocked')
  await expect(page.getByTestId('community-place-detail')).toContainText('Blocked')
  await page.getByRole('button', { name: /Halifax/ }).click()
  await expect(page.getByTestId('community-place-detail')).toContainText('Halifax')
  await page.getByTestId('community-place-detail').getByLabel('Community routes').getByRole('button', { name: 'Work' }).click()
  await expect(page.getByTestId('build-screen')).toBeVisible()
  await expect(page.getByTestId('build-table-tasks')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('Filter')).toHaveValue('Halifax')
  await expect(page.getByRole('row', { name: /Confirm COI status/ })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Community route opened: Work.')
  await page.goto('/#communities')
  await page.getByRole('button', { name: /Halifax/ }).click()
  await page.getByTestId('community-place-detail').getByLabel('Add linked row').selectOption('task_permit_moncton')
  await page.getByTestId('community-place-detail').getByRole('button', { name: 'Add' }).click()
  await expect(page.getByTestId('community-place-detail')).toContainText('Send permit nudge')
  await page.getByTestId('community-place-detail').getByLabel('New linked row').selectOption('tasks')
  await page.getByTestId('community-place-detail').getByLabel('Title').fill('Call site lead')
  await page.getByTestId('community-place-detail').locator('.community-link-row-actions', { hasText: 'New linked row' }).getByLabel('Status').selectOption('Waiting')
  await page.getByTestId('community-place-detail').getByLabel('Due date').fill('2026-05-20')
  await page.getByTestId('community-place-detail').locator('.community-link-row-actions', { hasText: 'New linked row' }).getByLabel('Priority').selectOption('Fire')
  await page.getByTestId('community-place-detail').getByLabel('Tags').fill('Prep, Permit')
  await page.getByTestId('community-place-detail').getByRole('button', { name: 'Create' }).click()
  await expect(page.getByTestId('community-place-detail')).toContainText('Call site lead')
  await expect(page.getByTestId('community-place-detail')).toContainText('Waiting')
  await expect(page.getByTestId('community-place-detail')).toContainText('2026-05-20')
  await expect(page.getByTestId('community-place-detail')).toContainText('Fire · Prep, Permit')
  await page.getByTestId('community-place-detail').locator('.community-linked-row').first().getByLabel('Status').selectOption('In progress')
  await expect(page.getByTestId('community-place-detail')).toContainText('In progress')
  await page.getByTestId('community-place-detail').locator('.community-linked-row', { hasText: 'Send permit nudge' }).getByRole('button', { name: 'Remove' }).click()
  await expect(page.getByTestId('community-place-detail').locator('.community-linked-row', { hasText: 'Send permit nudge' })).toHaveCount(0)
  await page.getByTestId('community-place-detail').getByRole('button', { name: 'Open record' }).click()
  await expect(page.getByTestId('community-detail-command')).toContainText('Readiness')
  await expect(page.getByTestId('community-detail-command')).toContainText('Blockers')
  await expect(page.getByTestId('community-detail-command')).toContainText('Next action')

  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('edit-record-task_coi_halifax').click()
  await expect(page.getByTestId('record-drawer')).toBeVisible()

  await page.goto('/#followups')
  await page.getByRole('button', { name: 'Adjust rule' }).click()
  await expect(page.getByTestId('build-screen')).toBeVisible()

  await page.goto('/#meetings')
  await expect(page.getByTestId('meeting-prep').getByText('Computed prep').first()).toBeVisible()
  await expect(page.getByTestId('meeting-weekly-note').getByText('Generated weekly note').first()).toBeVisible()
  await expect(page.getByTestId('meeting-weekly-note').getByLabel('Weekly note fields')).toContainText('Meeting date')
  await expect(page.getByTestId('meeting-weekly-note').getByLabel('Weekly note fields')).toContainText('Note state')
  await page.getByTestId('meeting-weekly-note').getByRole('textbox', { name: 'Decisions' }).fill('- Hold permit call.')
  await expect(page.getByLabel('Weekly note draft').first()).toContainText('## Decisions\n- Hold permit call.')
  await expect(page.getByTestId('meeting-weekly-note').getByLabel('Routed source inserts')).toContainText('In progress by 2026-05-14 belongs in next steps.')
  await page.getByTestId('meeting-weekly-note').getByLabel('Routed source inserts').getByRole('button').filter({ hasText: 'Build Charlottetown meeting prep.' }).click()
  await expect(page.getByLabel('Weekly note draft').first()).toContainText('## Next steps')
  await page.getByTestId('meeting-weekly-note').getByRole('button', { name: 'Open source record Build Charlottetown meeting prep.' }).click()
  await expect(page.getByTestId('build-screen')).toBeVisible()
  await expect(page.getByTestId('record-drawer')).toContainText('Build Charlottetown meeting prep.')
  await expect(page.getByRole('status')).toContainText('Meeting source opened: Build Charlottetown meeting prep.')
  await page.goto('/#meetings')
  await page.getByLabel('Weekly note draft').first().fill('## Decisions\n- Move vendor call to Monday.')
  await expect(page.getByLabel('Weekly note draft').first()).toHaveValue('## Decisions\n- Move vendor call to Monday.')
  await page.reload()
  await expect(page.getByLabel('Weekly note draft').first()).toHaveValue('## Decisions\n- Move vendor call to Monday.')
  await expect(page.getByTestId('meeting-weekly-note').getByLabel('Weekly note fields')).toContainText('Saved draft')
  await expect(page.getByTestId('meeting-weekly-note').getByRole('button', { name: 'Copy note' }).first()).toBeVisible()
  await expect(page.getByTestId('meeting-weekly-note').getByRole('button', { name: 'Export note' }).first()).toBeVisible()
  await expect(page.getByTestId('meeting-prep').getByText('Source records').first()).toBeVisible()
  await expect(page.getByTestId('meeting-agenda').getByText('Generated agenda').first()).toBeVisible()
  await expect(page.getByTestId('meeting-agenda').getByText('Assign next steps.').first()).toBeVisible()
  await expect(page.getByTestId('meeting-agenda').getByRole('button', { name: 'Copy agenda' }).first()).toBeVisible()
  await expect(page.getByTestId('meeting-agenda').getByRole('button', { name: 'Export .md' }).first()).toBeVisible()
  await page.getByTestId('meeting-agenda').getByRole('button', { name: 'Preview summary' }).first().click()
  await expect(page.getByTestId('agenda-digest-preview').getByText('Command send preview.').first()).toBeVisible()
  await expect(page.getByTestId('agenda-digest-preview').getByText('Agenda items: 5. Source records: 2.').first()).toBeVisible()
  await expect(page.getByTestId('meeting-prep').getByText('Next steps').first()).toBeVisible()
  await page.getByRole('button', { name: 'Open next meeting' }).click()
  await expect(page.getByTestId('record-drawer')).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByTestId('meeting-prep')).toBeVisible()
})

test('Settings keeps data status visible and engine details manual', async ({ page }) => {
  await page.goto('/#settings')

  await expect(page.getByRole('heading', { name: 'Local workspace.' })).toBeVisible()
  const sensitiveStorageMessage = 'Sensitive details are stored at your own risk.'
  const dataRiskNote = 'Avoid files, document contents, private numbers, permit details, COI contents, and contract text unless you intend to store them here.'

  await expect(page.getByText(sensitiveStorageMessage)).toBeVisible()
  await expect(page.getByText(dataRiskNote)).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: sensitiveStorageMessage })).toHaveCount(0)
  await expect(page.getByRole('banner').filter({ hasText: sensitiveStorageMessage })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Local copy.' })).toBeVisible()
  await expect(page.getByText('Backup controls are local commands. They do not change Firebase setup or write remote data.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export backup' })).toBeEnabled()
  await expect(page.getByText('Import backup', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Import Sundesk backup JSON file')).toBeEnabled()
  await expect(page.getByText('Backup handlers are not connected in this build.')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Readiness.' })).toBeVisible()
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Local backup rehearsal')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Firebase config')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Deploy approval')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Firestore writes')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('No Firebase writes')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Backup export and import rehearsal is done.')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('6 config fields missing. Add Firebase config before hosted use.')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Write gate is disabled. No remote writes can run in this build.')
  await expect(page.getByText('Access. Local browser mode. No sign-in required.')).toBeVisible()
  await expect(page.getByText('Workspace. Local workspace active.')).toBeVisible()
  await expect(page.getByText('Firebase setup. Local mode. 6 config fields missing. 0 approved accounts in local config.')).toBeVisible()
  await expect(page.getByText('Recipient. Configure in the private deploy environment.')).toBeVisible()
  await expect(page.getByText('Next setup step. Add Firebase config and approved accounts before hosted use.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Command Center' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Command Center' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Graphite' }).click()
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'graphite')
  await expect(page.getByRole('button', { name: 'Graphite' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Write gate. Disabled. No Firestore writes can run in this build.')).toBeVisible()
  await expect(page.getByText('Read shadow. Off. Local storage is the active source.')).toBeVisible()
  await expect(page.getByText('Show workspace counts')).toBeVisible()
  await page.getByText('Show command routing').click()
  await expect(page.getByTestId('rule-destination-grid').getByText('Today')).toBeVisible()
  await expect(page.getByTestId('rule-destination-grid').getByText('Timeline')).toBeVisible()
  await page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Today' }).click()
  await expect(page.getByRole('heading', { name: 'Start with what can slip.' })).toBeVisible()
  await page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' }).click()
  await expect(page.getByRole('heading', { name: 'Build is freeform first.' })).toBeVisible()
})

test('Settings exports and imports a local backup without changing Firebase write UI', async ({ page }, testInfo) => {
  const originalTitle = 'Backup restore seed'
  const changedTitle = 'Backup restore changed'
  const fakeRecordId = 'tasks_backup_restore_seed'
  const firebaseSetupText = 'Firebase setup. Local mode. 6 config fields missing. 0 approved accounts in local config.'
  const writeGateText = 'Write gate. Disabled. No Firestore writes can run in this build.'
  const backupNoteText = 'Backup controls are local commands. They do not change Firebase setup or write remote data.'

  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('build-add-record').first().click()

  const modal = page.getByTestId('record-modal')

  await modal.getByLabel('Title').fill(originalTitle)
  await modal.getByLabel('Status').selectOption('Waiting')
  await modal.getByLabel('Due date').fill('2026-05-21')
  await modal.getByRole('button', { name: 'Add record' }).click()
  await modal.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('row', { name: new RegExp(originalTitle) })).toBeVisible()

  await page.goto('/#settings')
  await expect(page.getByText(backupNoteText)).toBeVisible()
  await expect(page.getByText(firebaseSetupText)).toBeVisible()
  await expect(page.getByText(writeGateText)).toBeVisible()

  const downloadPromise = page.waitForEvent('download')

  await page.getByRole('button', { name: 'Export backup' }).click()

  const download = await downloadPromise
  const backupPath = testInfo.outputPath('sundesk-local-backup.json')

  await download.saveAs(backupPath)

  const backup = JSON.parse(await readFile(backupPath, 'utf8')) as {
    appName?: unknown
    version?: unknown
    workbase?: {
      records?: Array<{
        id?: unknown
        values?: Record<string, unknown>
      }>
    }
  }
  const exportedRecord = backup.workbase?.records?.find((record) => record.id === fakeRecordId)

  expect(download.suggestedFilename()).toMatch(/^sundesk-local-backup-\d{4}-\d{2}-\d{2}\.json$/)
  expect(backup.appName).toBe('Sundesk')
  expect(backup.version).toBe(1)
  expect(exportedRecord?.values?.title).toBe(originalTitle)
  expect(exportedRecord?.values?.status).toBe('Waiting')

  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const titleCell = page.getByTestId(`grid-cell-${fakeRecordId}-title`)

  await titleCell.click()
  await titleCell.press('Enter')
  await page.getByLabel('Title editor').fill(changedTitle)
  await page.getByLabel('Title editor').press('Tab')
  await expect(page.getByRole('row', { name: new RegExp(changedTitle) })).toBeVisible()
  await expect(page.getByRole('row', { name: new RegExp(originalTitle) })).toBeHidden()

  await page.goto('/#settings')
  await expect(page.getByText(firebaseSetupText)).toBeVisible()
  await expect(page.getByText(writeGateText)).toBeVisible()

  const fileChooserPromise = page.waitForEvent('filechooser')

  await page.getByText('Import backup', { exact: true }).click()

  const fileChooser = await fileChooserPromise

  await fileChooser.setFiles(backupPath)
  await expect(page.getByRole('status')).toContainText('Local backup imported.')
  await expect(page.getByText(backupNoteText)).toBeVisible()
  await expect(page.getByText(firebaseSetupText)).toBeVisible()
  await expect(page.getByText(writeGateText)).toBeVisible()

  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByRole('row', { name: new RegExp(originalTitle) })).toBeVisible()
  await expect(page.getByRole('row', { name: new RegExp(changedTitle) })).toBeHidden()
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
