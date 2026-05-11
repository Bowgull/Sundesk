import { expect, test, type Locator, type Page } from '@playwright/test'

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
    if (!window.localStorage.getItem('sundesk-build-field-types-seeded')) {
      window.localStorage.removeItem('sundesk-build-view-state-v1')
      window.localStorage.removeItem('sundesk-local-workbase-v1')
      window.localStorage.setItem('sundesk-build-field-types-seeded', 'true')
    }
    window.localStorage.setItem('sundesk-theme', 'moss-paper')
    window.localStorage.setItem('sundesk-education-state-v1', JSON.stringify(state))
  }, dismissedEducationState)
})

async function addColumn(page: Page, name: string, type: string, options?: string) {
  await page.getByRole('button', { name: 'Add column' }).click()
  const addColumnModal = page.getByTestId('build-add-column-menu')

  await addColumnModal.getByLabel('Column name').fill(name)
  await addColumnModal.getByLabel('Type').selectOption(type)
  if (options) {
    await addColumnModal.locator('textarea').fill(options)
  }
  await addColumnModal.getByRole('button', { name: 'Add column' }).click()
  await expect(page.getByRole('columnheader', { name: new RegExp(name) }).first()).toBeVisible()
}

function firstCell(page: Page, fieldId: string) {
  return page.locator(`[data-testid$="-${fieldId}"]`).first()
}

async function editInputCell(cell: Locator, editor: Locator, value: string) {
  await cell.click()
  await cell.press('Enter')
  await editor.fill(value)
  await editor.press('Enter')
}

async function editSelectCell(cell: Locator, editor: Locator, value: string) {
  await cell.click()
  await cell.press('Enter')
  await editor.selectOption(value)
  await editor.press('Enter')
}

test('Build directly edits mixed field types and persists their cell values', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await addColumn(page, 'Launch date', 'date')
  await addColumn(page, 'Launch window', 'dateTime')
  await addColumn(page, 'Guest count', 'number')
  await addColumn(page, 'Permit price', 'currency')
  await addColumn(page, 'Readiness score', 'percent')
  await addColumn(page, 'Vendor rating', 'rating')
  await addColumn(page, 'Lead phone', 'phone')
  await addColumn(page, 'Runbook URL', 'url')
  await addColumn(page, 'Launch state', 'status', 'Queued, Live, Done')
  await addColumn(page, 'Vendor lane', 'singleSelect', 'Catering, Security, Rentals')
  await addColumn(page, 'Launch tags', 'multiSelect', 'COI, Permit, VIP')
  await addColumn(page, 'Community lookup', 'lookup')

  const launchDateCell = firstCell(page, 'launch_date')
  const launchWindowCell = firstCell(page, 'launch_window')
  const guestCountCell = firstCell(page, 'guest_count')
  const permitPriceCell = firstCell(page, 'permit_price')
  const readinessScoreCell = firstCell(page, 'readiness_score')
  const vendorRatingCell = firstCell(page, 'vendor_rating')
  const leadPhoneCell = firstCell(page, 'lead_phone')
  const runbookUrlCell = firstCell(page, 'runbook_url')
  const launchStateCell = firstCell(page, 'launch_state')
  const vendorLaneCell = firstCell(page, 'vendor_lane')
  const launchTagsCell = firstCell(page, 'launch_tags')
  const communityLookupCell = firstCell(page, 'community_lookup')

  await editInputCell(launchDateCell, page.getByLabel('Launch date editor'), '2026-05-22')
  await expect(launchDateCell).toContainText('2026-05-22')

  await editInputCell(launchWindowCell, page.getByLabel('Launch window editor'), '2026-05-22T14:30')
  await expect(launchWindowCell).toContainText('2026-05-22T14:30')

  await editInputCell(guestCountCell, page.getByLabel('Guest count editor'), '1250')
  await expect(guestCountCell).toContainText('1250')

  await editInputCell(permitPriceCell, page.getByLabel('Permit price editor'), '4500')
  await expect(permitPriceCell).toContainText('$4,500')

  await editInputCell(readinessScoreCell, page.getByLabel('Readiness score editor'), '82')
  await expect(readinessScoreCell).toContainText('82')

  await editInputCell(vendorRatingCell, page.getByLabel('Vendor rating editor'), '4')
  await expect(vendorRatingCell).toContainText('4')

  await editInputCell(leadPhoneCell, page.getByLabel('Lead phone editor'), '555-0102')
  await expect(leadPhoneCell).toContainText('555-0102')

  await editInputCell(runbookUrlCell, page.getByLabel('Runbook URL editor'), 'https://example.invalid/runbook')
  await expect(runbookUrlCell).toContainText('https://example.invalid/runbook')

  await editSelectCell(launchStateCell, page.getByLabel('Launch state editor'), 'Live')
  await expect(launchStateCell.locator('.select-tag')).toContainText('Live')

  await editSelectCell(vendorLaneCell, page.getByLabel('Vendor lane editor'), 'Security')
  await expect(vendorLaneCell.locator('.select-tag')).toContainText('Security')

  await launchTagsCell.click()
  await launchTagsCell.press('Enter')
  const tagEditor = page.getByLabel('Launch tags editor')
  await tagEditor.getByRole('button', { name: 'COI' }).click()
  await tagEditor.getByRole('button', { name: 'VIP' }).click()
  await page.keyboard.press('Enter')
  await expect(launchTagsCell.locator('.select-tag')).toContainText(['COI', 'VIP'])

  await communityLookupCell.dblclick()
  await expect(page.getByLabel('Community lookup editor')).toHaveCount(0)

  await page.reload()
  await page.getByTestId('build-table-tasks').click()

  await expect(firstCell(page, 'launch_date')).toContainText('2026-05-22')
  await expect(firstCell(page, 'launch_window')).toContainText('2026-05-22T14:30')
  await expect(firstCell(page, 'guest_count')).toContainText('1250')
  await expect(firstCell(page, 'permit_price')).toContainText('$4,500')
  await expect(firstCell(page, 'readiness_score')).toContainText('82')
  await expect(firstCell(page, 'vendor_rating')).toContainText('4')
  await expect(firstCell(page, 'lead_phone')).toContainText('555-0102')
  await expect(firstCell(page, 'runbook_url')).toContainText('https://example.invalid/runbook')
  await expect(firstCell(page, 'launch_state').locator('.select-tag')).toContainText('Live')
  await expect(firstCell(page, 'vendor_lane').locator('.select-tag')).toContainText('Security')
  await expect(firstCell(page, 'launch_tags').locator('.select-tag')).toContainText(['COI', 'VIP'])
  await expect(page.getByLabel('Community lookup editor')).toHaveCount(0)
})
