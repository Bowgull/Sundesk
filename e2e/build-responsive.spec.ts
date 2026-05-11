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
  await page.setViewportSize({ width: 430, height: 780 })
  await page.addInitScript((state) => {
    if (!window.localStorage.getItem('sundesk-build-responsive-seeded')) {
      window.localStorage.removeItem('sundesk-build-view-state-v1')
      window.localStorage.removeItem('sundesk-local-workbase-v1')
      window.localStorage.setItem('sundesk-build-responsive-seeded', 'true')
    }
    window.localStorage.setItem('sundesk-theme', 'moss-paper')
    if (!window.localStorage.getItem('sundesk-education-state-v1')) {
      window.localStorage.setItem('sundesk-education-state-v1', JSON.stringify(state))
    }
  }, dismissedEducationState)
})

test('Build keeps far-right linked-record editors inside the visible table on narrow screens', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const tableWrap = page.getByTestId('record-table-wrap').first()
  const communityCell = page.getByTestId('grid-cell-task_site_map_vaughan-community')

  await communityCell.scrollIntoViewIfNeeded()
  await communityCell.dblclick()
  const editor = page.locator('.grid-cell-editor')
  const editorBox = await editor.boundingBox()
  const wrapBox = await tableWrap.boundingBox()

  if (!editorBox || !wrapBox) {
    throw new Error('Missing responsive editor bounds.')
  }

  expect(editorBox.x).toBeGreaterThanOrEqual(wrapBox.x)
  expect(editorBox.x + editorBox.width).toBeLessThanOrEqual(wrapBox.x + wrapBox.width)
})

test('Build keeps the Add column menu inside the visible table on narrow screens', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const tableWrap = page.getByTestId('record-table-wrap').first()
  const addColumnButton = page.getByRole('button', { name: 'Add column' }).first()

  await addColumnButton.scrollIntoViewIfNeeded()
  await addColumnButton.click()
  const addColumnMenu = page.getByTestId('build-add-column-menu')
  const menuBox = await addColumnMenu.boundingBox()
  const wrapBox = await tableWrap.boundingBox()

  if (!menuBox || !wrapBox) {
    throw new Error('Missing Add column menu bounds.')
  }

  expect(menuBox.x).toBeGreaterThanOrEqual(wrapBox.x)
  expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(wrapBox.x + wrapBox.width)
})
