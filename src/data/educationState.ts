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

export type SundeskLabRecord = {
  id: string
  table: 'work' | 'communities' | 'meetings' | 'people'
  title: string
  status: string
  owner: string | null
  due: string | null
  tags: string[]
  communityId: string | null
  notes: string
  fake: true
}

export type SundeskLabSandboxState = {
  version: 1
  activeLessonId: string | null
  activeSurface: string
  sampleWorkspaceVersion: 3
  selectedView: string
  selectedFilterTag: string | null
  coachOpen: boolean
  inspectorOpen: boolean
  completedTaskIds: string[]
  generatedReceipts: Record<string, string>
  records: SundeskLabRecord[]
  updatedAt: string | null
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
    sampleWorkspaceVersion: 3
    sampleWorkspaceResetAt: string | null
    modules: Record<string, SundeskEducationProgress>
    sandbox: SundeskLabSandboxState
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
      sampleWorkspaceVersion: 3,
      sampleWorkspaceResetAt: null,
      modules: {},
      sandbox: {
        version: 1,
        activeLessonId: null,
        activeSurface: 'start',
        sampleWorkspaceVersion: 3,
        selectedView: 'grid',
        selectedFilterTag: null,
        coachOpen: true,
        inspectorOpen: true,
        completedTaskIds: [],
        generatedReceipts: {},
        records: getDefaultLabRecords(),
        updatedAt: null,
      },
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
  const activeModuleId = normalizeLabLessonId(state.activeModuleId)

  return {
    activeModuleId,
    sampleWorkspaceVersion: 3,
    sampleWorkspaceResetAt: normalizeNullableString(state.sampleWorkspaceResetAt),
    modules: normalizeLabModules(state.modules),
    sandbox: normalizeLabSandboxState(state.sandbox, activeModuleId),
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
    const normalizedModuleId = normalizeLabLessonId(moduleId)

    if (normalizedModuleId && isRecord(moduleState)) {
      modules[normalizedModuleId] = normalizeEducationProgress(moduleState)
    }
  })

  return modules
}

function normalizeLabSandboxState(value: unknown, activeModuleId: string | null): SundeskLabSandboxState {
  const state = isRecord(value) ? value : {}

  return {
    version: 1,
    activeLessonId: normalizeLabLessonId(state.activeLessonId) || activeModuleId,
    activeSurface: normalizeNullableString(state.activeSurface) || 'start',
    sampleWorkspaceVersion: 3,
    selectedView: normalizeNullableString(state.selectedView) || 'grid',
    selectedFilterTag: normalizeNullableString(state.selectedFilterTag),
    coachOpen: typeof state.coachOpen === 'boolean' ? state.coachOpen : true,
    inspectorOpen: typeof state.inspectorOpen === 'boolean' ? state.inspectorOpen : true,
    completedTaskIds: normalizeStringArray(state.completedTaskIds),
    generatedReceipts: normalizeStringRecord(state.generatedReceipts),
    records: state.sampleWorkspaceVersion === 3 ? normalizeLabRecords(state.records) : getDefaultLabRecords(),
    updatedAt: normalizeNullableString(state.updatedAt),
  }
}

function normalizeLabRecords(value: unknown): SundeskLabRecord[] {
  if (!Array.isArray(value)) {
    return getDefaultLabRecords()
  }

  const records = value
    .filter(isRecord)
    .filter((record) => record.fake === true)
    .map((record): SundeskLabRecord => ({
      id: normalizeNullableString(record.id) || 'lab-record',
      table: normalizeLabTable(record.table),
      title: normalizeNullableString(record.title) || 'Untitled practice row',
      status: normalizeNullableString(record.status) || 'Open',
      owner: normalizeNullableString(record.owner),
      due: normalizeNullableString(record.due),
      tags: normalizeStringArray(record.tags),
      communityId: normalizeNullableString(record.communityId),
      notes: normalizeNullableString(record.notes) || '',
      fake: true,
    }))

  return records.length ? records : getDefaultLabRecords()
}

function getDefaultLabRecords(): SundeskLabRecord[] {
  return [
    {
      id: 'gta-permit-risk',
      table: 'work',
      title: 'Kensington permit follow-up',
      status: 'Blocked',
      owner: 'Operations',
      due: '2026-06-11',
      tags: ['Permit risk'],
      communityId: 'gta-kensington-market',
      notes: 'Permit status needs a visible owner before the weekly readiness meeting.',
      fake: true,
    },
    {
      id: 'gta-vendor-cois',
      table: 'work',
      title: 'Vendor COI replies',
      status: 'Waiting',
      owner: 'Vendor lead',
      due: '2026-06-12',
      tags: ['COI', 'Waiting'],
      communityId: 'gta-danforth-night-market',
      notes: 'Two vendor certificates are still missing.',
      fake: true,
    },
    {
      id: 'gta-site-map',
      table: 'work',
      title: 'Site map cleanup',
      status: 'In progress',
      owner: 'Site lead',
      due: '2026-06-13',
      tags: ['Site map'],
      communityId: 'gta-scarborough-popup',
      notes: 'Vendor row spacing needs one final pass.',
      fake: true,
    },
    {
      id: 'gta-sponsor-deck',
      table: 'work',
      title: 'Sponsor deck review',
      status: 'Open',
      owner: 'Partnerships',
      due: '2026-06-14',
      tags: ['Sponsor'],
      communityId: 'gta-liberty-village',
      notes: 'Deck needs the latest booth package and logo row.',
      fake: true,
    },
    {
      id: 'gta-weekly-meeting',
      table: 'meetings',
      title: 'Weekly event readiness',
      status: 'Draft',
      owner: 'Lindsay',
      due: '2026-06-10',
      tags: ['Meeting prep'],
      communityId: 'gta-kensington-market',
      notes: 'Prep from blocked work, waiting work, and readiness notes.',
      fake: true,
    },
  ]
}

function normalizeStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] =>
      typeof entry[0] === 'string' && typeof entry[1] === 'string',
    ),
  )
}

function normalizeLabTable(value: unknown): SundeskLabRecord['table'] {
  return value === 'work' || value === 'communities' || value === 'meetings' || value === 'people'
    ? value
    : 'work'
}

function normalizeLabLessonId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const aliases: Record<string, string> = {
    'slide-01-start-here': 'start',
    'slide-02-product-map': 'start',
    'slide-03-blank-grid': 'build-grid',
    'slide-04-after-paste': 'build-grid',
    'slide-05-fields': 'fields',
    'slide-06-tags': 'tags',
    'slide-07-links': 'links',
    'slide-08-communities': 'communities',
    'slide-09-today': 'today-waiting',
    'slide-10-waiting-on': 'today-waiting',
    'slide-11-meetings': 'meetings',
    'slide-12-timeline-views': 'timeline',
    'slide-13-kanban': 'timeline',
    'slide-14-calendar': 'timeline',
    'slide-15-readiness-timeline': 'timeline',
    'slide-16-risk-graph': 'timeline',
    'slide-17-freeform-build': 'build-grid',
    'slide-18-context-helpers': 'fields',
    'slide-19-data-access': 'data-routine',
    'slide-20-routine': 'data-routine',
  }

  return aliases[value] || value
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
