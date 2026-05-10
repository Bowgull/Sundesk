import { describe, expect, it } from 'vitest'
import {
  advanceOnboarding,
  dismissOnboarding,
  getOnboardingStep,
  getOnboardingStepProgress,
  goBackOnboarding,
  restartOnboarding,
  startOnboarding,
} from './onboarding'
import {
  getDefaultSundeskEducationState,
} from './educationState'

describe('onboarding flow', () => {
  it('starts, advances exact steps, dismisses, and restarts from education state', () => {
    const initialState = getDefaultSundeskEducationState()
    const started = startOnboarding(initialState, '2026-05-10T17:00:00.000Z')

    expect(started.onboarding.status).toBe('inProgress')
    expect(started.onboarding.currentStepId).toBe('today')
    expect(started.onboarding.completedStepIds).toEqual(['welcome'])
    expect(started.onboarding.completedActionIds).toEqual(['start-tour'])

    const advanced = advanceOnboarding(started, 'today', 'view-today', '2026-05-10T17:01:00.000Z')

    expect(advanced.onboarding.currentStepId).toBe('build-nav')
    expect(advanced.onboarding.completedStepIds).toContain('today')
    expect(advanced.onboarding.completedActionIds).toContain('view-today')

    const ignored = advanceOnboarding(advanced, 'today', 'view-today-again', '2026-05-10T17:02:00.000Z')

    expect(ignored).toBe(advanced)

    const dismissed = dismissOnboarding(advanced, '2026-05-10T17:03:00.000Z')

    expect(dismissed.onboarding.status).toBe('dismissed')

    const restarted = restartOnboarding(dismissed, '2026-05-10T17:04:00.000Z')

    expect(restarted.onboarding.status).toBe('inProgress')
    expect(restarted.onboarding.currentStepId).toBe('today')
    expect(restarted.onboarding.completedStepIds).toEqual(['welcome'])
  })

  it('exposes the required target-click build nav step', () => {
    expect(getOnboardingStep('build-nav')).toMatchObject({
      id: 'build-nav',
      targetId: 'nav-build',
      requiredAction: 'targetClick',
      screen: 'build',
    })
  })

  it('reports progress and can move back to the previous step', () => {
    const initialState = getDefaultSundeskEducationState()
    const started = startOnboarding(initialState, '2026-05-10T17:00:00.000Z')
    const advanced = advanceOnboarding(started, 'today', 'view-today', '2026-05-10T17:01:00.000Z')
    const backedUp = goBackOnboarding(advanced, '2026-05-10T17:02:00.000Z')

    expect(getOnboardingStepProgress('build-nav')).toMatchObject({
      current: 2,
      total: expect.any(Number),
      label: expect.stringMatching(/^2 of \d+$/),
    })
    expect(backedUp.onboarding.currentStepId).toBe('today')
    expect(backedUp.onboarding.completedStepIds).not.toContain('today')
    expect(backedUp.onboarding.completedActionIds).not.toContain('view-today')
  })

  it('teaches every field type in the field-types step', () => {
    const fieldTypesStep = getOnboardingStep('field-types')

    expect(fieldTypesStep?.body).toContain('Text: Short labels, names, titles, and quick details.')
    expect(fieldTypesStep?.body).toContain('Long text: Notes, context, updates, and anything that needs room.')
    expect(fieldTypesStep?.body).toContain('Number: Counts, amounts, percentages, square footage, budget numbers, and scores.')
    expect(fieldTypesStep?.body).toContain('Date: Due dates, meetings, follow-ups, expiry dates, renewal dates, and timelines.')
    expect(fieldTypesStep?.body).toContain('Status: One current stage, like Not started, Waiting, In review, or Done.')
    expect(fieldTypesStep?.body).toContain('Checkbox: Yes or no tracking, like sent, approved, received, urgent, or needs follow-up.')
    expect(fieldTypesStep?.body).toContain('Tags: Multiple labels on one record, so a task can be Waiting, COI, Steph, and Friday all at once.')
    expect(fieldTypesStep?.body).toContain('Link: A connection to another table, like a task connected to a community, person, meeting, or document.')
    expect(fieldTypesStep?.body).toContain('Lookup: Information pulled from a linked record so she does not retype it.')
    expect(fieldTypesStep?.body).toContain('Rollup: A calculated summary from linked records, like count, total, earliest date, latest date, or open items.')
  })
})
