import { describe, expect, it } from 'vitest'
import { getDefaultSundeskEducationState } from './educationState'
import {
  resetSundeskLabModuleProgress,
  resetSundeskLabProgress,
  startSundeskLabModule,
  sundeskLabModules,
} from './sundeskLab'

describe('Sundesk Lab module state', () => {
  it('defines the GTA-style Lab modules from the build-ready spec', () => {
    expect(sundeskLabModules.map((module) => module.id)).toEqual([
      'first-look',
      'tables',
      'records',
      'fields',
      'tags',
      'links',
      'views',
      'today',
      'meetings',
      'timeline',
      'safety',
      'iphone',
    ])
    expect(sundeskLabModules[0]).toMatchObject({
      title: 'First look',
      teaches: 'Today, Build, Meetings, Lab',
      requiredPractice: 'Navigate each surface',
    })
    expect(sundeskLabModules.some((module) => module.sampleData.includes('Scarborough'))).toBe(true)
  })

  it('starts a module without changing other education state slices', () => {
    const educationState = getDefaultSundeskEducationState()
    const started = startSundeskLabModule(educationState, 'tags', '2026-05-10T18:00:00.000Z')

    expect(started).not.toBe(educationState)
    expect(started.lab.activeModuleId).toBe('tags')
    expect(started.lab.modules.tags).toEqual({
      status: 'inProgress',
      currentStepId: 'tags-start',
      completedStepIds: [],
      completedActionIds: [],
      startedAt: '2026-05-10T18:00:00.000Z',
      completedAt: null,
      lastSeenAt: '2026-05-10T18:00:00.000Z',
    })
    expect(started.onboarding).toEqual(educationState.onboarding)
    expect(started.copyMode).toEqual(educationState.copyMode)
  })

  it('resumes a module without discarding existing progress', () => {
    const started = startSundeskLabModule(getDefaultSundeskEducationState(), 'links', '2026-05-10T18:00:00.000Z')
    const updated = {
      ...started,
      lab: {
        ...started.lab,
        modules: {
          ...started.lab.modules,
          links: {
            ...started.lab.modules.links,
            currentStepId: 'links-review',
            completedStepIds: ['links-start'],
            completedActionIds: ['open-link-picker'],
          },
        },
      },
    }
    const resumed = startSundeskLabModule(updated, 'links', '2026-05-10T18:05:00.000Z')

    expect(resumed.lab.modules.links).toMatchObject({
      status: 'inProgress',
      currentStepId: 'links-review',
      completedStepIds: ['links-start'],
      completedActionIds: ['open-link-picker'],
      startedAt: '2026-05-10T18:00:00.000Z',
      lastSeenAt: '2026-05-10T18:05:00.000Z',
    })
  })

  it('resets one module or all Lab progress without touching non-Lab state', () => {
    const started = startSundeskLabModule(getDefaultSundeskEducationState(), 'meetings', '2026-05-10T18:00:00.000Z')
    const withSecondModule = startSundeskLabModule(started, 'timeline', '2026-05-10T18:01:00.000Z')
    const resetOne = resetSundeskLabModuleProgress(withSecondModule, 'meetings')

    expect(resetOne.lab.modules.meetings).toBeUndefined()
    expect(resetOne.lab.modules.timeline?.status).toBe('inProgress')
    expect(resetOne.lab.activeModuleId).toBe('timeline')

    const resetAll = resetSundeskLabProgress(resetOne, '2026-05-10T18:02:00.000Z')

    expect(resetAll.lab).toEqual({
      activeModuleId: null,
      sampleWorkspaceVersion: 1,
      sampleWorkspaceResetAt: '2026-05-10T18:02:00.000Z',
      modules: {},
    })
    expect(resetAll.onboarding).toEqual(withSecondModule.onboarding)
  })
})
