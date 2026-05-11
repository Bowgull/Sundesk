import { expect, test, type Page } from '@playwright/test'

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
    if (!window.localStorage.getItem('sundesk-build-fields-seeded')) {
      window.localStorage.removeItem('sundesk-build-view-state-v1')
      window.localStorage.removeItem('sundesk-local-workbase-v1')
      window.localStorage.setItem('sundesk-build-fields-seeded', 'true')
    }
    window.localStorage.setItem('sundesk-theme', 'moss-paper')
    if (!window.localStorage.getItem('sundesk-education-state-v1')) {
      window.localStorage.setItem('sundesk-education-state-v1', JSON.stringify(state))
    }
  }, dismissedEducationState)
})

async function openColumnMenu(page: Page, columnName: RegExp | string) {
  const header = page.getByRole('columnheader', { name: columnName }).first()

  await header.locator('.grid-field-menu-trigger').click()
}

test('Build field lifecycle persists add, rename, behavior change, resize, and delete', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await page.getByRole('button', { name: 'Add column' }).click()
  await expect(page.getByRole('dialog', { name: 'Add column' })).toHaveCount(0)
  const addColumnModal = page.getByTestId('build-add-column-menu')

  await addColumnModal.getByLabel('Column name').fill('Launch notes')
  await addColumnModal.getByRole('button', { name: 'Add column' }).click()
  await expect(page.getByRole('columnheader', { name: /Launch notes/ }).first()).toBeVisible()

  const firstNotesCell = page.locator('[data-testid$="-launch_notes"]').first()

  await firstNotesCell.click()
  await firstNotesCell.press('Enter')
  await page.getByLabel('Launch notes editor').fill('Wrap, Permit')
  await page.getByLabel('Launch notes editor').press('Enter')
  await expect(firstNotesCell).toContainText('Wrap, Permit')

  await openColumnMenu(page, /Launch notes/)
  await page.getByRole('menuitem', { name: 'Rename' }).click()
  await expect(page.getByRole('dialog', { name: 'Column settings' })).toHaveCount(0)
  const settingsModal = page.getByTestId('build-column-settings-menu')

  await settingsModal.getByLabel('Column name').fill('Launch tags')
  await settingsModal.getByLabel('Type').selectOption('multiSelect')
  await settingsModal.locator('textarea').fill('Wrap, Permit, COI')
  await settingsModal.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('columnheader', { name: /Launch tags/ }).first()).toBeVisible()
  await expect(page.locator('[data-testid$="-launch_notes"]').first().locator('.select-tag')).toContainText(['Wrap', 'Permit'])

  await page.getByTestId('record-table-wrap').first().evaluate((element) => {
    element.scrollLeft = 0
  })
  const titleHeader = page.getByRole('columnheader', { name: /Title/ }).first()
  const titleWidthBefore = await titleHeader.boundingBox()
  const resizer = page.getByLabel('Resize Title').first()
  const resizerBox = await resizer.boundingBox()

  if (!titleWidthBefore || !resizerBox) {
    throw new Error('Missing title column bounds.')
  }

  await page.mouse.move(resizerBox.x + resizerBox.width / 2, resizerBox.y + resizerBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(resizerBox.x + 100, resizerBox.y + resizerBox.height / 2, { steps: 5 })
  await page.mouse.up()
  await page.waitForTimeout(100)
  const titleWidthAfter = await titleHeader.boundingBox()

  expect(titleWidthAfter?.width || 0).toBeGreaterThan(titleWidthBefore.width)
  await page.reload()
  const titleWidthReloaded = await page.getByRole('columnheader', { name: /Title/ }).first().boundingBox()

  expect(titleWidthReloaded?.width || 0).toBeGreaterThan(titleWidthBefore.width)
  await expect(page.getByRole('columnheader', { name: /Launch tags/ }).first()).toBeVisible()
  await expect(page.locator('[data-testid$="-launch_notes"]').first().locator('.select-tag')).toContainText(['Wrap', 'Permit'])

  await openColumnMenu(page, /Launch tags/)
  await page.getByRole('menuitem', { name: 'Delete column' }).click()
  await page.getByRole('dialog', { name: 'Delete column' }).getByRole('button', { name: 'Delete column' }).click()
  await expect(page.getByRole('columnheader', { name: /Launch tags/ })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('columnheader', { name: /Launch tags/ })).toHaveCount(0)
})

test('Build protects primary and computed columns from destructive field actions', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await openColumnMenu(page, /Title/)
  await expect(page.getByRole('menuitem', { name: 'Delete column' })).toBeDisabled()

  await page.getByRole('button', { name: 'Add column' }).click()
  const addColumnModal = page.getByTestId('build-add-column-menu')

  await addColumnModal.getByLabel('Column name').fill('Event date lookup')
  await addColumnModal.getByLabel('Type').selectOption('lookup')
  await addColumnModal.getByRole('button', { name: 'Add column' }).click()
  await expect(page.getByRole('columnheader', { name: /Event date lookup/ }).first()).toBeVisible()
  await expect(page.locator('[data-testid$="-event_date_lookup"]').first()).toHaveClass(/selected-grid-cell|/)

  await page.locator('[data-testid$="-event_date_lookup"]').first().dblclick()
  await expect(page.getByLabel('Event date lookup editor')).toHaveCount(0)
})
