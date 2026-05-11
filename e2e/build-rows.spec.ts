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

type StoredRecord = {
  id: string
  tableId: string
  values: Record<string, unknown>
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((state) => {
    if (!window.localStorage.getItem('sundesk-build-rows-seeded')) {
      window.localStorage.removeItem('sundesk-build-view-state-v1')
      window.localStorage.removeItem('sundesk-local-workbase-v1')
      window.localStorage.setItem('sundesk-build-rows-seeded', 'true')
    }
    window.localStorage.setItem('sundesk-theme', 'moss-paper')
    window.localStorage.setItem('sundesk-education-state-v1', JSON.stringify(state))
  }, dismissedEducationState)
})

async function getTaskRecords(page: Page) {
  return page.evaluate(() => {
    const stored = JSON.parse(window.localStorage.getItem('sundesk-local-workbase-v1') || '{"base":{"records":[]}}') as {
      base?: { records?: StoredRecord[] }
    }

    return stored.base?.records?.filter((record) => record.tableId === 'tasks') || []
  })
}

async function addBuildGridRow(page: Page, title: string) {
  await page.getByTestId('build-add-record').first().click()

  const record = (await getTaskRecords(page)).at(-1)

  if (!record) {
    throw new Error('Add row did not create a tasks record in local storage.')
  }

  await expect(page.getByLabel('Title editor')).toHaveValue(String(record.values.title || ''))
  await page.getByLabel('Title editor').fill(title)
  await page.getByLabel('Title editor').press('Enter')

  return record.id
}

test('Build row lifecycle persists add, primary edit, blank primary, long text, and many rows', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const firstRecordId = await addBuildGridRow(page, 'Row launch pressure')
  const firstTitleCell = page.getByTestId(`grid-cell-${firstRecordId}-title`)

  await expect(firstTitleCell).toContainText('Row launch pressure')

  await firstTitleCell.click()
  await firstTitleCell.press('Enter')
  await page.getByLabel('Title editor').fill('Row launch pressure renamed')
  await page.getByLabel('Title editor').press('Enter')
  await expect(firstTitleCell).toContainText('Row launch pressure renamed')

  const blankRecordId = await addBuildGridRow(page, '')
  const blankTitleCell = page.getByTestId(`grid-cell-${blankRecordId}-title`)

  await expect(blankTitleCell).toBeVisible()
  await expect(blankTitleCell).toContainText('Empty')

  await page.getByRole('button', { name: 'Add column' }).click()
  const addColumnModal = page.getByTestId('build-add-column-menu')

  await addColumnModal.getByLabel('Column name').fill('Row notes')
  await addColumnModal.getByLabel('Type').selectOption('longText')
  await addColumnModal.getByRole('button', { name: 'Add column' }).click()
  await expect(page.getByRole('columnheader', { name: /Row notes/ }).first()).toBeVisible()

  const longTextCell = page.getByTestId(`grid-cell-${firstRecordId}-row_notes`)
  const longTextValue = 'Long row note for lifecycle coverage. It should save as a textarea edit and survive reload.'

  await longTextCell.click()
  await longTextCell.press('Enter')
  await page.getByLabel('Row notes editor').fill(longTextValue)
  await page.getByLabel('Row notes editor').press('Tab')
  await expect(longTextCell).toContainText(longTextValue)

  const manyRowTitles = ['Bulk row 1', 'Bulk row 2', 'Bulk row 3', 'Bulk row 4', 'Bulk row 5']

  for (const title of manyRowTitles) {
    await addBuildGridRow(page, title)
  }

  await page.reload()
  await page.getByTestId('build-table-tasks').click()

  await expect(page.getByTestId(`grid-cell-${firstRecordId}-title`)).toContainText('Row launch pressure renamed')
  await expect(page.getByTestId(`grid-cell-${firstRecordId}-row_notes`)).toContainText(longTextValue)
  await expect(page.getByTestId(`grid-cell-${blankRecordId}-title`)).toBeVisible()
  await expect(page.getByTestId(`grid-cell-${blankRecordId}-title`)).toContainText('Empty')

  for (const title of manyRowTitles) {
    await expect(page.getByTestId('build-screen').getByText(title)).toBeVisible()
  }

  const taskRecords = await getTaskRecords(page)

  expect(taskRecords.find((record) => record.id === firstRecordId)?.values.title).toBe('Row launch pressure renamed')
  expect(taskRecords.find((record) => record.id === firstRecordId)?.values.row_notes).toBe(longTextValue)
  expect(taskRecords.find((record) => record.id === blankRecordId)?.values.title).toBe('')
  for (const title of manyRowTitles) {
    expect(taskRecords.some((record) => record.values.title === title)).toBe(true)
  }
})

test('Build row delete is exposed from a local row menu and persists', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const recordId = await addBuildGridRow(page, 'Delete affordance probe')
  const titleCell = page.getByTestId(`grid-cell-${recordId}-title`)

  await expect(titleCell).toContainText('Delete affordance probe')
  await page.getByTestId(`build-row-menu-${recordId}`).click()
  await page.getByRole('menuitem', { name: 'Delete row' }).click()

  await expect(titleCell).toHaveCount(0)
  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByTestId(`grid-cell-${recordId}-title`)).toHaveCount(0)

  const taskRecords = await getTaskRecords(page)

  expect(taskRecords.some((record) => record.id === recordId)).toBe(false)
})
