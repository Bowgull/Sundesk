import { describe, expect, it } from 'vitest'
import { getDefaultSundeskEducationState } from './educationState'
import {
  completeSundeskLabModuleStep,
  getSundeskLabCurrentStep,
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
    expect(sundeskLabModules[0].steps[0]).toMatchObject({
      id: 'first-look-today',
      title: 'Open Today',
      actionId: 'view-today',
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
      currentStepId: 'tags-open-cell',
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

  it('returns the current step for the module progress', () => {
    const started = startSundeskLabModule(getDefaultSundeskEducationState(), 'tags', '2026-05-10T18:00:00.000Z')
    const currentStep = getSundeskLabCurrentStep(sundeskLabModules, 'tags', started.lab.modules.tags)

    expect(currentStep).toMatchObject({
      id: 'tags-open-cell',
      title: 'Open a tag cell',
      actionId: 'open-tag-cell',
      scenario: expect.stringContaining('Scarborough'),
    })
  })

  it('marks a step done and moves to the next module step', () => {
    const started = startSundeskLabModule(getDefaultSundeskEducationState(), 'tags', '2026-05-10T18:00:00.000Z')
    const advanced = completeSundeskLabModuleStep(started, sundeskLabModules, 'tags', '2026-05-10T18:03:00.000Z')

    expect(advanced.lab.modules.tags).toMatchObject({
      status: 'inProgress',
      currentStepId: 'tags-add-two',
      completedStepIds: ['tags-open-cell'],
      completedActionIds: ['open-tag-cell'],
      completedAt: null,
      lastSeenAt: '2026-05-10T18:03:00.000Z',
    })
  })

  it('marks the module completed when the last step is done', () => {
    const started = startSundeskLabModule(getDefaultSundeskEducationState(), 'tags', '2026-05-10T18:00:00.000Z')
    const stepOne = completeSundeskLabModuleStep(started, sundeskLabModules, 'tags', '2026-05-10T18:01:00.000Z')
    const stepTwo = completeSundeskLabModuleStep(stepOne, sundeskLabModules, 'tags', '2026-05-10T18:02:00.000Z')
    const completed = completeSundeskLabModuleStep(stepTwo, sundeskLabModules, 'tags', '2026-05-10T18:03:00.000Z')

    expect(completed.lab.modules.tags).toMatchObject({
      status: 'completed',
      currentStepId: null,
      completedStepIds: ['tags-open-cell', 'tags-add-two', 'tags-filter'],
      completedActionIds: ['open-tag-cell', 'add-two-tags', 'filter-by-tag'],
      completedAt: '2026-05-10T18:03:00.000Z',
      lastSeenAt: '2026-05-10T18:03:00.000Z',
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
