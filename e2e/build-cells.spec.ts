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

test('Build cell context menu clears a cell without opening a modal', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const titleCell = page.locator('[data-testid$="-title"]').first()

  await expect(titleCell).not.toContainText('Empty')
  await titleCell.click({ button: 'right' })
  const cellMenu = page.getByRole('menu', { name: 'Cell actions' })

  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(cellMenu).toBeVisible()
  await cellMenu.getByRole('menuitem', { name: 'Clear cell' }).click()
  await expect(titleCell).toContainText('Empty')
  await page.reload()
  await expect(page.locator('[data-testid$="-title"]').first()).toContainText('Empty')
})

test('Build paste keeps invalid numeric values empty instead of writing zero', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await page.getByRole('button', { name: 'Add column' }).click()
  const addColumnMenu = page.getByTestId('build-add-column-menu')

  await addColumnMenu.getByLabel('Column name').fill('Permit price')
  await addColumnMenu.getByLabel('Type').selectOption('currency')
  await addColumnMenu.getByRole('button', { name: 'Add column' }).click()

  const priceCell = page.locator('[data-testid$="-permit_price"]').first()

  await priceCell.click()
  await priceCell.evaluate((element, text) => {
    const clipboardData = new DataTransfer()

    clipboardData.setData('text/plain', text)
    const event = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData,
    })

    element.dispatchEvent(event)
  }, 'not a number')

  await expect(priceCell).toContainText('Empty')
  await expect(priceCell).not.toContainText('$0')
  await expect(page.getByLabel('Post-paste helpers')).toContainText('Permit price needs a number.')
  await page.reload()
  await expect(page.locator('[data-testid$="-permit_price"]').first()).toContainText('Empty')
})

test('Build paste keeps existing date values when pasted date text is invalid', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await page.getByRole('button', { name: 'Add column' }).click()
  const addColumnMenu = page.getByTestId('build-add-column-menu')

  await addColumnMenu.getByLabel('Column name').fill('Permit date')
  await addColumnMenu.getByLabel('Type').selectOption('date')
  await addColumnMenu.getByRole('button', { name: 'Add column' }).click()

  const dateCell = page.locator('[data-testid$="-permit_date"]').first()

  await dateCell.click()
  await dateCell.press('Enter')
  await page.getByLabel('Permit date editor').fill('2026-05-22')
  await page.getByLabel('Permit date editor').press('Enter')
  await expect(dateCell).toContainText('2026-05-22')

  await dateCell.click()
  await dateCell.evaluate((element, text) => {
    const clipboardData = new DataTransfer()

    clipboardData.setData('text/plain', text)
    const event = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData,
    })

    element.dispatchEvent(event)
  }, 'tomorrowish')

  await expect(dateCell).toContainText('2026-05-22')
  await expect(page.getByLabel('Post-paste helpers')).toContainText('Permit date needs a date.')
  await page.reload()
  await expect(page.locator('[data-testid$="-permit_date"]').first()).toContainText('2026-05-22')
})

test('Build paste keeps existing linked records when pasted text does not match a record', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const communityCell = page.getByTestId('grid-cell-task_permit_toronto-community')

  await expect(communityCell).toContainText('Toronto')
  await communityCell.click()
  await communityCell.evaluate((element, text) => {
    const clipboardData = new DataTransfer()

    clipboardData.setData('text/plain', text)
    const event = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData,
    })

    element.dispatchEvent(event)
  }, 'Atlantis')

  await expect(communityCell).toContainText('Toronto')
  await expect(page.getByLabel('Post-paste helpers')).toContainText('Community did not match a record.')
  await page.reload()
  await expect(page.getByTestId('grid-cell-task_permit_toronto-community')).toContainText('Toronto')
})
