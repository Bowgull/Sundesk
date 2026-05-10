export const educationStateStorageKey = 'sundesk-education-state-v1'

export type EducationProgressStatus = 'notStarted' | 'inProgress' | 'completed'
export type OnboardingStatus = EducationProgressStatus | 'dismissed'

export type SundeskEducationProgress = {
  status: EducationProgressStatus
  currentStepId: string | null
  completedStepIds: string[]
  completedActionIds: string[]
  startedAt: string | null
  completedAt: string | null
  lastSeenAt: string | null
}

export interface SundeskEducationState {
  version: 1
  onboarding: {
    status: OnboardingStatus
    currentStepId: string | null
    completedStepIds: string[]
    completedActionIds: string[]
    startedAt: string | null
    completedAt: string | null
    lastSeenAt: string | null
  }
  lab: {
    activeModuleId: string | null
    sampleWorkspaceVersion: 1
    sampleWorkspaceResetAt: string | null
    modules: Record<string, SundeskEducationProgress>
  }
  help: {
    recentQueries: string[]
    dismissedCardIds: string[]
    lastArticleId: string | null
  }
  copyMode: {
    rupaulMode: boolean
    updatedAt: string | null
  }
  meetingPdf: {
    templateVersion: 1
    lastExportedMeetingId: string | null
  }
}

export type NormalizedSundeskEducationState = {
  educationState: SundeskEducationState
  usedFallback: boolean
}

export function getDefaultSundeskEducationState(): SundeskEducationState {
  return {
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
  }
}

export function normalizeSundeskEducationState(value: unknown): NormalizedSundeskEducationState {
  if (!isRecord(value) || value.version !== 1) {
    return { educationState: getDefaultSundeskEducationState(), usedFallback: true }
  }

  const defaults = getDefaultSundeskEducationState()

  return {
    educationState: {
      version: 1,
      onboarding: normalizeOnboardingState(value.onboarding, defaults.onboarding),
      lab: normalizeLabState(value.lab),
      help: normalizeHelpState(value.help, defaults.help),
      copyMode: normalizeCopyModeState(value.copyMode, defaults.copyMode),
      meetingPdf: normalizeMeetingPdfState(value.meetingPdf, defaults.meetingPdf),
    },
    usedFallback: false,
  }
}

export function readSundeskEducationState(): SundeskEducationState {
  if (typeof window === 'undefined') {
    return getDefaultSundeskEducationState()
  }

  try {
    const rawState = window.localStorage.getItem(educationStateStorageKey)

    if (!rawState) {
      return getDefaultSundeskEducationState()
    }

    return normalizeSundeskEducationState(JSON.parse(rawState) as unknown).educationState
  } catch {
    return getDefaultSundeskEducationState()
  }
}

export function writeSundeskEducationState(value: unknown): SundeskEducationState {
  const educationState = normalizeSundeskEducationState(value).educationState

  if (typeof window === 'undefined') {
    return educationState
  }

  try {
    window.localStorage.setItem(educationStateStorageKey, JSON.stringify(educationState))
  } catch {
    return educationState
  }

  return educationState
}

function normalizeOnboardingState(
  value: unknown,
  defaults: SundeskEducationState['onboarding'],
): SundeskEducationState['onboarding'] {
  const state = isRecord(value) ? value : {}

  return {
    status: normalizeOnboardingStatus(state.status, defaults.status),
    currentStepId: normalizeNullableString(state.currentStepId),
    completedStepIds: normalizeStringArray(state.completedStepIds),
    completedActionIds: normalizeStringArray(state.completedActionIds),
    startedAt: normalizeNullableString(state.startedAt),
    completedAt: normalizeNullableString(state.completedAt),
    lastSeenAt: normalizeNullableString(state.lastSeenAt),
  }
}

function normalizeLabState(
  value: unknown,
): SundeskEducationState['lab'] {
  const state = isRecord(value) ? value : {}

  return {
    activeModuleId: normalizeNullableString(state.activeModuleId),
    sampleWorkspaceVersion: 1,
    sampleWorkspaceResetAt: normalizeNullableString(state.sampleWorkspaceResetAt),
    modules: normalizeLabModules(state.modules),
  }
}

function normalizeHelpState(
  value: unknown,
  defaults: SundeskEducationState['help'],
): SundeskEducationState['help'] {
  const state = isRecord(value) ? value : {}

  return {
    recentQueries: normalizeStringArray(state.recentQueries),
    dismissedCardIds: normalizeStringArray(state.dismissedCardIds),
    lastArticleId: normalizeNullableString(state.lastArticleId) || defaults.lastArticleId,
  }
}

function normalizeCopyModeState(
  value: unknown,
  defaults: SundeskEducationState['copyMode'],
): SundeskEducationState['copyMode'] {
  const state = isRecord(value) ? value : {}

  return {
    rupaulMode: typeof state.rupaulMode === 'boolean' ? state.rupaulMode : defaults.rupaulMode,
    updatedAt: normalizeNullableString(state.updatedAt),
  }
}

function normalizeMeetingPdfState(
  value: unknown,
  defaults: SundeskEducationState['meetingPdf'],
): SundeskEducationState['meetingPdf'] {
  const state = isRecord(value) ? value : {}

  return {
    templateVersion: 1,
    lastExportedMeetingId: normalizeNullableString(state.lastExportedMeetingId) || defaults.lastExportedMeetingId,
  }
}

function normalizeLabModules(value: unknown): Record<string, SundeskEducationProgress> {
  if (!isRecord(value)) {
    return {}
  }

  const modules: Record<string, SundeskEducationProgress> = {}

  Object.entries(value).forEach(([moduleId, moduleState]) => {
    if (typeof moduleId === 'string' && isRecord(moduleState)) {
      modules[moduleId] = normalizeEducationProgress(moduleState)
    }
  })

  return modules
}

function normalizeEducationProgress(value: Record<string, unknown>): SundeskEducationProgress {
  return {
    status: normalizeProgressStatus(value.status, 'notStarted'),
    currentStepId: normalizeNullableString(value.currentStepId),
    completedStepIds: normalizeStringArray(value.completedStepIds),
    completedActionIds: normalizeStringArray(value.completedActionIds),
    startedAt: normalizeNullableString(value.startedAt),
    completedAt: normalizeNullableString(value.completedAt),
    lastSeenAt: normalizeNullableString(value.lastSeenAt),
  }
}

function normalizeOnboardingStatus(value: unknown, fallback: OnboardingStatus): OnboardingStatus {
  return value === 'notStarted' || value === 'inProgress' || value === 'completed' || value === 'dismissed'
    ? value
    : fallback
}

function normalizeProgressStatus(value: unknown, fallback: EducationProgressStatus): EducationProgressStatus {
  return value === 'notStarted' || value === 'inProgress' || value === 'completed'
    ? value
    : fallback
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
