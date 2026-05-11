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
    if (!window.localStorage.getItem('sundesk-build-cells-seeded')) {
      window.localStorage.removeItem('sundesk-build-view-state-v1')
      window.localStorage.removeItem('sundesk-local-workbase-v1')
      window.localStorage.setItem('sundesk-build-cells-seeded', 'true')
    }
    window.localStorage.setItem('sundesk-theme', 'moss-paper')
    window.localStorage.setItem('sundesk-education-state-v1', JSON.stringify(state))
  }, dismissedEducationState)
})

test('Build checkbox cells toggle with one click and persist after reload', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await page.getByRole('button', { name: 'Add column' }).click()
  const addColumnModal = page.getByTestId('build-add-column-menu')

  await addColumnModal.getByLabel('Column name').fill('Ready')
  await addColumnModal.getByLabel('Type').selectOption('checkbox')
  await addColumnModal.getByRole('button', { name: 'Add column' }).click()

  const firstReadyCell = page.locator('[data-testid$="-ready"]').first()

  await expect(firstReadyCell).toContainText('No')
  await firstReadyCell.click()
  await expect(firstReadyCell.locator('.saved-check')).toHaveClass(/checked/)

  await page.reload()
  await expect(page.locator('[data-testid$="-ready"]').first().locator('.saved-check')).toHaveClass(/checked/)
})

test('Build cell keyboard editing supports escape cancel, tab commit, and focus movement', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await page.getByRole('button', { name: 'Add column' }).click()
  let addColumnModal = page.getByTestId('build-add-column-menu')

  await addColumnModal.getByLabel('Column name').fill('Keyboard notes')
  await addColumnModal.getByRole('button', { name: 'Add column' }).click()

  await page.getByRole('button', { name: 'Add column' }).click()
  addColumnModal = page.getByTestId('build-add-column-menu')
  await addColumnModal.getByLabel('Column name').fill('Next field')
  await addColumnModal.getByRole('button', { name: 'Add column' }).click()

  const firstNotesCell = page.locator('[data-testid$="-keyboard_notes"]').first()

  await firstNotesCell.click()
  await firstNotesCell.press('Enter')
  await page.getByLabel('Keyboard notes editor').fill('Should not save')
  await page.getByLabel('Keyboard notes editor').press('Escape')
  await expect(firstNotesCell).not.toContainText('Should not save')

  await firstNotesCell.press('Enter')
  await page.getByLabel('Keyboard notes editor').fill('Saved from keyboard')
  await page.getByLabel('Keyboard notes editor').press('Tab')
  await expect(firstNotesCell).toContainText('Saved from keyboard')

  await expect(page.locator('[data-testid$="-next_field"]').first()).toBeFocused()
})

test('Build arrow keys move cell focus through the grid', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const firstDueDateCell = page.locator('[data-testid$="-dueDate"]').first()
  const secondDueDateCell = page.locator('[data-testid$="-dueDate"]').nth(1)
  const secondPriorityCell = page.locator('[data-testid$="-priority"]').nth(1)

  await firstDueDateCell.click()
  await firstDueDateCell.press('ArrowDown')
  await expect(secondDueDateCell).toBeFocused()

  await secondDueDateCell.press('ArrowRight')
  await expect(secondPriorityCell).toBeFocused()
})
