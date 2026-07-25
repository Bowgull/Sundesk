import { expect, type Page, test } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'

const firebaseWriteMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const firebaseWriteHostPattern = /(?:^|\.)firestore\.googleapis\.com$|(?:^|\.)firebaseio\.com$|(?:^|\.)firebase\.google\.com$/

const auditFirebaseWrites = (page: Page) => {
  const firebaseWriteRequests: string[] = []

  page.on('request', (request) => {
    const requestUrl = new URL(request.url())

    if (firebaseWriteMethods.has(request.method()) && firebaseWriteHostPattern.test(requestUrl.hostname)) {
      firebaseWriteRequests.push(`${request.method()} ${request.url()}`)
    }
  })

  return firebaseWriteRequests
}

async function addBuildGridRow(
  page: Page,
  title: string,
  options: { status?: string, dueDate?: string } = {},
) {
  await page.getByTestId('build-add-record').first().click()

  const recordId = await page.evaluate(() => {
    const stored = JSON.parse(window.localStorage.getItem('sundesk-local-workbase-v1') || '{"base":{"records":[]}}') as {
      base?: { records?: Array<{ id: string, tableId: string }> }
    }
    const taskRows = stored.base?.records?.filter((record) => record.tableId === 'tasks') || []

    return taskRows.at(-1)?.id || ''
  })

  await page.getByLabel('Title editor').fill(title)
  await page.getByLabel('Title editor').press('Enter')

  if (options.status) {
    const statusCell = page.getByTestId(`grid-cell-${recordId}-status`)

    await statusCell.click()
    await statusCell.press('Enter')
    await page.getByLabel('Status editor').selectOption(options.status)
    await page.getByLabel('Status editor').press('Enter')
  }

  if (options.dueDate) {
    const dateCell = page.getByTestId(`grid-cell-${recordId}-dueDate`)

    await dateCell.click()
    await dateCell.press('Enter')
    await page.getByLabel('Due date editor').fill(options.dueDate)
    await page.getByLabel('Due date editor').press('Enter')
  }

  return recordId
}

test.beforeEach(async ({ page }, testInfo) => {
  const consoleErrors: string[] = []

  const exercisesFirstRunOnboarding = testInfo.title.startsWith('First-run onboarding') ||
    testInfo.title.startsWith('Onboarding tour')

  if (!exercisesFirstRunOnboarding) {
    await page.addInitScript(() => {
      if (!window.localStorage.getItem('sundesk-education-state-v1')) {
        window.localStorage.setItem('sundesk-education-state-v1', JSON.stringify({
          version: 1,
          onboarding: {
            status: 'dismissed',
            currentStepId: null,
            completedStepIds: [],
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
        }))
      }
    })
  }

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  await page.goto('/')
  await expect(page.getByTestId('today-brief').getByRole('heading', { name: 'Today' })).toBeVisible()
  expect(consoleErrors).toEqual([])
})

test('Lindsay install basics are present and local no-config opens Today', async ({ page }) => {
  await expect(page).toHaveTitle('Sundesk')
  await expect(page.locator('head link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
  await expect(page.locator('head link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png')
  await expect(page.locator('head link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')
  await expect(page.locator('head meta[name="application-name"]')).toHaveAttribute('content', 'Sundesk')
  await expect(page.locator('head meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'Sundesk')
  await expect(page.locator('head meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes')
  await expect(page.locator('head meta[name="mobile-web-app-capable"]')).toHaveAttribute('content', 'yes')
  await expect(page.locator('head meta[name="theme-color"]')).not.toHaveAttribute('content', '')

  const manifest = await page.request.get('/manifest.webmanifest')
  await expect(manifest).toBeOK()
  const manifestBody = await manifest.json()
  const localManifestBody = JSON.parse(await readFile('public/manifest.webmanifest', 'utf8'))

  expect(manifestBody).toMatchObject({
    name: 'Sundesk',
    short_name: 'Sundesk',
    start_url: '/',
    scope: '/',
    display: 'standalone',
  })
  expect(manifestBody.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({
      src: '/favicon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
    }),
    expect.objectContaining({
      src: '/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: expect.stringContaining('maskable'),
    }),
    expect.objectContaining({
      src: '/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: expect.stringContaining('maskable'),
    }),
  ]))
  expect(manifestBody).toEqual(localManifestBody)
  const appleIcon = await page.request.get('/apple-touch-icon.png')
  const icon192 = await page.request.get('/icon-192.png')
  const icon512 = await page.request.get('/icon-512.png')

  await expect(appleIcon).toBeOK()
  await expect(icon192).toBeOK()
  await expect(icon512).toBeOK()

  const decodedIconSizes = await page.evaluate(async () => {
    const decodeIcon = (src: string) => new Promise<{ width: number, height: number }>((resolve, reject) => {
      const image = new Image()

      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
      image.onerror = () => reject(new Error(`Icon did not decode: ${src}`))
      image.src = src
    })

    const [apple, small, large] = await Promise.all([
      decodeIcon('/apple-touch-icon.png'),
      decodeIcon('/icon-192.png'),
      decodeIcon('/icon-512.png'),
    ])

    return { apple, small, large }
  })

  expect(decodedIconSizes.apple).toEqual({ width: 180, height: 180 })
  expect(decodedIconSizes.small).toEqual({ width: 192, height: 192 })
  expect(decodedIconSizes.large).toEqual({ width: 512, height: 512 })
})

test('First-run onboarding choice can start alone and persists dismissal', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.removeItem('sundesk-education-state-v1'))
  await page.goto('/#settings')

  await expect(page.getByTestId('onboarding-choice')).toBeVisible()
  await page.getByRole('button', { name: 'Start on my own' }).click()
  await expect(page.getByTestId('onboarding-choice')).toHaveCount(0)

  const educationState = await page.evaluate(() => JSON.parse(window.localStorage.getItem('sundesk-education-state-v1') || '{}'))

  expect(educationState.onboarding.status).toBe('dismissed')
})

test('Onboarding tour advances only from exact highlighted target clicks', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.removeItem('sundesk-education-state-v1'))
  await page.goto('/#settings')

  await page.getByRole('button', { name: 'Start the tour' }).click()
  await expect(page.getByTestId('onboarding-tour')).toContainText('Today is the look-at-this-first screen')
  await expect(page.getByTestId('onboarding-tour')).toContainText(/1 of \d+/)
  await expect(page.getByTestId('onboarding-tour')).toContainText('Read this first. Today is home.')

  await page.mouse.click(520, 520)

  let educationState = await page.evaluate(() => JSON.parse(window.localStorage.getItem('sundesk-education-state-v1') || '{}'))

  expect(educationState.onboarding.currentStepId).toBe('today')
  expect(educationState.onboarding.completedActionIds).not.toContain('view-today')

  await page.getByRole('button', { name: 'I see Today' }).click()
  await expect(page.getByTestId('onboarding-tour')).toContainText('Build is where tables live.')
  await expect(page.getByTestId('onboarding-tour')).toContainText(/2 of \d+/)
  await expect(page.getByTestId('onboarding-tour')).toContainText('Click Build in the sidebar.')

  await page.mouse.click(520, 520)

  educationState = await page.evaluate(() => JSON.parse(window.localStorage.getItem('sundesk-education-state-v1') || '{}'))

  expect(educationState.onboarding.currentStepId).toBe('build-nav')
  expect(educationState.onboarding.completedActionIds).not.toContain('click-build')

  await page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' }).click()
  await expect(page.getByTestId('build-screen')).toBeVisible()

  educationState = await page.evaluate(() => JSON.parse(window.localStorage.getItem('sundesk-education-state-v1') || '{}'))

  expect(educationState.onboarding.currentStepId).toBe('table-tabs')
  expect(educationState.onboarding.completedActionIds).toContain('click-build')

  await page.getByRole('button', { name: 'Back' }).click()

  educationState = await page.evaluate(() => JSON.parse(window.localStorage.getItem('sundesk-education-state-v1') || '{}'))

  expect(educationState.onboarding.currentStepId).toBe('build-nav')
  expect(educationState.onboarding.completedActionIds).not.toContain('click-build')
  await expect(page.getByTestId('onboarding-tour')).toContainText(/2 of \d+/)
})

test('Onboarding field type step teaches each field type', async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('sundesk-education-state-v1', JSON.stringify({
      version: 1,
      onboarding: {
        status: 'inProgress',
        currentStepId: 'field-types',
        completedStepIds: ['welcome', 'today', 'build-nav', 'table-tabs', 'table-meaning', 'record-meaning', 'field-meaning'],
        completedActionIds: ['start-tour', 'view-today', 'click-build', 'select-table', 'view-active-table', 'open-record', 'open-field-controls'],
        startedAt: '2026-05-10T17:00:00.000Z',
        completedAt: null,
        lastSeenAt: '2026-05-10T17:00:00.000Z',
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
    }))
  })
  await page.goto('/?onboarding-field-types=1#build')
  await page.locator('[data-onboarding-target="build-add-field"]').first().click()

  const tour = page.getByTestId('onboarding-tour')

  await expect(tour).toContainText(/7 of \d+/)
  await expect(tour).toContainText('Text: Short labels, names, titles, and quick details.')
  await expect(tour).toContainText('Long text: Notes, context, updates, and anything that needs room.')
  await expect(tour).toContainText('Number: Counts, amounts, percentages, square footage, budget numbers, and scores.')
  await expect(tour).toContainText('Date: Due dates, meetings, follow-ups, expiry dates, renewal dates, and timelines.')
  await expect(tour).toContainText('Status: One current stage, like Not started, Waiting, In review, or Done.')
  await expect(tour).toContainText('Checkbox: Yes or no tracking, like sent, approved, received, urgent, or needs follow-up.')
  await expect(tour).toContainText('Tags: Multiple labels on one record, so a task can be Waiting, COI, Steph, and Friday all at once.')
  await expect(tour).toContainText('Link: A connection to another table, like a task connected to a community, person, meeting, or document.')
  await expect(tour).toContainText('Lookup: Information pulled from a linked record so she does not retype it.')
  await expect(tour).toContainText('Rollup: A calculated summary from linked records, like count, total, earliest date, latest date, or open items.')
})

test('Settings install surface is covered when present', async ({ page }) => {
  await page.goto('/#settings')

  await expect(page.getByTestId('settings-screen')).toBeVisible()

  const settingsScreen = page.getByTestId('settings-screen')
  const installSurface = settingsScreen.getByText(/Add to Home Screen|bookmark|install|Sundesk icon/i).first()

  if (await installSurface.count() === 0) {
    test.info().annotations.push({
      type: 'integration-note',
      description: 'Settings install/bookmark surface is not present in this checkout.',
    })
    return
  }

  await expect(installSurface).toBeVisible()
  await expect(settingsScreen).toContainText(/approved hosted address/i)
  await expect(settingsScreen).toContainText(/local testing/i)
  await expect(settingsScreen).toContainText(/iPhone/i)
  await expect(settingsScreen).toContainText(/home screen/i)
  await expect(settingsScreen).toContainText(/desktop/i)
  await expect(settingsScreen).toContainText(/bookmark/i)
  await expect(settingsScreen).toContainText(/Sundesk icon/i)
})

test('Settings explains local, shared, bookmark, and install paths without leading with risk copy', async ({ page }) => {
  await page.goto('/#settings')

  const settingsScreen = page.getByTestId('settings-screen')
  const installPanel = page.getByLabel('Install and bookmark readiness')

  await expect(settingsScreen).toBeVisible()
  await expect(installPanel).toContainText('Open here for local testing.')
  await expect(installPanel).toContainText('Use the approved hosted address for shared daily work.')
  await expect(installPanel).toContainText('iPhone.')
  await expect(installPanel).toContainText('Desktop.')
  await expect(installPanel).toContainText('No deploy runs from this panel.')
  await expect(installPanel).toContainText('No Firebase write starts here.')

  await expect(settingsScreen.getByText('Use Sundesk for sensitive information at your own risk. Josh can help tune the setup, but you still choose what belongs in the app')).toBeHidden()
  await settingsScreen.getByText('Show sensitive data note').click()
  await expect(settingsScreen.getByText('Use Sundesk for sensitive information at your own risk. Josh can help tune the setup, but you still choose what belongs in the app')).toBeVisible()
})

test('Today renders local lanes, rule receipts, and dependency receipts', async ({ page }) => {
  await expect(page.getByTestId('today-brief')).toBeVisible()
  await expect(page.getByTestId('today-brief').getByRole('heading', { name: 'Today' })).toBeVisible()
  await expect(page.getByTestId('today-brief')).toContainText('What can slip. What is waiting. What moves next.')
  await expect(page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' })).toBeVisible()
  await expect(page.getByTestId('rail-workspace-card')).not.toHaveAttribute('open', '')
  await expect(page.getByTestId('rail-system-read-card')).not.toHaveAttribute('open', '')
  await expect(page.getByRole('button', { name: 'Preview summary' })).toBeEnabled()
  await expect(page.getByTestId('today-lanes')).toContainText('Now')
  await expect(page.getByTestId('today-lanes')).toContainText('Waiting')
  await expect(page.getByTestId('today-lanes')).toContainText('Next')
  await expect(page.getByTestId('today-focus')).toContainText('Touch first')
  await expect(page.getByTestId('today-focus')).toContainText('Send permit follow-up.')
  await expect(page.getByTestId('today-focus')).toContainText('Status is Blocked.')
  await expect(page.getByTestId('today-lane-now')).toBeVisible()
  await expect(page.getByTestId('today-lane-waiting')).toBeVisible()
  await expect(page.getByTestId('today-lane-next')).toBeVisible()
  await expect(page.getByTestId('today-lane-rules')).toHaveCount(0)
  await page.getByText('Show why items surfaced').click()
  await expect(page.getByTestId('today-rule-receipts').getByText('Send permit follow-up.').first()).toBeVisible()
  await expect(page.getByTestId('today-rule-receipts').getByText('Status is Blocked.').first()).toBeVisible()
  await expect(page.getByTestId('today-lane-now').getByText('Status is Blocked.').first()).toBeVisible()
  await page.getByTestId('today-lane-now').getByRole('button', { name: 'Open' }).first().click()
  await expect(page.getByTestId('record-drawer')).toBeVisible()
  await expect(page.getByTestId('record-work-hero')).toContainText('Send permit follow-up.')
  await expect(page.getByTestId('record-work-hero')).toContainText('Open blocker')
})

test('Today command-send preview is local-only and keeps Today as home', async ({ page }) => {
  const firebaseWriteRequests = auditFirebaseWrites(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Can slip today.' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' })).toBeVisible()

  const previewSummary = page.getByRole('button', { name: 'Preview summary' })

  await expect(previewSummary).toBeEnabled()
  await previewSummary.click()

  const preview = page.getByTestId('today-command-send-preview')

  await expect(preview).toContainText(/Command send preview/i)
  await expect(preview).toContainText(/No send happened/i)
  await expect(preview).toContainText(/Now/i)
  await expect(preview).toContainText(/Waiting/i)
  await expect(preview).toContainText(/Next/i)
  await expect(preview).toContainText(/meeting prep/i)
  expect(firebaseWriteRequests).toEqual([])
})

test('Deck-first shell keeps Today home and simplified surfaces reachable', async ({ page }) => {
  const navigation = page.getByRole('navigation', { name: 'Sundesk navigation' })

  await page.goto('/')
  await expect(page).toHaveURL(/\/#?$/)
  await expect(page.getByTestId('today-brief').getByRole('heading', { name: 'Today' })).toBeVisible()
  await expect(navigation.getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page')
  await expect(navigation.getByRole('link', { name: 'Build' })).toBeVisible()

  await navigation.getByRole('link', { name: 'Waiting On' }).click()
  await expect(page.getByRole('heading', { name: 'Chase list.' })).toBeVisible()
  await expect(navigation.getByRole('link', { name: 'Build' })).toBeVisible()

  await navigation.getByRole('link', { name: 'Communities' }).click()
  await expect(page.getByRole('heading', { name: 'Communities are the command center.' })).toBeVisible()

  await navigation.getByRole('link', { name: 'Meetings' }).click()
  await expect(page.getByTestId('meeting-prep')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Weekly note draft.' })).toBeVisible()

  await navigation.getByRole('link', { name: 'Timeline' }).click()
  await expect(page.getByTestId('timeline-screen')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Clean read.' })).toBeVisible()

  await navigation.getByRole('link', { name: 'Build' }).click()
  await expect(page.getByTestId('build-screen')).toBeVisible()
  await expect(page.getByTestId('build-screen').getByRole('heading', { name: 'Work' })).toBeVisible()

  await navigation.getByRole('link', { name: 'Today' }).click()
  await expect(page.getByTestId('today-brief').getByRole('heading', { name: 'Today' })).toBeVisible()
  await expect(navigation.getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page')
})

test('Sundesk Lab is a real nav screen and persists module progress locally', async ({ page }) => {
  const navigation = page.getByRole('navigation', { name: 'Sundesk navigation' })
  const labLink = navigation.getByRole('link', { name: 'Sundesk Lab' })
  const labModuleId = 'tags'
  const labModuleTestId = `lab-module-${labModuleId}`

  await expect(navigation.getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page')
  await expect(labLink).toBeVisible()

  await labLink.click()
  await expect(page).toHaveURL(/#lab$/)
  await expect(page.getByTestId('sundesk-lab-screen')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sundesk Lab' })).toBeVisible()
  await expect(page.getByTestId('lab-module-list')).toContainText('Start with the map')
  await expect(page.getByTestId('lab-module-list')).toContainText('Make tags route work')
  await expect(page.getByTestId('sundesk-lab-screen')).toContainText('Sync-ready')
  await expect(page.getByTestId('lab-active-module')).toContainText('Done when')
  await expect(page.getByTestId('lab-active-module')).toContainText('Practice workspace')
  await expect(page.getByTestId('lab-active-module')).toContainText('Kensington permit follow-up')

  await page.getByTestId(labModuleTestId).getByRole('button', { name: /Make tags route work/ }).click()
  await expect(page.getByTestId('lab-active-module')).toContainText('Make tags route work')
  await expect(page.getByTestId('lab-active-module')).toContainText('Tag the risk row')
  await expect(page.getByTestId('lab-active-module')).toContainText('Permit risk')
  await expect(page.getByTestId(labModuleTestId)).toContainText('In progress')

  const storedAfterContinue = await page.evaluate(() => JSON.parse(localStorage.getItem('sundesk-education-state-v1') || '{}'))

  expect(storedAfterContinue.lab.activeModuleId).toBe(labModuleId)
  expect(storedAfterContinue.lab.modules[labModuleId].status).toBe('inProgress')
  expect(storedAfterContinue.lab.modules[labModuleId].currentStepId).toBe('tags-tag-risk-row')
  expect(storedAfterContinue.lab.sandbox.activeLessonId).toBe(labModuleId)
  expect(storedAfterContinue.lab.sandbox.activeSurface).toBe('tags')
  expect(storedAfterContinue.lab.sandbox.coachOpen).toBe(true)
  expect(storedAfterContinue.lab.sandbox.inspectorOpen).toBe(true)
  expect(storedAfterContinue.lab.sandbox.records.every((record: { fake: boolean }) => record.fake)).toBe(true)

  await expect(page.getByRole('button', { name: 'Complete lesson' })).toBeDisabled()
  await page.getByRole('button', { name: 'Add tag' }).click()
  await page.getByRole('button', { name: 'Filter tag' }).click()
  await expect(page.getByTestId('lab-active-module')).toContainText('Permit risk route visible.')
  await page.getByRole('button', { name: 'Complete lesson' }).click()

  await expect(page.getByTestId('lab-active-module')).toContainText('Done')

  const storedAfterCompletion = await page.evaluate(() => JSON.parse(localStorage.getItem('sundesk-education-state-v1') || '{}'))

  expect(storedAfterCompletion.lab.modules[labModuleId].status).toBe('completed')
  expect(storedAfterCompletion.lab.modules[labModuleId].currentStepId).toBeNull()
  expect(storedAfterCompletion.lab.modules[labModuleId].completedStepIds).toEqual(['tags-tag-risk-row', 'tags-filter-risk-tag'])
  expect(storedAfterCompletion.lab.modules[labModuleId].completedActionIds).toEqual(['tag-risk-row', 'filter-risk-tag'])
  expect(storedAfterCompletion.lab.modules[labModuleId].completedAt).toEqual(expect.any(String))

  await page.getByRole('button', { name: 'Start over' }).click()
  const storedAfterModuleReset = await page.evaluate(() => JSON.parse(localStorage.getItem('sundesk-education-state-v1') || '{}'))

  expect(storedAfterModuleReset.lab.modules[labModuleId]).toBeUndefined()

  const realRecordCount = await page.evaluate(() => JSON.parse(localStorage.getItem('sundesk-local-workbase-v1') || '{"base":{"records":[]}}').base.records.length)

  await page.getByRole('button', { name: 'Reset sample data' }).click()
  const storedAfterLabReset = await page.evaluate(() => JSON.parse(localStorage.getItem('sundesk-education-state-v1') || '{}'))
  const realRecordCountAfterReset = await page.evaluate(() => JSON.parse(localStorage.getItem('sundesk-local-workbase-v1') || '{"base":{"records":[]}}').base.records.length)

  expect(storedAfterLabReset.lab.activeModuleId).toBeNull()
  expect(storedAfterLabReset.lab.modules).toEqual({})
  expect(storedAfterLabReset.lab.sandbox.records.every((record: { fake: boolean }) => record.fake)).toBe(true)
  expect(realRecordCountAfterReset).toBe(realRecordCount)
})

test('Build renders table workshop, record drawer, dependency editor, and Rules panel', async ({ page }) => {
  await page.goto('/#build')

  await expect(page.getByRole('heading', { name: 'Build is freeform first.' })).toBeVisible()
  await expect(page.getByTestId('build-table-tasks')).toBeVisible()
  await page.getByTestId('build-table-tasks').click()

  await expect(page.getByRole('tab', { name: /Work/ })).toHaveAttribute('aria-selected', 'true')
  await page.getByTestId('edit-record-task_permit_toronto').click()
  await expect(page.getByTestId('record-drawer')).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByLabel('Record status')).toContainText('Blocked')
  await expect(page.getByTestId('record-drawer').getByLabel('Record status')).toContainText('2026-05-12')
  await expect(page.getByTestId('record-drawer').getByText('Linked records')).toBeVisible()
  await expect(page.getByTestId('dependency-editor')).toBeVisible()
  await expect(page.getByTestId('dependency-editor').getByPlaceholder('Search records')).toBeVisible()
  await expect(page.getByTestId('dependency-editor').getByRole('button', { name: 'Add dependency' })).toBeDisabled()
  await expect(page.getByTestId('rules-panel').getByRole('heading', { name: 'Route records after the grid has context.' })).toBeVisible()
  await expect(page.getByTestId('rules-panel').getByText('8 rules · 10 matches')).toBeVisible()
  await page.getByTestId('rules-panel').getByRole('heading', { name: 'Route records after the grid has context.' }).click()
  await expect(page.getByTestId('local-rule-row').first().getByRole('button', { name: 'Edit' })).toBeVisible()
})

test('Build record drawer supports linked-record picker editing', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('edit-record-task_permit_toronto').click()

  await expect(page.getByTestId('record-drawer')).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByPlaceholder('Search Communities')).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByRole('button', { name: /Toronto.*Remove/ })).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByText('Backlinks', { exact: true })).toBeVisible()
})

test('Build linked-record edits persist across reloads', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('edit-record-task_meeting_brampton').click()

  const drawer = page.getByTestId('record-drawer')

  await drawer.getByRole('button', { name: /Brampton.*Remove/ }).click()
  await drawer.getByRole('button', { name: /Toronto · At risk/ }).click()
  await expect(page.getByRole('row', { name: /Review Brampton prep notes/ })).toContainText('Toronto')

  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByRole('row', { name: /Review Brampton prep notes/ })).toContainText('Toronto')
})

test('Build creates a local record from the grid', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await addBuildGridRow(page, 'Book generator', { status: 'In progress', dueDate: '2026-05-19' })

  await expect(page.getByTestId('build-screen').getByText('Book generator')).toBeVisible()
})

test('Build grid supports inline cell editing and keyboard movement', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const titleCell = page.getByTestId('grid-cell-task_permit_toronto-title')

  await titleCell.click()
  await titleCell.press('Enter')
  await page.getByLabel('Title editor').fill('Confirm COI certificate')
  await page.getByLabel('Title editor').press('Escape')
  await expect(page.getByRole('row', { name: /Send permit follow-up/ })).toBeVisible()
  await expect(page.getByRole('row', { name: /Confirm COI certificate/ })).toBeHidden()

  await titleCell.press('Enter')
  await page.getByLabel('Title editor').fill('Confirm COI certificate')
  await page.getByLabel('Title editor').press('Tab')
  await expect(page.getByRole('row', { name: /Confirm COI certificate/ })).toBeVisible()
  await expect(page.getByTestId('grid-cell-task_permit_toronto-status')).toBeFocused()
})

test('Build paste shows post-paste helpers', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByRole('tab', { name: /Work/ })).toHaveAttribute('aria-selected', 'true')
  const titleCell = page.getByTestId('grid-cell-task_permit_toronto-title')

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

  await page.locator('[data-onboarding-target="build-add-field"]').first().click()
  const addFieldModal = page.getByRole('dialog', { name: 'Add column' })
  await addFieldModal.getByLabel('Column name').fill('Imported tags')
  await addFieldModal.getByRole('button', { name: 'Add column' }).click()
  await expect(page.getByRole('columnheader', { name: /Imported tags/ }).first()).toBeVisible()

  const importedTagsCell = page.getByTestId('grid-cell-task_permit_toronto-imported_tags')
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

  const titleCell = page.getByTestId('grid-cell-task_permit_toronto-title')

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
  await expect(page.getByRole('menuitem', { name: 'Edit column' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Rename', exact: true })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Change behavior' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Hide from scan' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Sort ascending' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Sort descending' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Group by this column' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Sort descending' }).click()
  await expect(page.getByLabel('Direction')).toHaveValue('desc')

  await titleHeader.locator('.grid-field-menu-trigger').click()
  await page.getByRole('menuitem', { name: 'Duplicate column' }).click()
  await expect(page.getByRole('columnheader', { name: /Title copy/ }).first()).toBeVisible()
})

test('Build menus and non-destructive modals close on Escape', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await page.getByRole('columnheader', { name: /Title/ }).first().locator('.grid-field-menu-trigger').click()
  await expect(page.getByRole('menu', { name: /Title column actions/ })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu', { name: /Title column actions/ })).toBeHidden()

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
  await expect(page.locator('.build-toolbar select').first()).toBeVisible()
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

test('Build exports the current visible table view as a local CSV download', async ({ page }, testInfo) => {
  await page.goto('/#build')

  await expect(page.getByRole('heading', { name: 'Build is freeform first.' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Today' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' })).toBeVisible()
  await page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Today' }).click()
  await expect(page.getByRole('heading', { name: 'Can slip today.' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' })).toBeVisible()
  await page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' }).click()
  await expect(page.getByRole('heading', { name: 'Build is freeform first.' })).toBeVisible()
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByRole('tab', { name: /Work/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('row', { name: /Send permit follow-up/ })).toBeVisible()

  const exportCsv = page.getByRole('button', { name: 'Export CSV' })

  if (await exportCsv.count() === 0) {
    test.info().annotations.push({
      type: 'integration-note',
      description: 'Build Export CSV is not wired in this checkout. Intended assertion: clicking Export CSV downloads the current visible table or view as local CSV with headers and visible rows.',
    })
    return
  }

  const downloadPromise = page.waitForEvent('download')

  await exportCsv.click()

  const download = await downloadPromise
  const csvPath = testInfo.outputPath('sundesk-build-work-export.csv')

  await download.saveAs(csvPath)

  const csv = await readFile(csvPath, 'utf8')
  const [headerRow, ...dataRows] = csv.trim().split(/\r?\n/)

  expect(download.suggestedFilename()).toMatch(/\.csv$/)
  expect(headerRow).toContain('Title')
  expect(headerRow).toContain('Status')
  expect(dataRows.some((row) => row.includes('Send permit follow-up'))).toBe(true)

  await page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Today' }).click()
  await expect(page.getByRole('heading', { name: 'Can slip today.' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' })).toBeVisible()
})

test('Build toolbar colour applies semantic row tinting', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await page.getByText('Shape grid').click()
  await page.getByLabel('Colour').selectOption('status')
  await expect(page.getByRole('row', { name: /Send permit follow-up/ })).toHaveClass(/grid-row-color-coral/)
  await expect(page.getByRole('row', { name: /Log vendor COIs/ })).toHaveClass(/grid-row-color-gold/)
  await expect(page.getByRole('row', { name: /Review Brampton prep notes/ })).toHaveClass(/grid-row-color-lavender/)
})

test('Build chips use semantic colour and field type treatment', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('edit-record-task_permit_toronto').click()

  await expect(page.getByTestId('grid-cell-task_permit_toronto-status').locator('.select-tag')).toHaveClass(/chip-coral/)
  await expect(page.getByTestId('grid-cell-task_vendor_cois_mississauga-status').locator('.select-tag')).toHaveClass(/chip-gold/)
  await expect(page.getByTestId('grid-cell-task_meeting_brampton-status').locator('.select-tag')).toHaveClass(/chip-lavender/)
  await expect(page.getByTestId('grid-cell-task_permit_toronto-tags').getByText('COI')).toBeVisible()
  await page.getByLabel('Tag workflow routes').getByRole('button', { name: 'Permit' }).click()
  await expect(page.getByRole('row', { name: /Log vendor COIs/ })).toBeVisible()
  await expect(page.getByRole('row', { name: /Send permit follow-up/ })).toBeHidden()
  await expect(page.getByTestId('record-drawer').locator('.field-type-chip').first()).toBeVisible()
})

test('Build drawer keeps several tags on one record across reload', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('edit-record-task_permit_toronto').click()

  const tagPicker = page.getByTestId('record-drawer').locator('[data-onboarding-target="field-tags-cell"]')

  await tagPicker.getByRole('button', { name: 'Permit', exact: true }).click()
  await tagPicker.getByRole('button', { name: 'Prep', exact: true }).click()
  await expect(tagPicker.getByRole('button', { name: 'Permit', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(tagPicker.getByRole('button', { name: 'Prep', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('grid-cell-task_permit_toronto-tags').locator('.select-tag')).toContainText(['COI', 'Permit', 'Prep'])

  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('edit-record-task_permit_toronto').click()

  const reopenedTagPicker = page.getByTestId('record-drawer').locator('[data-onboarding-target="field-tags-cell"]')

  await expect(reopenedTagPicker.getByRole('button', { name: 'Permit', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(reopenedTagPicker.getByRole('button', { name: 'Prep', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('grid-cell-task_permit_toronto-tags').locator('.select-tag')).toContainText(['COI', 'Permit', 'Prep'])
})

test('Build exposes onboarding targets for tags, links, views, and checkbox options', async ({ page }) => {
  await page.goto('/#build')

  await expect(page.locator('[data-onboarding-target="nav-build"]')).toBeVisible()
  await expect(page.locator('[data-onboarding-target="build-table-tabs"]')).toBeVisible()
  await expect(page.locator('[data-onboarding-target="build-active-table"]')).toBeVisible()
  await expect(page.locator('[data-onboarding-target="build-view-controls"]')).toBeVisible()
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByTestId('grid-cell-task_permit_toronto-tags')).toBeVisible()
  await expect(page.getByTestId('grid-cell-task_permit_toronto-tags')).toHaveAttribute('data-onboarding-target', 'field-tags-cell')
  await expect(page.getByTestId('grid-cell-task_permit_toronto-community')).toBeVisible()
  await expect(page.getByTestId('grid-cell-task_permit_toronto-community')).toHaveAttribute('data-onboarding-target', 'linked-record-cell')

  await page.locator('[data-onboarding-target="build-add-field"]').first().click()
  const addFieldModal = page.getByRole('dialog', { name: 'Add column' })

  await expect(addFieldModal.locator('[data-onboarding-target="field-type-menu"]')).toBeVisible()
  await addFieldModal.getByLabel('Type').selectOption('checkbox')
  await expect(addFieldModal.locator('[data-onboarding-target="checkbox-icon-flag"] svg')).toBeVisible()

  const flagIconOption = addFieldModal.locator('[data-onboarding-target="checkbox-icon-flag"]')

  await flagIconOption.click()
  await expect(flagIconOption).toHaveAttribute('aria-pressed', 'true')
  await expect(flagIconOption).toHaveClass(/selected/)

  const swatchButtons = addFieldModal.locator('[data-onboarding-target="checkbox-colour-swatch"]')
  const swatchVisibleText = await swatchButtons.evaluateAll((buttons) => buttons.map((button) => button.textContent || '').join(' '))

  expect(await swatchButtons.count()).toBeGreaterThanOrEqual(8)
  expect(swatchVisibleText).not.toMatch(/lime|mint|cyan|blue|violet|pink|rose|orange|gold|graphite/i)

  const secondSwatch = swatchButtons.nth(1)

  await secondSwatch.click()
  await expect(secondSwatch).toHaveAttribute('aria-pressed', 'true')
  await expect(secondSwatch).toHaveClass(/selected/)
})

test('Build grid linked-record editor searches and commits readable records', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const communityCell = page.getByTestId('grid-cell-task_permit_toronto-community')

  await communityCell.click()
  await communityCell.press('Enter')

  const editor = page.getByLabel('Community editor')

  await editor.getByPlaceholder('Search items').fill('charlottetown')
  await editor.getByRole('button', { name: /Brampton · Prep · 2026-05-28/ }).click()
  await editor.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('row', { name: /Send permit follow-up/ })).toContainText('Brampton')
})

test('Build created records persist across reloads', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await addBuildGridRow(page, 'Confirm catering count', { status: 'Waiting' })
  await expect(page.getByTestId('build-screen').getByText('Confirm catering count')).toBeVisible()

  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByTestId('build-screen').getByText('Confirm catering count')).toBeVisible()
})

test('Settings reruns onboarding without clearing the local workspace', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await addBuildGridRow(page, 'Save rental invoice', { status: 'Waiting' })
  await expect(page.getByTestId('build-screen').getByText('Save rental invoice')).toBeVisible()

  const realRecordCount = await page.evaluate(() => JSON.parse(localStorage.getItem('sundesk-local-workbase-v1') || '{"base":{"records":[]}}').base.records.length)

  await page.goto('/#lab')
  await page.getByTestId('lab-module-tags').getByRole('button', { name: /Make tags route work/ }).click()
  await expect(page.getByTestId('lab-module-tags')).toContainText('In progress')

  await page.goto('/#settings')
  await page.getByRole('button', { name: 'Restart onboarding' }).click()
  await expect(page).toHaveURL(/#today$/)
  await expect(page.getByTestId('onboarding-tour')).toBeVisible()
  await expect(page.getByTestId('onboarding-tour')).toContainText('Today')

  const storedAfterRestart = await page.evaluate(() => JSON.parse(localStorage.getItem('sundesk-education-state-v1') || '{}'))
  const realRecordCountAfterRestart = await page.evaluate(() => JSON.parse(localStorage.getItem('sundesk-local-workbase-v1') || '{"base":{"records":[]}}').base.records.length)

  expect(storedAfterRestart.onboarding.status).toBe('inProgress')
  expect(storedAfterRestart.onboarding.currentStepId).toBe('today')
  expect(storedAfterRestart.lab.modules.tags.status).toBe('inProgress')
  expect(realRecordCountAfterRestart).toBe(realRecordCount)

  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByTestId('build-screen').getByText('Save rental invoice')).toBeVisible()
})

test('Build adds and removes a dependency link', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('edit-record-task_meeting_brampton').click()

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
  await page.getByTestId('edit-record-task_meeting_brampton').click()

  const editor = page.getByTestId('dependency-editor')

  await editor.getByPlaceholder('Search records').fill('permit')
  await editor.getByRole('button', { name: /Permit approval/ }).click()
  await editor.getByPlaceholder('Why this link matters').fill('Permit needs agenda context.')
  await editor.getByRole('button', { name: 'Add dependency' }).click()
  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('edit-record-task_meeting_brampton').click()

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
  await page.getByTestId('edit-record-task_permit_toronto').click()
  await expect(page.getByTestId('record-drawer').getByText('Owner').first()).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByText('Choose a linked table in field settings.').first()).toBeVisible()

  await page.reload()
  await expect(page.getByTestId('build-table-people')).toBeHidden()
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('edit-record-task_permit_toronto').click()
  await expect(page.getByTestId('record-drawer').getByText('Owner').first()).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByText('Choose a linked table in field settings.').first()).toBeVisible()
})

test('Build saves, applies, pins, and deletes a view', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByLabel('Filter').fill('permit')
  await page.locator('[data-onboarding-target="build-save-view"]').click()

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
  await page.locator('[data-onboarding-target="build-save-view"]').click()

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
  await page.locator('[data-onboarding-target="build-save-view"]').click()

  const savedView = page.getByLabel('View name').locator('xpath=ancestor::article[1]')

  await savedView.getByRole('button', { name: 'Pin' }).click()
  await page.reload()

  await expect(page.getByLabel('Pinned Build views').getByRole('button', { name: /view 1/ })).toBeVisible()
  await expect(page.getByLabel('Filter')).toHaveValue('permit')
})

test('Build field create, edit, and delete persist across reloads', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.locator('[data-onboarding-target="build-add-field"]').first().click()

  const addFieldModal = page.getByRole('dialog', { name: 'Add column' })

  await addFieldModal.getByLabel('Column name').fill('Notes')
  await addFieldModal.getByLabel('Type').selectOption('longText')
  await addFieldModal.getByRole('button', { name: 'Add column' }).click()
  await expect(page.getByRole('status')).toHaveText('Column added.')
  await expect(page.getByRole('columnheader', { name: /Notes/ }).first()).toBeVisible()
  await page.getByRole('columnheader', { name: /Notes/ }).first().locator('.grid-field-menu-trigger').click()
  await page.getByRole('menuitem', { name: 'Edit column' }).click()

  const settingsModal = page.getByRole('dialog', { name: 'Column settings' })

  await settingsModal.getByLabel('Column name').fill('Internal notes')
  await settingsModal.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('columnheader', { name: /Internal notes/ }).first()).toBeVisible()
  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByRole('columnheader', { name: /Internal notes/ }).first()).toBeVisible()
  await page.getByRole('columnheader', { name: /Internal notes/ }).first().locator('.grid-field-menu-trigger').click()
  await page.getByRole('menuitem', { name: 'Delete column' }).click()
  await page.getByRole('dialog', { name: 'Delete column' }).getByRole('button', { name: 'Delete column' }).click()
  await expect(page.getByRole('columnheader', { name: /Internal notes/ })).toBeHidden()
  await page.reload()
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByRole('columnheader', { name: /Internal notes/ })).toBeHidden()
})

test('Build Rule edits persist as read-only previews', async ({ page }) => {
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await page.getByTestId('rules-panel').getByRole('heading', { name: 'Route records after the grid has context.' }).click()
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
  await page.getByTestId('rules-panel').getByRole('heading', { name: 'Route records after the grid has context.' }).click()

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

  await addBuildGridRow(page, 'Reflection smoke task', { status: 'Blocked', dueDate: '2026-05-10' })
  await page.reload()
  await page.goto('/#today')

  await expect(page.getByTestId('today-lane-now').getByText('Reflection smoke task')).toBeVisible()
  await page.goto('/#timeline')
  await page.getByPlaceholder('Find items').fill('reflection')
  await expect(page.getByTestId('timeline-list').getByText('Reflection smoke task')).toBeVisible()
})

test('Timeline filters records and keeps rule receipts visible', async ({ page }) => {
  await page.goto('/#timeline')
  await expect(page.getByRole('heading', { name: 'Timeline has 5 ways to look.' })).toBeVisible()
  await expect(page.getByTestId('timeline-mode-receipt')).toContainText('Question')
  await expect(page.getByTestId('timeline-mode-receipt')).toContainText('Which rows need a clean read.')

  await page.getByPlaceholder('Find items').fill('permit')

  await expect(page.getByTestId('timeline-row-task_vendor_cois_mississauga')).toBeVisible()
  await expect(page.getByTestId('timeline-row-approval_vendor_cois_mississauga')).toBeVisible()
  await expect(page.getByTestId('timeline-list').getByText('Rule: Work.Due date is within 7 days. show in screen: Timeline.')).toBeVisible()
  await page.getByRole('tab', { name: 'Kanban' }).click()
  await expect(page.getByTestId('timeline-mode-receipt')).toContainText('Where is the work stuck.')
  await expect(page.getByTestId('timeline-kanban')).toBeVisible()
  await page.getByLabel('Waiting lane').getByRole('button', { name: 'Move to Prep' }).click()
  await expect(page.getByLabel('Prep lane')).toContainText('Log vendor COIs')
  await expect(page.getByRole('status')).toContainText('Log vendor COIs. moved to Prep.')
  await page.getByRole('tab', { name: 'Calendar' }).click()
  await expect(page.getByTestId('timeline-mode-receipt')).toContainText('Which dates are carrying pressure.')
  await expect(page.getByTestId('timeline-calendar')).toBeVisible()
  await expect(page.getByTestId('timeline-calendar').getByLabel('Calendar date focus')).toBeVisible()
  await page.getByTestId('timeline-calendar').getByLabel('Calendar date focus').getByRole('button', { name: /May 13/ }).click()
  await expect(page.getByTestId('timeline-calendar').getByLabel('Calendar day detail')).toContainText('Log vendor COIs')
  await page.getByRole('tab', { name: 'Timeline' }).click()
  await expect(page.getByTestId('timeline-mode-receipt')).toContainText('Which places are ready before event day.')
  await expect(page.getByTestId('timeline-readiness')).toBeVisible()
  await expect(page.getByTestId('timeline-readiness').getByLabel('Readiness place focus')).toBeVisible()
  await page.getByTestId('timeline-readiness').getByLabel('Readiness place focus').getByRole('button', { name: 'Mississauga' }).click()
  await expect(page.getByTestId('timeline-readiness').getByLabel('Readiness place focus')).toContainText('Mississauga')
  await expect(page.getByTestId('timeline-readiness').getByLabel('Focused readiness rows')).toContainText('Log vendor COIs')
  await page.getByRole('tab', { name: 'Graph' }).click()
  await expect(page.getByTestId('timeline-mode-receipt')).toContainText('Why is this place at risk.')
  await expect(page.getByTestId('timeline-graph')).toBeVisible()
  await expect(page.getByTestId('timeline-graph').getByLabel('Graph place focus')).toBeVisible()
  await page.getByTestId('timeline-graph').getByLabel('Graph place focus').getByRole('button', { name: 'Mississauga' }).click()
  await expect(page.getByTestId('timeline-graph').locator('.graph-node.center')).toContainText('Mississauga')
  await page.getByLabel('Timeline tag routes').getByRole('button', { name: 'Permit' }).click()
  await expect(page.getByTestId('build-screen')).toBeVisible()
  await expect(page.getByLabel('Filter')).toHaveValue('Permit')
  await expect(page.getByRole('row', { name: /Log vendor COIs/ })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Tag route opened: Permit.')
})

test('Daily support actions open real local surfaces', async ({ page }) => {
  await page.goto('/#communities')
  await expect(page.getByRole('heading', { name: 'Communities are the command center.' })).toBeVisible()
  await expect(page.getByText('Scan every place.')).toBeVisible()
  await expect(page.getByTestId('community-command-board').getByRole('button', { name: /Toronto/ })).toBeVisible()
  await expect(page.getByTestId('community-command-board').getByRole('button', { name: /Mississauga/ })).toBeVisible()
  await expect(page.getByTestId('community-command-board').getByRole('button', { name: /Brampton/ })).toBeVisible()
  await expect(page.getByTestId('community-command-board').getByRole('button', { name: /Vaughan/ })).toBeVisible()
  await page.getByRole('button', { name: /Mississauga/ }).click()
  await expect(page.getByTestId('community-place-detail')).toContainText('Mississauga')
  await expect(page.getByTestId('community-place-detail')).toContainText('What needs attention')
  await expect(page.getByTestId('community-place-detail')).toContainText('66% ready')
  await expect(page.getByTestId('community-place-detail')).toContainText('Waiting on reply before readiness can move')
  await expect(page.getByTestId('community-place-detail')).toContainText('Vendor COIs stale')
  await page.getByRole('button', { name: /Toronto/ }).click()
  await expect(page.getByTestId('community-place-detail')).toContainText('Toronto')
  await page.getByLabel('Community routes').getByRole('button', { name: 'See waiting' }).click()
  await expect(page.getByTestId('build-screen')).toBeVisible()
  await expect(page.getByTestId('build-table-followups')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('Active Build filter')).toContainText('Toronto')
  await expect(page.getByRole('row', { name: /Send permit follow-up/ })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Community route opened: Waiting.')
  await page.goto('/#communities')
  await page.getByRole('button', { name: /Toronto/ }).click()
  await page.getByLabel('Community routes').getByRole('button', { name: 'Open community' }).click()
  await expect(page.getByTestId('community-detail-command')).toContainText('READINESS')
  await expect(page.getByTestId('community-detail-command')).toContainText('BLOCKERS')
  await expect(page.getByTestId('community-detail-command')).toContainText('Next action')

  await page.goto('/#followups')
  await page.getByRole('button', { name: 'Add waiting item' }).click()
  await expect(page.getByTestId('record-modal')).toBeVisible()
  await expect(page.getByTestId('record-modal')).toContainText('New record.')

  await page.goto('/#meetings')
  await expect(page.getByTestId('meeting-prep').getByText('Computed prep').first()).toBeVisible()
  await expect(page.getByTestId('meeting-weekly-note').getByText('Generated weekly note').first()).toBeVisible()
  await expect(page.getByTestId('meeting-weekly-note').getByLabel('Weekly note fields')).toContainText('Meeting date')
  await expect(page.getByTestId('meeting-weekly-note').getByLabel('Weekly note fields')).toContainText('Note state')
  await page.getByTestId('meeting-weekly-note').getByRole('textbox', { name: 'Decisions' }).fill('- Hold permit call.')
  await expect(page.getByLabel('Weekly note draft').first()).toContainText('## Decisions\n- Hold permit call.')
  await expect(page.getByTestId('meeting-weekly-note').getByLabel('Routed source inserts')).toContainText('In progress by 2026-05-14 belongs in next steps.')
  await page.getByTestId('meeting-weekly-note').getByLabel('Routed source inserts').getByRole('button').filter({ hasText: 'Review Brampton prep notes.' }).click()
  await expect(page.getByLabel('Weekly note draft').first()).toContainText('## Next steps')
  await page.getByTestId('meeting-weekly-note').getByRole('button', { name: 'Open source record Review Brampton prep notes.' }).click()
  await expect(page.getByTestId('build-screen')).toBeVisible()
  await expect(page.getByTestId('record-drawer')).toContainText('Review Brampton prep notes.')
  await expect(page.getByRole('status')).toContainText('Meeting source opened: Review Brampton prep notes.')
  await page.goto('/#meetings')
  await page.getByLabel('Weekly note draft').first().fill('## Decisions\n- Move vendor call to Monday.')
  await expect(page.getByLabel('Weekly note draft').first()).toHaveValue('## Decisions\n- Move vendor call to Monday.')
  await page.reload()
  await expect(page.getByLabel('Weekly note draft').first()).toHaveValue('## Decisions\n- Move vendor call to Monday.')
  await expect(page.getByTestId('meeting-weekly-note').getByLabel('Weekly note fields')).toContainText('Saved draft')
  await expect(page.getByTestId('meeting-weekly-note').getByRole('button', { name: 'Copy note' }).first()).toBeVisible()
  await expect(page.getByTestId('meeting-weekly-note').getByRole('button', { name: 'Export PDF' }).first()).toBeVisible()
  await expect(page.getByTestId('meeting-prep').getByText('Source records').first()).toBeVisible()
  await expect(page.getByTestId('meeting-agenda').getByText('Generated agenda').first()).toBeVisible()
  await expect(page.getByTestId('meeting-agenda').getByText('Assign next steps.').first()).toBeVisible()
  await expect(page.getByTestId('meeting-agenda').getByRole('button', { name: 'Copy agenda' }).first()).toBeVisible()
  await expect(page.getByTestId('meeting-agenda').getByRole('button', { name: 'Export agenda PDF' }).first()).toBeVisible()
  await expect(page.getByTestId('meeting-prep')).not.toContainText('Export .md')
  await page.getByTestId('meeting-agenda').getByRole('button', { name: 'Preview summary' }).first().click()
  await expect(page.getByTestId('agenda-digest-preview').getByText('Command send preview.').first()).toBeVisible()
  await expect(page.getByTestId('agenda-digest-preview').getByText('Agenda items: 5. Source records: 2.').first()).toBeVisible()
  await expect(page.getByTestId('meeting-prep').getByText('Next steps').first()).toBeVisible()
  await page.getByRole('button', { name: 'Open next meeting' }).click()
  await expect(page.getByTestId('record-drawer')).toBeVisible()
  await expect(page.getByTestId('record-drawer').getByTestId('meeting-prep')).toBeVisible()
})

test('Meetings export note and agenda PDFs locally', async ({ page }, testInfo) => {
  const firebaseWriteRequests = auditFirebaseWrites(page)

  await page.goto('/#meetings')

  const noteDownloadPromise = page.waitForEvent('download')

  await page.getByTestId('meeting-weekly-note').getByRole('button', { name: 'Export PDF' }).first().click()
  const noteDownload = await noteDownloadPromise
  const notePath = testInfo.outputPath(noteDownload.suggestedFilename())

  await noteDownload.saveAs(notePath)
  await expect(page.getByRole('status')).toContainText('Meeting note PDF exported.')

  const noteBytes = await readFile(notePath)

  expect(noteDownload.suggestedFilename()).toMatch(/^sundesk-meeting-note-.+\.pdf$/)
  expect(noteBytes.length).toBeGreaterThan(100)
  expect(noteBytes.subarray(0, 4).toString()).toBe('%PDF')

  const noteState = await page.evaluate(() => JSON.parse(localStorage.getItem('sundesk-education-state-v1') || '{}'))

  expect(noteState.meetingPdf.lastExportedMeetingId).toBe('meeting_brampton')

  const agendaDownloadPromise = page.waitForEvent('download')

  await page.getByTestId('meeting-agenda').getByRole('button', { name: 'Export agenda PDF' }).first().click()
  const agendaDownload = await agendaDownloadPromise
  const agendaPath = testInfo.outputPath(agendaDownload.suggestedFilename())

  await agendaDownload.saveAs(agendaPath)
  await expect(page.getByRole('status')).toContainText('Agenda PDF exported.')

  const agendaBytes = await readFile(agendaPath)

  expect(agendaDownload.suggestedFilename()).toMatch(/^sundesk-meeting-agenda-.+\.pdf$/)
  expect(agendaBytes.length).toBeGreaterThan(100)
  expect(agendaBytes.subarray(0, 4).toString()).toBe('%PDF')

  const agendaState = await page.evaluate(() => JSON.parse(localStorage.getItem('sundesk-education-state-v1') || '{}'))

  expect(agendaState.meetingPdf.lastExportedMeetingId).toBe('meeting_brampton')
  expect(firebaseWriteRequests).toEqual([])
})

test('Settings keeps data status visible and engine details manual', async ({ page }) => {
  await page.goto('/#settings')

  await expect(page.getByRole('heading', { name: 'Local workspace.' })).toBeVisible()
  const sensitiveStorageMessage = 'Sensitive details are stored at your own risk.'
  const dataRiskNote = 'Avoid files, document contents, private numbers, permit details, COI contents, and contract text unless you intend to store them here.'

  await expect(page.getByText(sensitiveStorageMessage)).toBeVisible()
  await expect(page.getByText(dataRiskNote)).toBeHidden()
  await page.getByText('Show sensitive data note').click()
  await expect(page.getByText(dataRiskNote)).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: sensitiveStorageMessage })).toHaveCount(0)
  await expect(page.getByRole('banner').filter({ hasText: sensitiveStorageMessage })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Local copy.' })).toBeVisible()
  await expect(page.getByText('Backup controls are local commands. They do not change Firebase setup or write remote data.')).toBeVisible()
  await expect(page.getByText('Import replaces local tables, records, rules, and Build views after you choose a file.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export backup' })).toBeEnabled()
  await expect(page.getByText('Prepare import', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Import Sundesk backup JSON file')).toBeEnabled()
  await page.getByText('Prepare import', { exact: true }).click()
  await expect(page.getByText('Choose backup file', { exact: true })).toBeVisible()
  await expect(page.getByText('Backup handlers are not connected in this build.')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Readiness.' })).toBeVisible()
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Local backup rehearsal')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Firebase config')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Deploy approval')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Firestore writes')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('No Firebase writes')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Run a local backup export and import rehearsal before launch.')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('6 config fields missing. Add Firebase config before hosted use.')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Write gate is disabled. No remote writes can run in this build.')
  await expect(page.getByText('Access. Local browser mode. No sign-in required.')).toBeVisible()
  await expect(page.getByText('Workspace. Local workspace active.')).toBeVisible()
  await expect(page.getByText('Firebase setup. Local mode. 6 config fields missing. 0 approved accounts in local config.')).toBeVisible()
  await expect(page.getByLabel('Command send local status')).toContainText('Local only.')
  await expect(page.getByLabel('Command send local status')).toContainText('No email is sent from Settings.')
  await expect(page.getByLabel('Command send local status')).toContainText('Private deploy environment.')
  await expect(page.getByLabel('Command send local status')).toContainText('7:30 AM')
  await expect(page.getByLabel('Command send local status')).toContainText('America/Toronto.')
  await expect(page.getByText('Next setup step. Add Firebase config and approved accounts before hosted use.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Command Center' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Command Center' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Graphite' }).click()
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'graphite')
  await expect(page.getByRole('button', { name: 'Graphite' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Write gate. Disabled. No Firestore writes can run in this build.')).toBeVisible()
  await expect(page.getByText('Read shadow. Off. Local storage is the active source.')).toBeVisible()
  await expect(page.getByText('Show workspace counts')).toBeVisible()
  await page.locator('.data-access-panel').getByText('Show command routing').click()
  await expect(page.getByTestId('rule-destination-grid').getByText('Today')).toBeVisible()
  await expect(page.getByTestId('rule-destination-grid')).toContainText('Timeline')
  await page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Today' }).click()
  await expect(page.getByRole('heading', { name: 'Can slip today.' })).toBeVisible()
  await page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' }).click()
  await expect(page.getByRole('heading', { name: 'Build is freeform first.' })).toBeVisible()
})

test('Settings Help search and RuPaul Mode stay local and persistent', async ({ page }) => {
  await page.goto('/#settings')

  await expect(page.getByRole('heading', { name: 'Find the local answer.' })).toBeVisible()
  await expect(page.getByText('Long hover still shows the plain version')).toBeVisible()
  await expect(page.getByText('Show sensitive data note')).toBeVisible()
  await expect(page.getByText('Use Sundesk for sensitive information at your own risk. Josh can help tune the setup, but you still choose what belongs in the app')).toBeHidden()
  await page.getByText('Show sensitive data note').click()
  await expect(page.getByText('Use Sundesk for sensitive information at your own risk. Josh can help tune the setup, but you still choose what belongs in the app')).toBeVisible()

  await page.getByLabel('Search Help').fill('tags Steph')
  await expect(page.getByLabel('Help results')).toContainText('Tags and labels')
  await expect(page.getByLabel('Help results')).toContainText('Lab tags')

  await page.getByLabel('Search Help').fill('PDF boss')
  await expect(page.getByLabel('Help results')).toContainText('Meeting notes and PDFs')
  await expect(page.getByLabel('Help results')).toContainText('Meetings')
  await page.getByRole('button', { name: 'Open Meetings' }).click()
  await expect(page.getByRole('heading', { name: 'Weekly notes first.' })).toBeVisible()
  await page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Settings' }).click()

  await page.getByLabel('Search Help').fill('iPhone PWA')
  await expect(page.getByLabel('Help results')).toContainText('Use Sundesk on iPhone')

  await page.getByLabel('Search Help').fill('login shared data')
  await expect(page.getByLabel('Help results')).toContainText('Shared workspace access')

  await page.getByLabel('Search Help').fill('desktop bookmark icon')
  await expect(page.getByLabel('Help results')).toContainText('Install and bookmark Sundesk')

  await page.getByLabel('Search Help').fill('start over tutorial')
  await expect(page.getByLabel('Help results')).toContainText('Run onboarding again')

  await page.getByLabel('Search Help').fill('privacy disclaimer')
  await expect(page.getByLabel('Help results')).toContainText('Privacy and at-your-own-risk note')

  await page.getByLabel('Search Help').fill('RuPaul plain version')
  await expect(page.getByLabel('Help results')).toContainText('RuPaul Mode')

  await page.getByLabel('Search Help').fill('Lab sample')
  await expect(page.getByLabel('Help results')).toContainText('Sundesk Lab')

  await page.getByLabel('Search Help').fill('not a local article')
  await expect(page.getByLabel('Help results')).toContainText('No help results found.')
  await expect(page.getByLabel('Help results')).toContainText('Can’t find it here? Send Josh what you were trying to do and where you got stuck.')

  await page.locator('.rupaul-toggle').click()
  await expect(page.getByLabel('RuPaul Mode')).toBeChecked()
  await page.locator('.settings-sensitive-details').evaluate((element) => {
    if (element instanceof HTMLDetailsElement) {
      element.open = true
    }
  })
  await expect(page.getByText('Sensitive data enters at your own risk. The wig is tall. The secret is still a secret')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Today' })).toContainText('Today. Main stage for the mess')
  await expect(page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' })).toContainText('Build. Werkroom for the messy table era')
  await expect(page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Meetings' })).toContainText('Meetings. Bring receipts and posture')
  await expect(page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Settings' })).toContainText('Settings. Adjust the lighting')
  await expect(page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' })).toHaveAttribute('title', 'Build')
  await expect(page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' })).toHaveAttribute('data-copy-plain', 'Build')

  await page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' }).click()
  await expect(page.getByRole('button', { name: 'Add table' })).toContainText('New category')
  await expect(page.getByRole('button', { name: 'Add table' })).toHaveAttribute('data-copy-plain', 'Add table')
  await expect(page.getByRole('button', { name: 'Add column', exact: true }).first()).toContainText('Give it a talent')
  await expect(page.locator('[data-onboarding-target="build-save-view"]')).toContainText('Views')
  await expect(page.getByTestId('build-add-record')).toContainText('Another queen enters')

  await page.getByRole('button', { name: 'Add table' }).click()
  const addTableModal = page.getByRole('dialog', { name: 'Add table' })
  await expect(addTableModal.getByRole('button', { name: 'Close' })).toContainText('Curtain down')
  await expect(addTableModal.getByRole('button', { name: 'Close' })).toHaveAttribute('data-copy-plain', 'Close')
  await expect(addTableModal.getByRole('button', { name: 'Cancel' })).toContainText('Sashay away from this edit')
  await expect(addTableModal.getByRole('button', { name: 'Add table' })).toContainText('New category')
  await expect(addTableModal.getByRole('button', { name: 'Add table' })).toHaveAttribute('title', 'Add table')
  await addTableModal.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Meetings' }).click()
  await expect(page.getByTestId('meeting-agenda').getByRole('button', { name: 'Copy agenda' }).first()).toContainText('No improv in the werkroom')
  await expect(page.getByTestId('meeting-agenda').getByRole('button', { name: 'Copy agenda' }).first()).toHaveAttribute('data-copy-plain', 'Copy agenda')
  await expect(page.getByTestId('meeting-agenda').getByRole('button', { name: 'Export agenda PDF' }).first()).toContainText('Receipts for the judging panel')
  await expect(page.getByTestId('meeting-agenda').getByRole('button', { name: 'Preview summary' }).first()).toContainText('Read the room first')

  const storedCopyMode = await page.evaluate(() => {
    const rawState = window.localStorage.getItem('sundesk-education-state-v1')

    return rawState ? JSON.parse(rawState).copyMode : null
  })

  expect(storedCopyMode.rupaulMode).toBe(true)

  await page.reload()
  await page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Settings' }).click()
  await expect(page.getByLabel('RuPaul Mode')).toBeChecked()
  await expect(page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Sundesk Lab' })).toContainText('Sundesk Lab. Rehearse the chaos')
  await page.getByLabel('Search Help').fill('unknown')
  await expect(page.getByLabel('Help results')).toContainText('No help result found. The judges need a better keyword')
})

test('Settings Help actions open the exact Lab module and onboarding tour', async ({ page }) => {
  await page.goto('/#settings')

  await page.getByLabel('Search Help').fill('tags Steph')
  await page.getByRole('button', { name: 'Open Lab tags' }).click()
  await expect(page).toHaveURL(/#lab$/)
  await expect(page.getByTestId('lab-active-module')).toContainText('Tags')

  const labState = await page.evaluate(() => JSON.parse(localStorage.getItem('sundesk-education-state-v1') || '{}'))

  expect(labState.lab.activeModuleId).toBe('tags')
  expect(labState.lab.modules.tags.status).toBe('inProgress')

  await page.goto('/#settings')
  await page.getByLabel('Search Help').fill('start over tutorial')
  await page.getByLabel('Help results').getByRole('button', { name: 'Restart onboarding' }).click()
  await expect(page).toHaveURL(/#today$/)
  await expect(page.getByTestId('onboarding-tour')).toBeVisible()
  await expect(page.getByTestId('onboarding-tour')).toContainText('Today')

  const onboardingState = await page.evaluate(() => JSON.parse(localStorage.getItem('sundesk-education-state-v1') || '{}'))

  expect(onboardingState.onboarding.status).toBe('inProgress')
  expect(onboardingState.onboarding.currentStepId).toBe('today')
  expect(onboardingState.lab.activeModuleId).toBe('tags')
})

test('Settings exports and imports a local backup without changing Firebase write UI', async ({ page }, testInfo) => {
  const firebaseWriteRequests = auditFirebaseWrites(page)
  const originalTitle = 'Backup restore seed'
  const changedTitle = 'Backup restore changed'
  const todayRouteDate = '2026-05-10'
  const firebaseSetupText = 'Firebase setup. Local mode. 6 config fields missing. 0 approved accounts in local config.'
  const writeGateText = 'Write gate. Disabled. No Firestore writes can run in this build.'
  const backupNoteText = 'Backup controls are local commands. They do not change Firebase setup or write remote data.'

  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const fakeRecordId = await addBuildGridRow(page, originalTitle, { status: 'Blocked', dueDate: todayRouteDate })

  await expect(page.getByRole('row', { name: new RegExp(originalTitle) })).toBeVisible()

  const communityCell = page.getByTestId(`grid-cell-${fakeRecordId}-community`)

  await communityCell.click()
  await communityCell.press('Enter')
  await page.getByLabel('Community editor').getByPlaceholder('Search records').fill('halifax')
  await page.getByLabel('Community editor').getByRole('button', { name: /Toronto · At risk · 2026-05-22/ }).click()
  await page.getByLabel('Community editor').getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('row', { name: new RegExp(originalTitle) })).toContainText('Toronto')

  await page.goto('/#today')
  await expect(page.getByRole('heading', { name: 'Can slip today.' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' })).toBeVisible()
  await expect(page.getByTestId('today-lane-now').getByText(originalTitle)).toBeVisible()

  await page.goto('/#settings')
  await expect(page.getByText(backupNoteText)).toBeVisible()
  await expect(page.getByText(firebaseSetupText)).toBeVisible()
  await expect(page.getByText(writeGateText)).toBeVisible()
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Run a local backup export and import rehearsal before launch.')

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
  expect(exportedRecord?.values?.status).toBe('Blocked')
  expect(exportedRecord?.values?.dueDate).toBe(todayRouteDate)
  expect(exportedRecord?.values?.community).toEqual(['community_toronto'])

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

  await page.getByText('Prepare import', { exact: true }).click()
  await page.getByText('Choose backup file', { exact: true }).click()

  const fileChooser = await fileChooserPromise

  await fileChooser.setFiles(backupPath)
  await expect(page.getByRole('status')).toContainText('Local backup imported.')
  await expect(page.getByText(backupNoteText)).toBeVisible()
  await expect(page.getByText(firebaseSetupText)).toBeVisible()
  await expect(page.getByText(writeGateText)).toBeVisible()
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Backup export and import rehearsal is done.')

  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByRole('row', { name: new RegExp(originalTitle) })).toBeVisible()
  await expect(page.getByRole('row', { name: new RegExp(originalTitle) })).toContainText('Toronto')
  await expect(page.getByRole('row', { name: new RegExp(changedTitle) })).toBeHidden()
  await page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Today' }).click()
  await expect(page.getByRole('heading', { name: 'Can slip today.' })).toBeVisible()
  await expect(page.getByTestId('today-lane-now').getByText(originalTitle)).toBeVisible()
  await page.getByRole('navigation', { name: 'Sundesk navigation' }).getByRole('link', { name: 'Build' }).click()
  await expect(page.getByRole('heading', { name: 'Build is freeform first.' })).toBeVisible()
  expect(firebaseWriteRequests).toEqual([])
})

test('Settings rejects unsupported backup imports without changing local work', async ({ page }, testInfo) => {
  const firebaseWriteRequests = auditFirebaseWrites(page)
  const seedTitle = 'Import guard seed'
  const unsupportedBackupPath = testInfo.outputPath('unsupported-sundesk-backup.json')

  await writeFile(unsupportedBackupPath, JSON.stringify({
    appName: 'Other',
    version: 1,
    workbase: {
      records: [
        {
          id: 'bad_record',
          values: {
            title: 'Bad import should not land',
          },
        },
      ],
    },
  }))

  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  await addBuildGridRow(page, seedTitle, { status: 'Waiting' })
  await expect(page.getByRole('row', { name: new RegExp(seedTitle) })).toBeVisible()

  await page.goto('/#settings')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Run a local backup export and import rehearsal before launch.')

  const fileChooserPromise = page.waitForEvent('filechooser')

  await page.getByText('Prepare import', { exact: true }).click()
  await page.getByText('Choose backup file', { exact: true }).click()

  const fileChooser = await fileChooserPromise

  await fileChooser.setFiles(unsupportedBackupPath)
  await expect(page.getByRole('status')).toContainText('Unsupported Sundesk backup.')
  await expect(page.getByLabel('Launch readiness checks')).toContainText('Run a local backup export and import rehearsal before launch.')

  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()
  await expect(page.getByRole('row', { name: new RegExp(seedTitle) })).toBeVisible()
  await expect(page.getByText('Bad import should not land')).toHaveCount(0)
  expect(firebaseWriteRequests).toEqual([])
})

test('Mobile keeps navigation and touch targets usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const railPosition = await page.locator('.rail').evaluate((element) => window.getComputedStyle(element).position)
  const navigation = page.getByRole('navigation', { name: 'Sundesk navigation' })
  const coreNavigationLabels = ['Today', 'Communities', 'Waiting On', 'Meetings', 'Timeline', 'Build']

  expect(railPosition).toBe('fixed')
  await expect(page.getByRole('heading', { name: 'Can slip today.' })).toBeVisible()

  for (const label of coreNavigationLabels) {
    const link = navigation.getByRole('link', { name: label })

    await expect(link).toBeVisible()

    const box = await link.boundingBox()

    expect(box?.height).toBeGreaterThanOrEqual(44)
    expect(box?.x).toBeGreaterThanOrEqual(0)
    expect(box ? box.x + box.width : 0).toBeLessThanOrEqual(390)
    expect(box ? box.y + box.height : 0).toBeLessThanOrEqual(844)
  }

  await navigation.getByRole('link', { name: 'Build' }).click()
  await expect(page.getByTestId('build-screen')).toBeVisible()
  await expect(navigation.getByRole('link', { name: 'Today' })).toBeVisible()
  await expect(navigation.getByRole('link', { name: 'Build' })).toHaveAttribute('aria-current', 'page')
})

test('Mobile Build keeps dense controls, drawer, and onboarding inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#build')
  await expect(page.getByTestId('build-screen')).toBeVisible()

  const assertInViewport = async (selector: string) => {
    const box = await page.locator(selector).first().boundingBox()

    expect(box?.x).toBeGreaterThanOrEqual(0)
    expect(box ? box.x + box.width : 0).toBeLessThanOrEqual(390)
  }

  await assertInViewport('.build-workbench')
  await assertInViewport('.table-tabs')
  await assertInViewport('.grid-toolbar.build-toolbar')
  await assertInViewport('.record-table-wrap')
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', 390)

  await page.getByTestId('edit-record-risk_permit_toronto').click()
  await expect(page.getByTestId('record-drawer')).toBeVisible()
  await assertInViewport('.record-drawer.active-record-drawer')
  await expect(page.getByTestId('record-drawer').getByRole('heading', { name: 'Venue readiness may slip.' })).toBeVisible()

  await page.evaluate(() => {
    const existing = JSON.parse(window.localStorage.getItem('sundesk-education-state-v1') || '{}')

    window.localStorage.setItem('sundesk-education-state-v1', JSON.stringify({
      ...existing,
      onboarding: {
        status: 'inProgress',
        currentStepId: 'build-nav',
        completedStepIds: ['welcome', 'today'],
        completedActionIds: ['start-tour', 'view-today'],
        startedAt: '2026-05-10T12:00:00.000Z',
        completedAt: null,
        lastSeenAt: '2026-05-10T12:00:00.000Z',
      },
    }))
  })
  await page.reload()
  await expect(page.getByTestId('onboarding-tour')).toBeVisible()
  await assertInViewport('.onboarding-annotation-card')
})

test('Mobile Build keeps modals and field editors inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#build')
  await page.getByTestId('build-table-tasks').click()

  const assertLocatorInViewport = async (locator: ReturnType<typeof page.locator>) => {
    await locator.first().scrollIntoViewIfNeeded()

    const box = await locator.first().boundingBox()

    expect(box?.x).toBeGreaterThanOrEqual(0)
    expect(box?.y).toBeGreaterThanOrEqual(0)
    expect(box ? box.x + box.width : 0).toBeLessThanOrEqual(390)
    expect(box ? box.y + box.height : 0).toBeLessThanOrEqual(844)
  }

  const assertLocatorCurrentlyInViewport = async (locator: ReturnType<typeof page.locator>) => {
    const box = await locator.first().boundingBox()

    expect(box?.x).toBeGreaterThanOrEqual(0)
    expect(box?.y).toBeGreaterThanOrEqual(0)
    expect(box ? box.x + box.width : 0).toBeLessThanOrEqual(390)
    expect(box ? box.y + box.height : 0).toBeLessThanOrEqual(844)
  }

  await page.locator('[data-onboarding-target="build-add-field"]').first().click()

  const addFieldModal = page.getByRole('dialog', { name: 'Add column' })

  await expect(addFieldModal).toBeVisible()
  await assertLocatorInViewport(addFieldModal)
  await assertLocatorInViewport(addFieldModal.getByLabel('Type'))
  await assertLocatorInViewport(addFieldModal.locator('.modal-actions'))

  await addFieldModal.getByLabel('Type').selectOption('checkbox')
  await assertLocatorInViewport(addFieldModal.locator('.checkbox-style-grid'))
  await assertLocatorInViewport(addFieldModal.locator('.checkbox-color-grid'))
  await assertLocatorInViewport(addFieldModal.locator('.modal-actions'))
  await addFieldModal.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await assertLocatorCurrentlyInViewport(addFieldModal.getByRole('button', { name: 'Close' }))
  await assertLocatorCurrentlyInViewport(addFieldModal.locator('.modal-actions'))

  await addFieldModal.getByLabel('Type').selectOption('linkedRecord')
  await assertLocatorInViewport(addFieldModal.getByLabel('Connected table'))
  await assertLocatorInViewport(addFieldModal.getByText('Allow multiple linked records'))
  await addFieldModal.getByRole('button', { name: 'Cancel' }).click()

  await page.getByTestId('build-add-record').first().click()

  const titleEditor = page.getByLabel('Title editor')

  await expect(titleEditor).toBeVisible()
  await assertLocatorInViewport(titleEditor)
  await titleEditor.fill('Mobile inline row')
  await titleEditor.press('Enter')
  await expect(page.getByRole('row', { name: /Mobile inline row/ })).toBeVisible()
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', 390)
})

test('First-run onboarding mobile PWA surfaces stay reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page.getByTestId('onboarding-choice')).toHaveCount(0)
  await expect(page.getByTestId('today-brief')).toBeVisible()

  const navigation = page.getByRole('navigation', { name: 'Sundesk navigation' })

  await navigation.getByRole('link', { name: 'Sundesk Lab' }).click()
  await expect(page.getByTestId('sundesk-lab-screen')).toBeVisible()
  await expect(page.getByTestId('lab-module-list')).toBeVisible()
  await expect(page.getByTestId('lab-module-list').getByRole('button', { name: /Start with the map/ })).toBeVisible()

  await navigation.getByRole('link', { name: 'Settings' }).click()
  await expect(page.getByTestId('settings-screen')).toBeVisible()
  await expect(page.getByTestId('onboarding-choice')).toBeVisible()
  await page.getByRole('button', { name: 'Start on my own' }).click()
  await expect(page.getByTestId('onboarding-choice')).toHaveCount(0)
  await page.getByLabel('Search Help').fill('iPhone')
  await expect(page.getByLabel('Help results')).toContainText('Use Sundesk on iPhone')
  await page.locator('.rupaul-toggle').click()
  await expect(page.getByLabel('RuPaul Mode')).toBeChecked()
  await expect(page.getByText('Long hover still shows the plain version')).toBeVisible()

  await navigation.getByRole('link', { name: 'Meetings' }).click()
  await expect(page.getByTestId('meeting-weekly-note').getByRole('button', { name: 'Copy note' }).first()).toContainText('Receipts in heels')
  await expect(page.getByTestId('meeting-weekly-note').getByRole('button', { name: 'Copy note' }).first()).toHaveAttribute('data-copy-plain', 'Copy note')
  await expect(page.getByTestId('meeting-weekly-note').getByRole('button', { name: 'Export PDF' }).first()).toBeVisible()
  await expect(page.getByTestId('meeting-weekly-note').getByRole('button', { name: 'Export PDF' }).first()).toContainText('Make it runway-ready')
  await expect(page.getByTestId('meeting-weekly-note').getByRole('button', { name: 'Export PDF' }).first()).toHaveAttribute('title', 'Export PDF')
})
