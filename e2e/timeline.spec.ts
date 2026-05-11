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
