import { expect, type Page, test } from '@playwright/test'

async function openTimeline(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear()
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
  })

  await page.goto('/')
  await page.getByRole('link', { name: 'Timeline' }).click()
  await expect(page.getByTestId('timeline-screen')).toBeVisible()
}

test('Timeline renders the 5 polished command views', async ({ page }) => {
  await openTimeline(page)

  const views = [
    ['Grid', 'timeline-list', 'Clean read.'],
    ['Kanban', 'timeline-kanban', 'Move stuck work.'],
    ['Calendar', 'timeline-calendar', 'Date pressure.'],
    ['Timeline', 'timeline-readiness', 'Readiness before event day.'],
    ['Graph', 'timeline-graph', 'Why this place is at risk.'],
  ] as const

  for (const [label, testId, heading] of views) {
    await page.getByRole('tab', { name: label }).click()
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await expect(page.getByTestId(testId)).toBeVisible()
  }
})

test('Timeline graph edge endpoints land inside visible node boxes', async ({ page }) => {
  await openTimeline(page)
  await page.getByRole('tab', { name: 'Graph' }).click()
  await expect(page.getByTestId('timeline-graph')).toBeVisible()

  const graphCheck = await page.evaluate(() => {
    const canvas = document.querySelector('.risk-graph-canvas')

    if (!canvas) {
      return { ok: false, edges: [] }
    }

    const canvasRect = canvas.getBoundingClientRect()
    const containsPoint = (node: Element | null, x: number, y: number) => {
      if (!node) {
        return false
      }

      const rect = node.getBoundingClientRect()
      const pageX = x + canvasRect.left
      const pageY = y + canvasRect.top

      return pageX >= rect.left && pageX <= rect.right && pageY >= rect.top && pageY <= rect.bottom
    }

    const edges = Array.from(document.querySelectorAll('.risk-graph-lines line')).map((line) => {
      const fromId = line.getAttribute('data-from-id') || ''
      const toId = line.getAttribute('data-to-id') || ''
      const from = document.querySelector(`[data-graph-node-id="${CSS.escape(fromId)}"]`)
      const to = document.querySelector(`[data-graph-node-id="${CSS.escape(toId)}"]`)
      const x1 = Number(line.getAttribute('x1'))
      const y1 = Number(line.getAttribute('y1'))
      const x2 = Number(line.getAttribute('x2'))
      const y2 = Number(line.getAttribute('y2'))

      return {
        fromOk: containsPoint(from, x1, y1),
        toOk: containsPoint(to, x2, y2),
      }
    })

    return {
      edges,
      ok: edges.length > 0 && edges.every((edge) => edge.fromOk && edge.toOk),
    }
  })

  expect(graphCheck.ok).toBe(true)
})

test('Timeline Gantt uses a readable mobile stack without horizontal overflow', async ({ browser }) => {
  const page = await browser.newPage({
    isMobile: true,
    viewport: { width: 390, height: 900 },
  })

  await openTimeline(page)
  await page.getByRole('tab', { name: 'Timeline' }).click()
  await expect(page.getByTestId('timeline-readiness')).toBeVisible()

  const mobileCheck = await page.evaluate(() => {
    const mobileBoard = document.querySelector('.gantt-mobile-board')
    const desktopBoard = document.querySelector('.gantt-board')
    const viewportWidth = document.documentElement.clientWidth
    const overflowing = Array.from(document.querySelectorAll('.timeline-screen-layout *')).filter((element) => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)

      return rect.right > viewportWidth + 2 && style.display !== 'none' && style.position !== 'fixed'
    })

    return {
      desktopHidden: desktopBoard ? getComputedStyle(desktopBoard).display === 'none' : false,
      mobileVisible: mobileBoard ? getComputedStyle(mobileBoard).display !== 'none' : false,
      overflowingCount: overflowing.length,
    }
  })

  expect(mobileCheck).toEqual({
    desktopHidden: true,
    mobileVisible: true,
    overflowingCount: 0,
  })

  await page.close()
})

test('Timeline mobile views stay inside the viewport', async ({ browser }) => {
  const views = [
    ['Grid', 'timeline-list'],
    ['Kanban', 'timeline-kanban'],
    ['Calendar', 'timeline-calendar'],
    ['Timeline', 'timeline-readiness'],
    ['Graph', 'timeline-graph'],
  ] as const

  for (const [label, testId] of views) {
    const page = await browser.newPage({
      isMobile: true,
      viewport: { width: 390, height: 900 },
    })

    await openTimeline(page)
    await page.getByRole('tab', { name: label }).click()
    await expect(page.getByTestId(testId)).toBeVisible()

    const overflowingCount = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth

      return Array.from(document.querySelectorAll('.timeline-screen-layout *')).filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)

        return rect.right > viewportWidth + 2 && style.display !== 'none' && style.position !== 'fixed'
      }).length
    })

    expect(overflowingCount).toBe(0)
    await page.close()
  }
})

test('Timeline cards, bars, dates, and graph nodes open the record drawer', async ({ browser }) => {
  const entries = [
    ['Grid', (page: Page) => page.getByTestId('timeline-row-task_permit_toronto'), 'Send permit follow-up.'],
    ['Kanban', (page: Page) => page.locator('.kanban-card', { hasText: 'Send permit follow-up.' }).getByRole('button').first(), 'Send permit follow-up.'],
    ['Calendar', (page: Page) => page.getByRole('button', { name: /Deadline\. Send permit follow-up\./ }), 'Send permit follow-up.'],
    ['Timeline', (page: Page) => page.locator('.gantt-bar', { hasText: 'Send permit follow-up.' }), 'Send permit follow-up.'],
    ['Graph', (page: Page) => page.locator('[data-graph-node-id="task_permit_toronto"]'), 'Send permit follow-up.'],
  ] as const

  for (const [view, getTarget, expectedTitle] of entries) {
    const page = await browser.newPage()

    await openTimeline(page)
    await page.getByRole('tab', { name: view }).click()
    await getTarget(page).click()
    await expect(page.getByTestId('record-drawer')).toContainText(expectedTitle)
    await page.close()
  }
})

test('Timeline Kanban movement updates the card lane and persisted status', async ({ page }) => {
  await openTimeline(page)
  await page.getByRole('tab', { name: 'Kanban' }).click()

  const blockedLane = page.getByRole('region', { name: 'Blocked lane' })
  const waitingLane = page.getByRole('region', { name: 'Waiting lane' })

  await expect(blockedLane).toContainText('Send permit follow-up.')
  await blockedLane.locator('.kanban-card', { hasText: 'Send permit follow-up.' }).locator('.kanban-card-action').click()
  await expect(page.getByRole('status')).toContainText('Send permit follow-up. moved to Waiting.')
  await expect(waitingLane).toContainText('Send permit follow-up.')
  await expect(blockedLane).not.toContainText('Send permit follow-up.')

  const storedStatus = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('sundesk-local-workbase-v1') || '{}') as {
      base?: { records?: Array<{ id: string, values?: Record<string, unknown> }> }
    }

    return stored.base?.records?.find((record) => record.id === 'task_permit_toronto')?.values?.status
  })

  expect(storedStatus).toBe('Waiting')
})
