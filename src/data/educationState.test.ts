import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  educationStateStorageKey,
  getDefaultSundeskEducationState,
  normalizeSundeskEducationState,
  readSundeskEducationState,
  writeSundeskEducationState,
} from './educationState'

function stubLocalStorage(initialValues: Record<string, string>) {
  const values = new Map(Object.entries(initialValues))

  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  })

  return values
}

describe('Sundesk education state helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates the default education state from the shared spec shape', () => {
    const state = getDefaultSundeskEducationState()

    expect(educationStateStorageKey).toBe('sundesk-education-state-v1')
    expect(state).toEqual({
      version: 1,
      onboarding: {
        status: 'notStarted',
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
    })
  })

  it('normalizes partial state while preserving safe known values', () => {
    const normalized = normalizeSundeskEducationState({
      version: 1,
      onboarding: {
        status: 'inProgress',
        currentStepId: 'build-nav',
        completedStepIds: ['welcome', 4, 'today'],
        completedActionIds: ['start-tour', false, 'open-today'],
        startedAt: '2026-05-10T12:00:00.000Z',
      },
      lab: {
        activeModuleId: 'meetings',
        sampleWorkspaceVersion: 2,
        modules: {
          meetings: {
            status: 'completed',
            currentStepId: 7,
            completedStepIds: ['intro'],
            completedActionIds: ['export-pdf', null],
            completedAt: '2026-05-10T12:10:00.000Z',
          },
          bad: 'not-a-module',
        },
      },
      help: {
        recentQueries: ['pdf', 9, 'linked records'],
        dismissedCardIds: ['welcome-card', undefined],
        lastArticleId: 'fields',
      },
      copyMode: {
        rupaulMode: true,
        updatedAt: '2026-05-10T12:20:00.000Z',
      },
      meetingPdf: {
        templateVersion: 9,
        lastExportedMeetingId: 'meeting_1',
      },
    })

    expect(normalized.usedFallback).toBe(false)
    expect(normalized.educationState).toMatchObject({
      onboarding: {
        status: 'inProgress',
        currentStepId: 'build-nav',
        completedStepIds: ['welcome', 'today'],
        completedActionIds: ['start-tour', 'open-today'],
        startedAt: '2026-05-10T12:00:00.000Z',
        completedAt: null,
      },
      lab: {
        activeModuleId: 'meetings',
        sampleWorkspaceVersion: 1,
        modules: {
          meetings: {
            status: 'completed',
            currentStepId: null,
            completedStepIds: ['intro'],
            completedActionIds: ['export-pdf'],
            completedAt: '2026-05-10T12:10:00.000Z',
          },
        },
      },
      help: {
        recentQueries: ['pdf', 'linked records'],
        dismissedCardIds: ['welcome-card'],
        lastArticleId: 'fields',
      },
      copyMode: {
        rupaulMode: true,
        updatedAt: '2026-05-10T12:20:00.000Z',
      },
      meetingPdf: {
        templateVersion: 1,
        lastExportedMeetingId: 'meeting_1',
      },
    })
  })

  it('falls back to defaults for malformed state', () => {
    expect(normalizeSundeskEducationState('bad-json-shape')).toEqual({
      educationState: getDefaultSundeskEducationState(),
      usedFallback: true,
    })
    expect(normalizeSundeskEducationState({ version: 2, onboarding: {} }).usedFallback).toBe(true)
  })

  it('round trips local persistence through the sanitized state', () => {
    const values = stubLocalStorage({})
    const saved = writeSundeskEducationState({
      version: 1,
      onboarding: {
        status: 'dismissed',
        completedStepIds: ['welcome', 1],
        lastSeenAt: '2026-05-10T12:30:00.000Z',
      },
      copyMode: {
        rupaulMode: true,
      },
      meetingPdf: {
        lastExportedMeetingId: 'meeting_halifax',
      },
    })

    expect(JSON.parse(values.get(educationStateStorageKey) || '')).toEqual(saved)
    expect(readSundeskEducationState()).toEqual(saved)
    expect(saved.onboarding.status).toBe('dismissed')
    expect(saved.onboarding.completedStepIds).toEqual(['welcome'])
    expect(saved.copyMode.rupaulMode).toBe(true)
    expect(saved.meetingPdf.lastExportedMeetingId).toBe('meeting_halifax')
  })

  it('loads defaults when local storage is missing or malformed', () => {
    stubLocalStorage({
      [educationStateStorageKey]: '{bad',
    })

    expect(readSundeskEducationState()).toEqual(getDefaultSundeskEducationState())
  })
})
