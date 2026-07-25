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

test('Build keeps long tag chips inside their cells', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 })
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await page.getByRole('button', { name: 'Add column' }).click()
  const addColumnMenu = page.getByTestId('build-add-column-menu')
  const longTag = 'VendorReadinessProofWithAVeryLongCOILabelThatShouldStayInsideTheCell'

  await addColumnMenu.getByLabel('Column name').fill('Launch tags')
  await addColumnMenu.getByLabel('Type').selectOption('multiSelect')
  await addColumnMenu.getByLabel('Options').fill(longTag)
  await addColumnMenu.getByRole('button', { name: 'Add column' }).click()

  const tagCell = page.locator('[data-testid$="-launch_tags"]').first()

  await tagCell.click()
  await tagCell.press('Enter')
  await page.getByRole('button', { name: longTag }).click()
  await page.keyboard.press('Tab')

  const cellBox = await tagCell.boundingBox()
  const chipBox = await tagCell.locator('.select-tag').boundingBox()

  if (!cellBox || !chipBox) {
    throw new Error('Missing long tag chip bounds.')
  }

  expect(chipBox.x).toBeGreaterThanOrEqual(cellBox.x)
  expect(chipBox.x + chipBox.width).toBeLessThanOrEqual(cellBox.x + cellBox.width)
})

test('Build keeps many columns horizontally scrollable without shrinking the table', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 760 })
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  for (let index = 1; index <= 8; index += 1) {
    const addColumnButton = page.getByRole('button', { name: 'Add column' }).first()

    await addColumnButton.scrollIntoViewIfNeeded()
    await addColumnButton.click()
    const addColumnMenu = page.getByTestId('build-add-column-menu')

    await addColumnMenu.getByLabel('Column name').fill(`Stress column ${index}`)
    await addColumnMenu.getByRole('button', { name: 'Add column' }).click()
    await expect(page.getByRole('columnheader', { name: new RegExp(`Stress column ${index}`) }).first()).toBeVisible()
  }

  const tableWrap = page.getByTestId('record-table-wrap').first()
  const scrollStateBefore = await tableWrap.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollLeft: element.scrollLeft,
    scrollWidth: element.scrollWidth,
  }))

  expect(scrollStateBefore.scrollWidth).toBeGreaterThan(scrollStateBefore.clientWidth)

  await tableWrap.evaluate((element) => {
    element.scrollLeft = element.scrollWidth
  })
  await expect(page.getByRole('columnheader', { name: /Stress column 8/ }).first()).toBeVisible()
  const scrollStateAfter = await tableWrap.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollLeft: element.scrollLeft,
    scrollWidth: element.scrollWidth,
  }))

  expect(scrollStateAfter.scrollLeft).toBeGreaterThan(scrollStateBefore.scrollLeft)
  expect(scrollStateAfter.scrollWidth).toBeGreaterThan(scrollStateAfter.clientWidth)
})
