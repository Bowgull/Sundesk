import { describe, expect, it } from 'vitest'
import {
  advanceOnboarding,
  dismissOnboarding,
  getOnboardingStep,
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
})
