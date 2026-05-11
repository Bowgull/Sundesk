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
    if (!window.localStorage.getItem('sundesk-build-cross-screen-seeded')) {
      window.localStorage.removeItem('sundesk-build-view-state-v1')
      window.localStorage.removeItem('sundesk-local-workbase-v1')
      window.localStorage.setItem('sundesk-build-cross-screen-seeded', 'true')
    }
    window.localStorage.setItem('sundesk-theme', 'moss-paper')
    window.localStorage.setItem('sundesk-education-state-v1', JSON.stringify(state))
  }, dismissedEducationState)
})

async function editTextCell(page: Page, recordId: string, fieldId: string, label: string, value: string) {
  const cell = page.getByTestId(`grid-cell-${recordId}-${fieldId}`)

  await cell.dblclick()
  await page.getByLabel(`${label} editor`).fill(value)
  await page.getByLabel(`${label} editor`).press('Enter')
  await expect(cell).toContainText(value)
}

async function editSelectCell(page: Page, recordId: string, fieldId: string, label: string, value: string) {
  const cell = page.getByTestId(`grid-cell-${recordId}-${fieldId}`)

  await cell.dblclick()
  await page.getByLabel(`${label} editor`).selectOption(value)
  await page.getByLabel(`${label} editor`).press('Enter')
  await expect(cell).toContainText(value)
}

async function editLinkedRecordCell(page: Page, recordId: string, fieldId: string, label: string, linkedName: string) {
  const cell = page.getByTestId(`grid-cell-${recordId}-${fieldId}`)

  await cell.dblclick()
  const editor = page.locator('.grid-cell-editor')
  const searchInput = editor.getByLabel(`Search ${label}`)

  await searchInput.fill(linkedName)
  await expect(editor.getByRole('option', { name: linkedName })).toBeVisible()
  await searchInput.press('Enter')
  await editor.getByLabel(`${label} editor`).getByRole('button', { name: 'Done' }).click()
  await expect(cell).toContainText(linkedName)
}

test('Build work edits surface in Today without exposing Build machinery', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await editTextCell(page, 'task_site_map_vaughan', 'title', 'Title', 'Call Vaughan site map owner.')
  await editSelectCell(page, 'task_site_map_vaughan', 'status', 'Status', 'Blocked')
  await editTextCell(page, 'task_site_map_vaughan', 'dueDate', 'Due date', '2026-05-11')

  await page.goto('/#today')

  await expect(page.getByTestId('today-lane-now')).toContainText('Call Vaughan site map owner.')
  await expect(page.getByTestId('today-lane-now')).toContainText('Blocked · 2026-05-11')
})

test('Build community link edits change the Communities surface', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await editTextCell(page, 'task_site_map_vaughan', 'title', 'Title', 'Toronto site map chase.')
  const communityCell = page.getByTestId('grid-cell-task_site_map_vaughan-community')

  await communityCell.dblclick()
  const editor = page.locator('.grid-cell-editor')

  await editor.getByLabel('Search Community').fill('Toronto')
  await expect(editor.getByRole('option', { name: 'Toronto' })).toBeVisible()
  await editor.getByLabel('Search Community').press('Enter')
  await expect(communityCell).toContainText('Toronto')
  await expect(editor).toHaveCount(0)

  await page.goto('/#communities')
  await page.getByRole('button', { name: /Toronto/ }).first().click()

  await expect(page.getByTestId('community-place-detail')).toContainText('Toronto')
  await expect(page.getByTestId('community-place-detail')).toContainText('Toronto site map chase.')
})

test('Build single linked-record dropdown supports keyboard selection with clean labels', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const communityCell = page.getByTestId('grid-cell-task_site_map_vaughan-community')

  await communityCell.dblclick()
  const editor = page.locator('.grid-cell-editor')

  await editor.getByLabel('Search Community').fill('Toronto')
  await expect(editor.getByRole('option', { name: /^Toronto$/ })).toBeVisible()
  await expect(editor.getByRole('option', { name: /Toronto .* At risk/ })).toHaveCount(0)
  await editor.getByLabel('Search Community').press('ArrowDown')
  await editor.getByLabel('Search Community').press('Enter')
  await expect(communityCell).toContainText('Toronto')
  await expect(editor).toHaveCount(0)
})

test('Build meeting work links change the Meetings prep surface', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-meetings').click()

  await editLinkedRecordCell(page, 'meeting_brampton', 'tasks', 'Work', 'Check Friday.')

  await page.goto('/#meetings')
  const meetingsScreen = page.locator('#meetings')

  await expect(page.getByText('Brampton prep. has 2 work items ready.')).toBeVisible()
  await expect(meetingsScreen.getByTestId('meeting-prep')).toContainText('2 work items')
  await expect(meetingsScreen.getByTestId('meeting-prep')).toContainText('Check Friday.')
})
