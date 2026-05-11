import { describe, expect, it } from 'vitest'
import { getDefaultSundeskEducationState, normalizeSundeskEducationState } from './educationState'
import {
  applySundeskLabAction,
  canCompleteSundeskLabLesson,
  completeSundeskLabModuleStep,
  getSundeskLabCurrentStep,
  resetSundeskLabModuleProgress,
  resetSundeskLabProgress,
  startSundeskLabModule,
  sundeskLabModules,
} from './sundeskLab'

describe('Sundesk Lab sync-ready sandbox', () => {
  it('defines the working Lab lessons instead of slide-only modules', () => {
    expect(sundeskLabModules.map((module) => module.id)).toEqual([
      'start',
      'build-grid',
      'fields',
      'tags',
      'links',
      'communities',
      'today-waiting',
      'meetings',
      'timeline',
      'data-routine',
    ])
    expect(sundeskLabModules.every((module) => module.steps.length >= 2)).toBe(true)
    expect(sundeskLabModules.every((module) => module.scenarioBrief.includes('Fyre'))).toBe(true)
    expect(sundeskLabModules.some((module) => module.sampleData.includes('Toronto'))).toBe(false)
  })

  it('starts a lesson with Firestore-compatible sandbox state', () => {
    const started = startSundeskLabModule(getDefaultSundeskEducationState(), 'tags', '2026-05-10T18:00:00.000Z')

    expect(started.lab.activeModuleId).toBe('tags')
    expect(started.lab.sandbox).toMatchObject({
      version: 1,
      activeLessonId: 'tags',
      activeSurface: 'tags',
      selectedFilterTag: null,
      selectedView: 'grid',
      coachOpen: true,
      inspectorOpen: true,
      sampleWorkspaceVersion: 2,
      updatedAt: '2026-05-10T18:00:00.000Z',
    })
    expect(started.lab.sandbox.records.length).toBeGreaterThan(4)
    expect(started.lab.sandbox.records.every((record) => record.fake === true)).toBe(true)
    expect(JSON.parse(JSON.stringify(started.lab.sandbox))).toEqual(started.lab.sandbox)
  })

  it('applies sandbox actions and only completes after required checks pass', () => {
    const started = startSundeskLabModule(getDefaultSundeskEducationState(), 'tags', '2026-05-10T18:00:00.000Z')

    expect(canCompleteSundeskLabLesson(started, sundeskLabModules, 'tags')).toBe(false)

    const tagged = applySundeskLabAction(started, sundeskLabModules, 'tags', 'tag-risk-row', '2026-05-10T18:01:00.000Z')
    const filtered = applySundeskLabAction(tagged, sundeskLabModules, 'tags', 'filter-risk-tag', '2026-05-10T18:02:00.000Z')

    expect(filtered.lab.sandbox.selectedFilterTag).toBe('Permit risk')
    expect(filtered.lab.sandbox.completedTaskIds).toEqual(['tag-risk-row', 'filter-risk-tag'])
    expect(filtered.lab.sandbox.generatedReceipts.tags).toContain('Permit risk route visible.')
    expect(canCompleteSundeskLabLesson(filtered, sundeskLabModules, 'tags')).toBe(true)

    const completed = completeSundeskLabModuleStep(filtered, sundeskLabModules, 'tags', '2026-05-10T18:03:00.000Z')

    expect(completed.lab.modules.tags).toMatchObject({
      status: 'completed',
      currentStepId: null,
      completedActionIds: ['tag-risk-row', 'filter-risk-tag'],
      completedStepIds: ['tags-tag-risk-row', 'tags-filter-risk-tag'],
      completedAt: '2026-05-10T18:03:00.000Z',
    })
  })

  it('keeps manual completion blocked when lesson checks are missing', () => {
    const started = startSundeskLabModule(getDefaultSundeskEducationState(), 'links', '2026-05-10T18:00:00.000Z')
    const completed = completeSundeskLabModuleStep(started, sundeskLabModules, 'links', '2026-05-10T18:03:00.000Z')

    expect(completed.lab.modules.links.status).toBe('inProgress')
    expect(completed.lab.modules.links.completedStepIds).toEqual([])
  })

  it('normalizes sync-ready Lab state across persisted snapshots', () => {
    const normalized = normalizeSundeskEducationState({
      version: 1,
      lab: {
        activeModuleId: 'slide-06-tags',
        sampleWorkspaceVersion: 99,
        sampleWorkspaceResetAt: '2026-05-10T17:00:00.000Z',
        modules: {
          tags: {
            status: 'inProgress',
            currentStepId: 'tags-tag-risk-row',
            completedStepIds: ['tags-intro', 1],
            completedActionIds: ['tag-risk-row', false],
          },
        },
        sandbox: {
          version: 4,
          activeLessonId: 'slide-06-tags',
          selectedView: 'calendar',
          selectedFilterTag: 'Permit risk',
          completedTaskIds: ['tag-risk-row', null],
          generatedReceipts: { tags: 'Permit risk route visible.', bad: 7 },
          updatedAt: '2026-05-10T18:00:00.000Z',
          records: [
            {
              id: 'fyre-permit',
              table: 'work',
              title: 'Permit risk memo',
              status: 'Blocked',
              tags: ['Permit risk', 4],
              fake: true,
            },
            { id: 'bad-real', title: 'Bad', fake: false },
          ],
        },
      },
    })

    expect(normalized.educationState.lab.activeModuleId).toBe('tags')
    expect(normalized.educationState.lab.sandbox).toMatchObject({
      version: 1,
      activeLessonId: 'tags',
      selectedView: 'calendar',
      selectedFilterTag: 'Permit risk',
      completedTaskIds: ['tag-risk-row'],
      generatedReceipts: { tags: 'Permit risk route visible.' },
      updatedAt: '2026-05-10T18:00:00.000Z',
    })
    expect(normalized.educationState.lab.sandbox.records).toEqual([
      expect.objectContaining({
        id: 'fyre-permit',
        table: 'work',
        title: 'Permit risk memo',
        tags: ['Permit risk'],
        fake: true,
      }),
    ])
  })

  it('resets one lesson or all Lab progress without touching non-Lab state', () => {
    const started = startSundeskLabModule(getDefaultSundeskEducationState(), 'meetings', '2026-05-10T18:00:00.000Z')
    const withTimeline = startSundeskLabModule(started, 'timeline', '2026-05-10T18:01:00.000Z')
    const resetOne = resetSundeskLabModuleProgress(withTimeline, 'meetings', '2026-05-10T18:02:00.000Z')

    expect(resetOne.lab.modules.meetings).toBeUndefined()
    expect(resetOne.lab.modules.timeline?.status).toBe('inProgress')
    expect(resetOne.lab.sandbox.activeLessonId).toBe('timeline')

    const resetAll = resetSundeskLabProgress(resetOne, '2026-05-10T18:03:00.000Z')

    expect(resetAll.lab.modules).toEqual({})
    expect(resetAll.lab.activeModuleId).toBeNull()
    expect(resetAll.lab.sampleWorkspaceResetAt).toBe('2026-05-10T18:03:00.000Z')
    expect(resetAll.lab.sandbox.records.every((record) => record.fake)).toBe(true)
    expect(resetAll.onboarding).toEqual(withTimeline.onboarding)
  })

  it('keeps legacy help routes working for the new lesson ids', () => {
    const started = startSundeskLabModule(getDefaultSundeskEducationState(), 'slide-06-tags', '2026-05-10T18:00:00.000Z')
    const currentStep = getSundeskLabCurrentStep(sundeskLabModules, 'slide-06-tags', started.lab.modules.tags)

    expect(started.lab.activeModuleId).toBe('tags')
    expect(currentStep).toMatchObject({
      id: 'tags-tag-risk-row',
      actionId: 'tag-risk-row',
    })
  })
})
