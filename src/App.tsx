import './App.css'
import './styles/themes.css'
import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { mainScreens, themes, type AppScreen, type ThemeId, type TimelineView } from './appConfig'
import { AuthGate } from './components/AuthGate'
import { BuildGrid } from './components/BuildGrid'
import { BuildGridCell } from './components/BuildGridCell'
import { BuildGridHeader } from './components/BuildGridHeader'
import { BuildModals } from './components/BuildModals'
import { BuildPasteHelper } from './components/BuildPasteHelper'
import { CommunitiesScreen } from './components/CommunitiesScreen'
import { MeetingPrepPanel } from './components/MeetingPrepPanel'
import { MeetingsScreen } from './components/MeetingsScreen'
import { OnboardingTour } from './components/OnboardingTour'
import { RecordFieldInput } from './components/RecordFieldInput'
import { RecordDrawer } from './components/RecordDrawer'
import { RecordModal } from './components/RecordModal'
import { SettingsScreen } from './components/SettingsScreen'
import { SundeskLabScreen } from './components/SundeskLabScreen'
import { TasksScreen } from './components/TasksScreen'
import { TimelineModes } from './components/TimelineModes'
import { TimelineScreen } from './components/TimelineScreen'
import { TodayScreen } from './components/TodayScreen'
import { WaitingOnScreen } from './components/WaitingOnScreen'
import {
  readSundeskEducationState,
  type SundeskEducationState,
  writeSundeskEducationState,
} from './data/educationState'
import { type CopyEntryId, getCopyModeText } from './data/copyMode'
import {
  coerceBuildPasteCellValue,
  getBuildPasteOptionUpdates,
  getBuildPasteOverflowColumns,
  parseBuildPasteRows,
} from './data/buildPaste'
import {
  buildMeetingAgendaPdfExport,
  buildMeetingNotePdfExport,
} from './data/meetingPdf'
import {
  advanceOnboarding,
  dismissOnboarding,
  getOnboardingStep,
  getOnboardingStepProgress,
  goBackOnboarding,
  restartOnboarding,
  startOnboarding,
} from './data/onboarding'
import {
  type DependencyRelationship,
  getDependencySummary as getDependencySummaryForBase,
  getUniqueDependencyId,
  hasDuplicateDependency,
} from './data/dependencies'
import { buildCommandSendPreview } from './data/commandSend'
import {
  compareFirestoreReadShadowCounts,
  createFirestoreReadShadowReader,
  getFirestoreReadShadowState,
  getFirestoreWriteGateState,
  loadFirestoreReadShadow,
  type FirestoreReadShadowState,
} from './data/firestoreReadShadow'
import {
  createFirestoreWorkspaceClient,
  createFirestoreWorkspaceSdkDocumentStore,
} from './data/firestoreWorkspaceClient'
import { getFirebaseLaunchReadinessSummary, getFirebaseSetupState } from './data/firebaseSetup'
import {
  getAllowedEmailsFromEnv,
  isSessionAllowed,
  signInWithGooglePopup,
  signOutOfFirebaseAuth,
  subscribeToFirebaseAuthState,
  type FirebaseAuthSession,
} from './data/firebaseAuth'
import {
  type LocalGridView,
  type StoredBuildViewState,
  type StoredMigrationReport,
  type StoredWorkbaseState,
  buildViewStateStorageKey,
  cloneWorkbase,
  computedFieldTypes,
  createSundeskLocalBackup,
  defaultVisibleFieldIdsByTable,
  getDefaultVisibleFieldIds,
  getEmptyFieldValue,
  getEmptyRecordValues,
  markLocalBackupRehearsed,
  normalizeSundeskLocalBackupImport,
  readLocalBackupRehearsed,
  readStoredBuildViewState,
  readStoredRules,
  readStoredWorkbase,
  rulesStorageKey,
  storedMigrationReport,
  workbaseStorageKey,
} from './data/localStorage'
import {
  completeSundeskLabModuleStep,
  applySundeskLabAction,
  resetSundeskLabModuleProgress,
  resetSundeskLabProgress,
  startSundeskLabModule,
  sundeskLabModules,
} from './data/sundeskLab'
import { getFirebaseServices, hasFirebaseConfig } from './lib/firebase'
import {
  type LocalRule,
  getFieldDisplayValue as getRecordFieldDisplayValue,
  getFirstDateValue,
  getNumberValue,
  getRulePreview as getRulePreviewForBase,
  getStringValue,
  ruleOperatorOptions,
  ruleOperatorNeedsValue,
  sortRecordsByDate,
} from './data/rules'
import {
  type BaseRecord,
  type CheckboxColor,
  type CheckboxIcon,
  type DependencyLink,
  type FieldDefinition,
  type FieldType,
  type RecordValue,
  getBacklinksForRecord,
  getDependencyReferencesForRecord,
  getLinkedRecordsForRecord,
  getLookupPreview,
  getMaterializedLinks,
  getRecord,
  getRecordContext,
  getRecordReferences,
  getRecordTitle,
  getRecordsForTable,
  workbase,
} from './data/workbase'
import {
  getBuildTableRows,
  getBuildGridDerivation,
  getDependencyPickerRecords,
  getLocalEngineStats,
  getMeetingAgendaText,
  getMeetingPrep,
  getMeetingWeeklyNoteText,
  getRuleDestinationStats,
  getRuleMatchesForDestination,
  getTimelineRecords,
  getTimelineSourceRecords,
  getTimelineStatusOptions,
  getTodayLanes,
  getWorkRecordGroups,
} from './data/views'

const fieldTypeOptions: { label: string; value: FieldType }[] = [
  { label: 'Text', value: 'text' },
  { label: 'Long text', value: 'longText' },
  { label: 'Status', value: 'status' },
  { label: 'Single select', value: 'singleSelect' },
  { label: 'Tags', value: 'multiSelect' },
  { label: 'Date', value: 'date' },
  { label: 'Date + time', value: 'dateTime' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Number', value: 'number' },
  { label: 'Price', value: 'currency' },
  { label: 'Percent', value: 'percent' },
  { label: 'Rating', value: 'rating' },
  { label: 'Phone', value: 'phone' },
  { label: 'URL', value: 'url' },
  { label: 'Connection', value: 'linkedRecord' },
  { label: 'Lookup', value: 'lookup' },
  { label: 'Rollup', value: 'rollup' },
  { label: 'Count', value: 'count' },
  { label: 'Sundesk note', value: 'systemFormula' },
  { label: 'Created time', value: 'createdTime' },
  { label: 'Last updated time', value: 'lastUpdatedTime' },
]

const fieldBehaviorOptions: { label: string; value: FieldType; description: string }[] = [
  { label: 'Write notes', value: 'longText', description: 'Open text for context, decisions, and internal notes.' },
  { label: 'Track status', value: 'status', description: 'A short workflow state that can surface work in Today.' },
  { label: 'Add tags', value: 'multiSelect', description: 'Reusable marks for grouping, routing, and filtering.' },
  { label: 'Set a date', value: 'date', description: 'A deadline or event date the command center can watch.' },
  { label: 'Connect work', value: 'linkedRecord', description: 'Connect this item to a community, person, meeting, or other area.' },
  { label: 'Reuse a detail', value: 'lookup', description: 'Show a connected detail without retyping it.' },
]

const optionFieldTypes: FieldType[] = ['status', 'singleSelect', 'multiSelect']
const optionColorClassNames = ['tag-blue', 'tag-green', 'tag-yellow', 'tag-red', 'tag-purple', 'tag-gray']
const checkboxIconOptions: { label: string; value: CheckboxIcon }[] = [
  { label: 'Check', value: 'check' },
  { label: 'Star', value: 'star' },
  { label: 'Heart', value: 'heart' },
  { label: 'Thumb', value: 'thumb' },
  { label: 'Flag', value: 'flag' },
]
const checkboxColorOptions: { label: string; value: CheckboxColor }[] = [
  { label: 'Lime', value: 'lime' },
  { label: 'Mint', value: 'mint' },
  { label: 'Cyan', value: 'cyan' },
  { label: 'Blue', value: 'blue' },
  { label: 'Violet', value: 'violet' },
  { label: 'Pink', value: 'pink' },
  { label: 'Rose', value: 'rose' },
  { label: 'Orange', value: 'orange' },
  { label: 'Gold', value: 'gold' },
  { label: 'Graphite', value: 'graphite' },
]
type BuildModal = '' | 'table' | 'tableSettings' | 'deleteTable' | 'field' | 'fieldSettings' | 'deleteField' | 'record' | 'resetLocalData'
type GridSortDirection = 'asc' | 'desc'
type GridDensity = 'compact' | 'comfortable' | 'expanded'
type GridCell = {
  recordId: string
  fieldId: string
}
type BuildPasteSummary = {
  rows: number
  cells: number
  created: number
  updated: number
  columns: string[]
  skippedColumns: string[]
  suggestions: string[]
  actions: BuildPasteAction[]
}
type BuildPasteAction = {
  fieldId: string
  label: string
  updates: Partial<FieldDefinition>
  migrateValues?: boolean
}

function getScreenFromHash(): AppScreen {
  if (typeof window === 'undefined') {
    return 'today'
  }

  const screenId = window.location.hash.replace('#', '')
  const screen = mainScreens.find((item) => item.id === screenId)

  return screen?.id || 'today'
}

function toSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return slug || 'local_item'
}

function getUniqueSlug(baseId: string, existingIds: string[]) {
  let uniqueId = baseId
  let suffix = 2

  while (existingIds.includes(uniqueId)) {
    uniqueId = `${baseId}_${suffix}`
    suffix += 1
  }

  return uniqueId
}

function toggleListValue(values: string[], value: string, allowMultiple = true) {
  if (!allowMultiple) {
    return values.includes(value) ? [] : [value]
  }

  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

function getOptionColorClass(value: string) {
  const colorIndex = value.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0) % optionColorClassNames.length

  return optionColorClassNames[colorIndex]
}

function getSemanticChipClass(value: string) {
  const normalizedValue = value.toLowerCase()

  if (['blocked', 'fire', 'risk', 'high', 'missing'].some((token) => normalizedValue.includes(token))) {
    return 'chip-coral'
  }

  if (['waiting', 'requested', 'pending', 'due'].some((token) => normalizedValue.includes(token))) {
    return 'chip-gold'
  }

  if (['done', 'received', 'complete', 'on track'].some((token) => normalizedValue.includes(token))) {
    return 'chip-green'
  }

  if (['prep', 'meeting', 'in progress'].some((token) => normalizedValue.includes(token))) {
    return 'chip-lavender'
  }

  if (['empty', 'archived', 'inactive', 'not needed', 'no status'].some((token) => normalizedValue.includes(token))) {
    return 'chip-gray'
  }

  return ''
}

function getChipColorClass(value: string) {
  return getSemanticChipClass(value) || getOptionColorClass(value)
}

function renderCheckboxIcon(icon: CheckboxIcon = 'check') {
  if (icon === 'star') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="m12 2.8 2.76 5.58 6.16.9-4.46 4.34 1.05 6.13L12 16.86l-5.51 2.89 1.05-6.13-4.46-4.35 6.16-.89L12 2.8Z" />
      </svg>
    )
  }

  if (icon === 'heart') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 20.4S4 15.62 4 9.64C4 6.8 6.03 4.7 8.7 4.7c1.54 0 2.8.72 3.3 1.86.5-1.14 1.76-1.86 3.3-1.86 2.67 0 4.7 2.1 4.7 4.94 0 5.98-8 10.76-8 10.76Z" />
      </svg>
    )
  }

  if (icon === 'thumb') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M8.6 20.2h8.05c1.03 0 1.9-.72 2.1-1.73l1.05-5.28a2.16 2.16 0 0 0-2.12-2.58h-4.3l.66-3.15c.17-.83-.08-1.69-.66-2.3l-.45-.47a1.1 1.1 0 0 0-1.77.24L7.6 11.55v7.65c0 .55.45 1 1 1ZM4.2 11.5h2.1v8.7H4.2z" />
      </svg>
    )
  }

  if (icon === 'flag') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M5 21.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11.25c.43 0 .82.28.95.69l1.38 4.34a1 1 0 0 1-.95 1.31H6v6.16h8.75c.43 0 .82.28.95.69l1.38 4.34a1 1 0 0 1-.95 1.31H5Z" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M9.2 18.1 3.7 12.6l2.25-2.25 3.25 3.25 8.85-8.85 2.25 2.25L9.2 18.1Z" />
    </svg>
  )
}

function App() {
  const allowedAuthEmails = useMemo(() => getAllowedEmailsFromEnv(), [])
  const authRequired = useMemo(() => hasFirebaseConfig() || allowedAuthEmails.length > 0, [allowedAuthEmails.length])
  const [initialBuildViewState] = useState(() => readStoredBuildViewState())
  const initialSelectedBuildTableId = initialBuildViewState.selectedBuildTableId === 'risks' &&
    !initialBuildViewState.activeGridViewId &&
    !initialBuildViewState.gridFilter
    ? 'tasks'
    : initialBuildViewState.selectedBuildTableId || 'tasks'
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(
    () => {
      const storedTheme = localStorage.getItem('sundesk-theme')
      const legacyThemeMap: Record<string, ThemeId> = {
        light: 'command-center',
        'paper-light': 'graphite',
        'sunrise-soft': 'command-center',
        'sunset-bold': 'sunset',
        'cloud-light': 'coast',
        'focus-dark': 'night-shift',
      }
      const themeValue = storedTheme ? legacyThemeMap[storedTheme] || storedTheme : 'command-center'

      return themes.some((theme) => theme.value === themeValue) ? themeValue as ThemeId : 'command-center'
    },
  )
  const [activeScreen, setActiveScreen] = useState<AppScreen>(() => getScreenFromHash())
  const [base, setBase] = useState(() => readStoredWorkbase())
  const [toastMessage, setToastMessage] = useState('')
  const [timelineFilter, setTimelineFilter] = useState('')
  const [timelineTableId, setTimelineTableId] = useState('all')
  const [timelineStatus, setTimelineStatus] = useState('all')
  const [timelineView, setTimelineView] = useState<TimelineView>('grid')
  const [timelineCalendarDate, setTimelineCalendarDate] = useState('')
  const [timelineReadinessCommunityId, setTimelineReadinessCommunityId] = useState('')
  const [timelineGraphCommunityId, setTimelineGraphCommunityId] = useState('')
  const [localRules, setLocalRules] = useState<LocalRule[]>(() => readStoredRules())
  const [educationState, setEducationState] = useState<SundeskEducationState>(() => readSundeskEducationState())
  const [localBackupRehearsed, setLocalBackupRehearsed] = useState(() => readLocalBackupRehearsed())
  const [initialMigrationReport] = useState<StoredMigrationReport>(() => ({ ...storedMigrationReport }))
  const [todayDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [selectedBuildTableId, setSelectedBuildTableId] = useState(
    () => initialSelectedBuildTableId,
  )
  const [tableDraft, setTableDraft] = useState({
    label: '',
    description: '',
  })
  const [tableSettingsDraft, setTableSettingsDraft] = useState({
    label: '',
    description: '',
  })
  const [fieldDraft, setFieldDraft] = useState({
    label: '',
    type: 'text' as FieldType,
    options: 'Missing, Requested, Received, Not needed',
    checkboxIcon: 'check' as CheckboxIcon,
    checkboxColor: 'lime' as CheckboxColor,
    linkedTableId: 'communities',
    allowMultiple: true,
    sourceLinkedFieldId: '',
    sourceFieldId: '',
  })
  const [recordDraft, setRecordDraft] = useState<Record<string, RecordValue>>(() => getEmptyRecordValues(workbase, 'tasks'))
  const [selectedBuildRecordId, setSelectedBuildRecordId] = useState('risk_permit_toronto')
  const [selectedCommunityDetailId, setSelectedCommunityDetailId] = useState('')
  const [communityLinkRecordId, setCommunityLinkRecordId] = useState('')
  const [communityNewLinkTableId, setCommunityNewLinkTableId] = useState('tasks')
  const [communityNewLinkTitle, setCommunityNewLinkTitle] = useState('')
  const [communityNewLinkStatus, setCommunityNewLinkStatus] = useState('')
  const [communityNewLinkDate, setCommunityNewLinkDate] = useState('')
  const [communityNewLinkExtraValues, setCommunityNewLinkExtraValues] = useState<Record<string, string>>({})
  const [visibleFieldIdsByTable, setVisibleFieldIdsByTable] = useState<Record<string, string[]>>(
    () => initialBuildViewState.visibleFieldIdsByTable || defaultVisibleFieldIdsByTable,
  )
  const [gridFilter, setGridFilter] = useState(() => initialBuildViewState.gridFilter || '')
  const [gridSortFieldId, setGridSortFieldId] = useState(() => initialBuildViewState.gridSortFieldId || 'title')
  const [gridSortDirection, setGridSortDirection] = useState<GridSortDirection>(() => initialBuildViewState.gridSortDirection || 'asc')
  const [gridGroupFieldId, setGridGroupFieldId] = useState<string>(
    () => initialBuildViewState.activeGridViewId ? initialBuildViewState.gridGroupFieldId || '' : '',
  )
  const [gridColorFieldId, setGridColorFieldId] = useState(() => initialBuildViewState.gridColorFieldId || '')
  const [gridDensity, setGridDensity] = useState<GridDensity>(() => initialBuildViewState.gridDensity || 'comfortable')
  const [localGridViews, setLocalGridViews] = useState<LocalGridView[]>(() => initialBuildViewState.localGridViews || [])
  const [viewRenameDrafts, setViewRenameDrafts] = useState<Record<string, string>>(
    () => initialBuildViewState.viewRenameDrafts || {},
  )
  const [activeGridViewId, setActiveGridViewId] = useState(() => initialBuildViewState.activeGridViewId || '')
  const [openFieldMenuId, setOpenFieldMenuId] = useState('')
  const [selectedGridCell, setSelectedGridCell] = useState<GridCell | null>(null)
  const [editingGridCell, setEditingGridCell] = useState<GridCell | null>(null)
  const [gridEditDraft, setGridEditDraft] = useState<RecordValue>('')
  const [buildPasteReceipt, setBuildPasteReceipt] = useState('')
  const [buildPasteSummary, setBuildPasteSummary] = useState<BuildPasteSummary | null>(null)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () => initialBuildViewState.columnWidths || {},
  )
  const [isAddFieldMenuOpen, setIsAddFieldMenuOpen] = useState(false)
  const [buildModal, setBuildModal] = useState<BuildModal>('')
  const [pendingDeleteTableId, setPendingDeleteTableId] = useState('')
  const [selectedFieldSettingsId, setSelectedFieldSettingsId] = useState('')
  const [pendingDeleteFieldId, setPendingDeleteFieldId] = useState('')
  const [isCreatingRecord, setIsCreatingRecord] = useState(false)
  const [isRecordDrawerOpen, setIsRecordDrawerOpen] = useState(false)
  const [linkedRecordFilters, setLinkedRecordFilters] = useState<Record<string, string>>({})
  const [dependencyDraft, setDependencyDraft] = useState({
    toRecordId: '',
    relationship: 'dependsOn' as DependencyRelationship,
    reason: '',
  })
  const [dependencySearch, setDependencySearch] = useState('')
  const [activeDigestPreviewMeetingId, setActiveDigestPreviewMeetingId] = useState('')
  const [isTodayCommandPreviewOpen, setIsTodayCommandPreviewOpen] = useState(false)
  const [firestoreReadShadowState, setFirestoreReadShadowState] = useState<FirestoreReadShadowState>(() => getFirestoreReadShadowState())
  const [authSession, setAuthSession] = useState<FirebaseAuthSession | null>(null)
  const [authLoading, setAuthLoading] = useState(authRequired)
  const [workspaceHydrated, setWorkspaceHydrated] = useState(!authRequired)
  const [workspaceStatus, setWorkspaceStatus] = useState(authRequired ? 'Sign in to load the shared workspace.' : 'Local workspace active.')
  const workspaceHydrationRef = useRef(!authRequired)
  const selectedTask = getRecord(base, 'task_permit_toronto')
  const selectedTaskLinks = getLinkedRecordsForRecord(base, 'task_permit_toronto')
  const selectedTaskBacklinks = getBacklinksForRecord(base, 'task_permit_toronto')
  const selectedTaskDependencies = getDependencyReferencesForRecord(base, 'task_permit_toronto')
  const recordPickerItems = getRecordReferences(base).slice(0, 8)
  const materializedLinks = getMaterializedLinks(base)
  const taskCommunityEventDate = getLookupPreview(base, 'task_permit_toronto', 'communityEventDate')
  const buildTableRows = getBuildTableRows(base)
  const selectedBuildTable = base.tables.find((table) => table.id === selectedBuildTableId) || base.tables[0]
  const fieldsForSelectedTable = base.fields.filter((field) => field.tableId === selectedBuildTable?.id)
  const editableFieldsForSelectedTable = fieldsForSelectedTable.filter((field) => !computedFieldTypes.includes(field.type))
  const recordsForSelectedTable = selectedBuildTable ? getRecordsForTable(base, selectedBuildTable.id) : []
  const {
    communityRecords,
    atRiskCommunityRecords,
    followupRecords,
    meetingRecords,
    openTaskRecords,
  } = getWorkRecordGroups(base)
  const nextMeetingRecord = sortRecordsByDate(meetingRecords)[0]
  const nextMeetingLinkedTasks = nextMeetingRecord ? getLinkedRecordsForRecord(base, nextMeetingRecord.id).filter((link) => link.record.tableId === 'tasks') : []
  const nextMeetingPrep = nextMeetingRecord ? getMeetingPrep(base, nextMeetingRecord.id, todayDate) : null
  const timelineSourceRecords = getTimelineSourceRecords(base)
  const timelineStatusOptions = getTimelineStatusOptions(timelineSourceRecords)
  const timelineRecords = getTimelineRecords(base, timelineSourceRecords, timelineTableId, timelineStatus, timelineFilter)
  const todayRuleMatches = getRuleMatchesForDestination(base, localRules, 'today', todayDate)
  const timelineRuleMatches = getRuleMatchesForDestination(base, localRules, 'timeline', todayDate)
  const timelineDatedRecords = timelineRecords.filter((record) => getFirstDateValue(record))
  const timelineDependencyRecordCount = timelineRecords.filter((record) => getDependencySummary(record.id).length > 0).length
  const timelineRuleReadCount = timelineRecords.filter((record) => getTimelineRuleMatchesForRecord(record.id).length > 0).length
  const timelineViewQuestion = {
    grid: 'What needs a clean read.',
    kanban: 'Where work is stuck.',
    calendar: 'What is getting close.',
    timeline: 'What must land before event day.',
    graph: 'Why this place is at risk.',
  }[timelineView]
  const todayLanes = getTodayLanes(base, todayRuleMatches)
  const todayNowLane = todayLanes.find((lane) => lane.id === 'now')
  const todayWaitingLane = todayLanes.find((lane) => lane.id === 'waiting')
  const todayNextLane = todayLanes.find((lane) => lane.id === 'next')
  const todayChangedRecords = Array.from(new Map(todayRuleMatches.map((match) => [match.record.id, match.record])).values())
  const todaySlipRecord = todayNowLane?.records[0]
  const todayChangedRecord = todayChangedRecords[0]
  const todayFocusRecord = todaySlipRecord || todayWaitingLane?.records[0] || todayNextLane?.records[0] || todayChangedRecord
  const todayCommandPreview = buildCommandSendPreview({
    base,
    lanes: todayLanes,
    firstFocusRecord: todayFocusRecord,
    ruleReceipts: todayFocusRecord
      ? getTodayRuleMatchesForRecord(todayFocusRecord.id).slice(0, 1).map((match) => getRulePreviewForBase(base, match.rule))
      : todayRuleMatches.slice(0, 1).map((match) => getRulePreviewForBase(base, match.rule)),
    meetingPrepCount: nextMeetingPrep?.agenda.length ?? nextMeetingLinkedTasks.length,
  })
  const followupCommunityField = base.fields.find((field) => field.tableId === 'followups' && field.id === 'community')
  const meetingTasksField = base.fields.find((field) => field.tableId === 'meetings' && field.id === 'tasks')
  const buildGridDerivation = getBuildGridDerivation(
    base,
    selectedBuildTable?.id || '',
    visibleFieldIdsByTable,
    gridFilter,
    gridSortFieldId,
    gridSortDirection,
    gridGroupFieldId,
  )
  const visibleFieldIds = buildGridDerivation.visibleFieldIds
  const visibleFieldsForGrid = buildGridDerivation.visibleFieldsForGrid
  const sortedAndFilteredRecords = buildGridDerivation.sortedAndFilteredRecords
  const groupField = buildGridDerivation.groupField
  const groupedRecords = buildGridDerivation.groupedRecords
  const selectedBuildRecord = recordsForSelectedTable.find((record) => record.id === selectedBuildRecordId) || recordsForSelectedTable[0]
  const drawerBacklinks = selectedBuildRecord ? getBacklinksForRecord(base, selectedBuildRecord.id) : []
  const drawerLinkedRecords = selectedBuildRecord ? getLinkedRecordsForRecord(base, selectedBuildRecord.id) : []
  const drawerDependencies = selectedBuildRecord ? getDependencyReferencesForRecord(base, selectedBuildRecord.id) : []
  const drawerKeyFields = selectedBuildRecord
    ? fieldsForSelectedTable.filter((field) =>
        field.id === selectedBuildTable?.primaryFieldId ||
        ['status', 'level', 'priority', 'dueDate', 'date', 'eventDate'].includes(field.id),
      )
    : []
  const drawerStatusText = selectedBuildRecord
    ? getStringValue(selectedBuildRecord, 'status') || getStringValue(selectedBuildRecord, 'level') || getStringValue(selectedBuildRecord, 'priority') || 'No status'
    : 'No status'
  const drawerDateText = selectedBuildRecord ? getFirstDateValue(selectedBuildRecord) || 'No date' : 'No date'
  const drawerMeetingPrep = selectedBuildRecord?.tableId === 'meetings' ? getMeetingPrep(base, selectedBuildRecord.id, todayDate) : null
  const drawerCommunityBacklinkRecords = selectedBuildRecord?.tableId === 'communities'
    ? drawerBacklinks.flatMap((backlink) => {
        const record = getRecord(base, backlink.fromRecord.id)

        return record ? [record] : []
      })
    : []
  const drawerCommunityBlockers = drawerCommunityBacklinkRecords.filter((record) =>
    getStringValue(record, 'status') === 'Blocked' || getStringValue(record, 'level') === 'High',
  )
  const drawerCommunityWaiting = drawerCommunityBacklinkRecords.filter((record) =>
    getStringValue(record, 'status') === 'Waiting' || record.tableId === 'followups',
  )
  const drawerCommunityMeetings = drawerCommunityBacklinkRecords.filter((record) => record.tableId === 'meetings')
  const drawerCommunityNextAction = drawerCommunityBlockers[0] || drawerCommunityWaiting[0] || drawerCommunityBacklinkRecords[0]
  const selectedCommunityDetailRecord = communityRecords.find((record) => record.id === selectedCommunityDetailId)
  const communityDetailRecord = selectedCommunityDetailRecord || (selectedBuildRecord?.tableId === 'communities' ? selectedBuildRecord : communityRecords[0])
  const communityDetailRecords = communityDetailRecord
    ? timelineSourceRecords.filter((sourceRecord) =>
        sourceRecord.id !== communityDetailRecord.id && base.fields.some((field) => {
          const value = sourceRecord.values[field.id]

          return field.type === 'linkedRecord' && Array.isArray(value) && value.includes(communityDetailRecord.id)
        }),
      )
    : []
  const communityDetailBlockers = communityDetailRecords.filter((record) =>
    ['Blocked', 'High'].includes(getStringValue(record, 'status') || getStringValue(record, 'level')),
  )
  const communityDetailWaiting = communityDetailRecords.filter((record) =>
    getStringValue(record, 'status') === 'Waiting' || record.tableId === 'followups',
  )
  const communityDetailMeetings = communityDetailRecords.filter((record) => record.tableId === 'meetings')
  const communityDetailNextAction = communityDetailBlockers[0] || communityDetailWaiting[0] || communityDetailRecords[0]
  const communityLinkableRecords = communityDetailRecord
    ? timelineSourceRecords.filter((record) =>
        record.id !== communityDetailRecord.id &&
        !communityDetailRecords.some((linkedRecord) => linkedRecord.id === record.id) &&
        base.fields.some((field) => field.tableId === record.tableId && field.type === 'linkedRecord' && field.linkedTableId === 'communities'),
      )
    : []
  const communityNewLinkTable = base.tables.find((table) => table.id === communityNewLinkTableId)
  const communityNewLinkStatusField = communityNewLinkTable
    ? base.fields.find((field) =>
        field.tableId === communityNewLinkTable.id &&
        ['status', 'level'].includes(field.id) &&
        Boolean(field.options?.length),
      )
    : null
  const communityNewLinkDateField = communityNewLinkTable
    ? base.fields.find((field) =>
        field.tableId === communityNewLinkTable.id &&
        ['dueDate', 'date', 'eventDate'].includes(field.id) &&
        (field.type === 'date' || field.type === 'dateTime'),
      )
    : null
  const communityNewLinkCommunityField = communityNewLinkTable
    ? base.fields.find((field) =>
        field.tableId === communityNewLinkTable.id &&
        field.type === 'linkedRecord' &&
        field.linkedTableId === 'communities',
      )
    : null
  const communityNewLinkExtraFields = communityNewLinkTable
    ? base.fields
        .filter((field) =>
          field.tableId === communityNewLinkTable.id &&
          field.id !== communityNewLinkTable.primaryFieldId &&
          field.id !== communityNewLinkCommunityField?.id &&
          field.id !== communityNewLinkStatusField?.id &&
          field.id !== communityNewLinkDateField?.id &&
          !computedFieldTypes.includes(field.type) &&
          field.type !== 'linkedRecord' &&
          ['text', 'longText', 'singleSelect', 'multiSelect', 'number', 'currency', 'percent', 'rating', 'checkbox'].includes(field.type),
        )
        .slice(0, 3)
    : []
  const selectedDependencyTargetRecord = dependencyDraft.toRecordId ? getRecord(base, dependencyDraft.toRecordId) : null
  const dependencyPickerRecords = getDependencyPickerRecords(base, selectedBuildRecord?.id || '', dependencySearch)
  const linkedFieldsForSelectedTable = fieldsForSelectedTable.filter((field) => field.type === 'linkedRecord' && field.linkedTableId)
  const effectiveSourceLinkedFieldId = fieldDraft.sourceLinkedFieldId || linkedFieldsForSelectedTable[0]?.id || ''
  const selectedSourceLinkedField = fieldsForSelectedTable.find((field) => field.id === effectiveSourceLinkedFieldId)
  const sourceFields = selectedSourceLinkedField?.linkedTableId
    ? base.fields.filter((field) => field.tableId === selectedSourceLinkedField.linkedTableId)
    : []
  const activeGridView = localGridViews.find((view) => view.id === activeGridViewId)
  const activeGridViewChanged = activeGridView
    ? activeGridView.tableId !== selectedBuildTable?.id ||
      activeGridView.filter !== gridFilter ||
      activeGridView.sortFieldId !== gridSortFieldId ||
      (activeGridView.sortDirection || 'asc') !== gridSortDirection ||
      activeGridView.groupFieldId !== gridGroupFieldId ||
      (activeGridView.colorFieldId || '') !== gridColorFieldId ||
      (activeGridView.density || 'comfortable') !== gridDensity ||
      activeGridView.visibleFieldIds.join('|') !== visibleFieldIds.join('|')
    : false
  const canDeleteSelectedBuildTable = Boolean(
    selectedBuildTable && selectedBuildTable.id !== 'communities' && buildTableRows.length > 1,
  )
  const settingsField = fieldsForSelectedTable.find((field) => field.id === selectedFieldSettingsId)
  const timelineTagRouteOptions = Array.from(
    timelineRecords.reduce((routes, record) => {
      getRecordWorkflowTags(record).forEach((tag) => {
        if (!routes.has(tag)) {
          routes.set(tag, record)
        }
      })

      return routes
    }, new Map<string, BaseRecord>()),
  ).slice(0, 8)
  const pendingDeleteField = fieldsForSelectedTable.find((field) => field.id === pendingDeleteFieldId)
  const pendingDeleteTable = base.tables.find((table) => table.id === pendingDeleteTableId)
  const pinnedGridViews = localGridViews.filter((view) => view.pinned)
  const activeScreenRuleMatches = getRuleMatchesForDestination(base, localRules, activeScreen, todayDate)
  const migrationMessages = [
    initialMigrationReport.workbaseReset ? 'Workbase state was repaired.' : '',
    initialMigrationReport.rulesReset ? 'Rules state was repaired.' : '',
    initialMigrationReport.buildViewReset ? 'Build view state was repaired.' : '',
  ].filter(Boolean)
  const firestoreWriteGateState = getFirestoreWriteGateState()
  const firebaseSetupState = getFirebaseSetupState()
  const launchReadinessSummary = getFirebaseLaunchReadinessSummary(firebaseSetupState, {
    backupRehearsed: localBackupRehearsed,
    deployApproved: false,
    writeApproved: firebaseSetupState.writeApprovalRecorded,
  })
  const firestoreWritesEnabled = firestoreWriteGateState.enabled
  const authAllowed = authRequired ? isSessionAllowed(authSession, allowedAuthEmails) : true
  const localEngineStats = getLocalEngineStats(base, localRules, localGridViews)
  const firestoreReadShadowComparison = compareFirestoreReadShadowCounts(localEngineStats, firestoreReadShadowState.collections)
  const ruleDestinationStats = getRuleDestinationStats(base, localRules, todayDate)
  const activeOnboardingStep = getOnboardingStep(educationState.onboarding.currentStepId)
  const activeOnboardingProgress = getOnboardingStepProgress(activeOnboardingStep?.id)
  const visibleOnboardingStatus = educationState.onboarding.status === 'notStarted' && activeScreen === 'today'
    ? 'dismissed'
    : educationState.onboarding.status
  const rupaulMode = educationState.copyMode.rupaulMode

  function getCopy(id: CopyEntryId) {
    return getCopyModeText(id, rupaulMode)
  }

  function getNavCopyId(screenId: AppScreen): CopyEntryId | null {
    if (screenId === 'today') return 'nav.today'
    if (screenId === 'build') return 'nav.build'
    if (screenId === 'meetings') return 'nav.meetings'
    if (screenId === 'settings') return 'nav.settings'
    if (screenId === 'lab') return 'nav.lab'

    return null
  }

  function writeWorkbaseState(nextBase: StoredWorkbaseState['base']) {
    const workbaseState: StoredWorkbaseState = {
      version: 1,
      base: nextBase,
    }

    localStorage.setItem(workbaseStorageKey, JSON.stringify(workbaseState))
  }

  function getCurrentBuildViewState(updates: Partial<StoredBuildViewState> = {}): StoredBuildViewState {
    return {
      version: 1,
      selectedBuildTableId,
      visibleFieldIdsByTable,
      gridFilter,
      gridSortFieldId,
      gridSortDirection,
      gridGroupFieldId,
      gridColorFieldId,
      gridDensity,
      localGridViews,
      viewRenameDrafts,
      activeGridViewId,
      columnWidths,
      ...updates,
    }
  }

  function writeBuildViewState(updates: Partial<StoredBuildViewState> = {}) {
    const buildViewState = getCurrentBuildViewState(updates)

    localStorage.setItem(buildViewStateStorageKey, JSON.stringify(buildViewState))
  }

  function writeRulesState(nextRules: LocalRule[]) {
    localStorage.setItem(rulesStorageKey, JSON.stringify(nextRules))
  }

  function updateEducationState(updater: (current: SundeskEducationState) => SundeskEducationState) {
    setEducationState((current) => writeSundeskEducationState(updater(current)))
  }

  function continueLabModule(moduleId: string) {
    updateEducationState((current) => startSundeskLabModule(current, moduleId))
    showToast('Lab module opened.')
  }

  function startLabModuleOver(moduleId: string) {
    updateEducationState((current) => resetSundeskLabModuleProgress(current, moduleId))
    showToast('Lab module reset.')
  }

  function completeLabModuleStep(moduleId: string) {
    updateEducationState((current) => completeSundeskLabModuleStep(current, sundeskLabModules, moduleId))
    showToast('Lab step marked done.')
  }

  function applyLabAction(moduleId: string, actionId: string) {
    updateEducationState((current) => applySundeskLabAction(current, sundeskLabModules, moduleId, actionId))
    showToast('Lab receipt updated.')
  }

  function resetLabProgress() {
    updateEducationState((current) => resetSundeskLabProgress(current))
    showToast('Lab sample data reset.')
  }

  function showToast(message: string) {
    setToastMessage(message)
  }

  function applyRemoteBuildViewState(buildViewState: StoredBuildViewState) {
    setSelectedBuildTableId(buildViewState.selectedBuildTableId || 'tasks')
    setVisibleFieldIdsByTable(buildViewState.visibleFieldIdsByTable || defaultVisibleFieldIdsByTable)
    setGridFilter(buildViewState.gridFilter || '')
    setGridSortFieldId(buildViewState.gridSortFieldId || 'title')
    setGridSortDirection(buildViewState.gridSortDirection || 'asc')
    setGridGroupFieldId(buildViewState.activeGridViewId ? buildViewState.gridGroupFieldId : '')
    setGridColorFieldId(buildViewState.gridColorFieldId || '')
    setGridDensity(buildViewState.gridDensity || 'comfortable')
    setLocalGridViews(buildViewState.localGridViews || [])
    setViewRenameDrafts(buildViewState.viewRenameDrafts || {})
    setActiveGridViewId(buildViewState.activeGridViewId || '')
    setColumnWidths(buildViewState.columnWidths || {})
  }

  async function signInToSundesk() {
    try {
      setAuthLoading(true)
      await signInWithGooglePopup()
      showToast('Signed in.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign-in failed.'

      showToast(message)
    } finally {
      setAuthLoading(false)
    }
  }

  async function signOutOfSundesk() {
    try {
      await signOutOfFirebaseAuth()
      setWorkspaceHydrated(false)
      workspaceHydrationRef.current = false
      showToast('Signed out.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign-out failed.'

      showToast(message)
    }
  }

  async function copyTextToClipboard(text: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }

    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.setAttribute('readonly', '')
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }

  async function copyMeetingAgenda(prep: NonNullable<ReturnType<typeof getMeetingPrep>>) {
    try {
      await copyTextToClipboard(getMeetingAgendaText(base, prep))
      showToast('Agenda copied.')
    } catch {
      showToast('Copy failed. Use export.')
    }
  }

  function exportMeetingAgenda(prep: NonNullable<ReturnType<typeof getMeetingPrep>>) {
    const pdfExport = buildMeetingAgendaPdfExport(base, prep)
    const pdfBuffer = pdfExport.bytes.buffer.slice(
      pdfExport.bytes.byteOffset,
      pdfExport.bytes.byteOffset + pdfExport.bytes.byteLength,
    ) as ArrayBuffer
    const blob = new Blob([pdfBuffer], { type: pdfExport.mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = pdfExport.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    updateEducationState((current) => ({
      ...current,
      meetingPdf: {
        ...current.meetingPdf,
        lastExportedMeetingId: prep.meeting.id,
      },
    }))
    showToast('Agenda PDF exported.')
  }

  async function copyMeetingNote(prep: NonNullable<ReturnType<typeof getMeetingPrep>>) {
    try {
      await copyTextToClipboard(getStringValue(prep.meeting, 'weeklyNote') || getMeetingWeeklyNoteText(base, prep))
      showToast('Weekly note copied.')
    } catch {
      showToast('Copy failed. Use export.')
    }
  }

  function exportMeetingNote(prep: NonNullable<ReturnType<typeof getMeetingPrep>>) {
    const pdfExport = buildMeetingNotePdfExport(base, prep)
    const pdfBuffer = pdfExport.bytes.buffer.slice(
      pdfExport.bytes.byteOffset,
      pdfExport.bytes.byteOffset + pdfExport.bytes.byteLength,
    ) as ArrayBuffer
    const blob = new Blob([pdfBuffer], { type: pdfExport.mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = pdfExport.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    updateEducationState((current) => ({
      ...current,
      meetingPdf: {
        ...current.meetingPdf,
        lastExportedMeetingId: prep.meeting.id,
      },
    }))
    showToast('Meeting note PDF exported.')
  }

  function exportLocalBackup() {
    const backup = createSundeskLocalBackup({
      workbase: base,
      rules: localRules,
      buildViewState: getCurrentBuildViewState(),
    })
    const fileName = `sundesk-local-backup-${backup.createdAt.slice(0, 10)}.json`
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast('Local backup exported.')
  }

  function applyLocalBackupFile(file: File) {
    void (async () => {
      try {
        const parsedBackup = JSON.parse(await file.text()) as unknown
        const importedBackup = normalizeSundeskLocalBackupImport(parsedBackup)

        if (!importedBackup.ok) {
          showToast(importedBackup.reason)
          return
        }

        setBase(importedBackup.workbase)
        setLocalRules(importedBackup.rules)
        applyRemoteBuildViewState(importedBackup.buildViewState)
        writeWorkbaseState(importedBackup.workbase)
        writeRulesState(importedBackup.rules)
        localStorage.setItem(buildViewStateStorageKey, JSON.stringify(importedBackup.buildViewState))
        setSelectedBuildRecordId(getRecordsForTable(importedBackup.workbase, importedBackup.buildViewState.selectedBuildTableId)[0]?.id || '')
        setRecordDraft(getEmptyRecordValues(importedBackup.workbase, importedBackup.buildViewState.selectedBuildTableId))
        markLocalBackupRehearsed()
        setLocalBackupRehearsed(true)
        setBuildModal('')
        showToast('Local backup imported.')
      } catch {
        showToast('Backup import failed.')
      }
    })()
  }

  function updateRupaulMode(enabled: boolean) {
    setEducationState((current) => {
      const nextState = writeSundeskEducationState({
        ...current,
        copyMode: {
          rupaulMode: enabled,
          updatedAt: new Date().toISOString(),
        },
      })

      return nextState
    })
  }

  function restartOnboardingTour() {
    updateEducationState((current) => restartOnboarding(current))
    openScreen('today')
    showToast('Onboarding restarted.')
  }

  function startOnboardingTour() {
    updateEducationState((current) => startOnboarding(current))
    openScreen('today')
  }

  function dismissOnboardingTour() {
    updateEducationState((current) => dismissOnboarding(current))
  }

  function advanceOnboardingTourStep() {
    if (!activeOnboardingStep) {
      return
    }

    updateEducationState((current) => advanceOnboarding(current, activeOnboardingStep.id, activeOnboardingStep.actionId))
  }

  function goBackOnboardingTourStep() {
    updateEducationState((current) => goBackOnboarding(current))
  }

  function closeBuildModal() {
    setBuildModal('')
    setPendingDeleteTableId('')
    setSelectedFieldSettingsId('')
    setPendingDeleteFieldId('')
    setIsCreatingRecord(false)
    setLinkedRecordFilters({})
  }

  function canDismissBuildModalWithEscape(modal: BuildModal) {
    return modal !== 'deleteTable' && modal !== 'deleteField' && modal !== 'resetLocalData'
  }

  function parseOptions(value: string) {
    return value
      .split(/[,\n]/)
      .map((option) => option.trim())
      .filter(Boolean)
  }

  function createTable() {
    const label = tableDraft.label.trim()

    if (!label) {
      return
    }

    const uniqueId = getUniqueSlug(toSlug(label), base.tables.map((table) => table.id))

    setBase((current) => {
      const nextBase = {
        ...current,
        tables: [
          ...current.tables,
          {
            id: uniqueId,
            label,
            description: tableDraft.description.trim() || 'Custom table.',
            primaryFieldId: 'name',
          },
        ],
        fields: [
          ...current.fields,
          {
            id: 'name',
            tableId: uniqueId,
            label: 'Name',
            type: 'text' as FieldType,
          },
        ],
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
    setSelectedBuildTableId(uniqueId)
    setSelectedBuildRecordId('')
    setVisibleFieldIdsByTable((current) => ({ ...current, [uniqueId]: ['name'] }))
    setGridFilter('')
    setGridSortFieldId('name')
    setGridSortDirection('asc')
    setGridGroupFieldId('')
    setActiveGridViewId('')
    setRecordDraft({ name: '' })
    setTableDraft({ label: '', description: '' })
    writeBuildViewState({
      selectedBuildTableId: uniqueId,
      visibleFieldIdsByTable: { ...visibleFieldIdsByTable, [uniqueId]: ['name'] },
      gridFilter: '',
      gridSortFieldId: 'name',
      gridSortDirection: 'asc',
      gridGroupFieldId: '',
      gridColorFieldId: '',
      gridDensity,
      activeGridViewId: '',
    })
    showToast('Table added.')
    closeBuildModal()
  }

  function openTableSettings() {
    if (!selectedBuildTable) {
      return
    }

    setTableSettingsDraft({
      label: selectedBuildTable.label,
      description: selectedBuildTable.description,
    })
    setBuildModal('tableSettings')
  }

  function renameTable() {
    const tableId = selectedBuildTable?.id
    const label = tableSettingsDraft.label.trim()

    if (!tableId || !label) {
      return
    }

    setBase((current) => {
      const nextBase = {
        ...current,
        tables: current.tables.map((table) =>
          table.id === tableId
            ? {
                ...table,
                label,
                description: tableSettingsDraft.description.trim() || table.description,
              }
            : table,
        ),
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
    showToast('Table saved.')
    closeBuildModal()
  }

  function requestDeleteTable() {
    if (!selectedBuildTable || !canDeleteSelectedBuildTable) {
      return
    }

    setPendingDeleteTableId(selectedBuildTable.id)
    setBuildModal('deleteTable')
  }

  function deleteTable(tableId: string) {
    const recordsToDelete = base.records.filter((record) => record.tableId === tableId).map((record) => record.id)
    const fieldsToDelete = base.fields.filter((field) => field.tableId === tableId).map((field) => field.id)
    const nextBuildTable = buildTableRows.find((table) => table.id !== tableId)

    if (!nextBuildTable) {
      return
    }

    const nextVisibleFields = { ...visibleFieldIdsByTable }
    const nextWidths = { ...columnWidths }
    const deletedViewIds = localGridViews.filter((view) => view.tableId === tableId).map((view) => view.id)
    const nextGridViews = localGridViews.filter((view) => view.tableId !== tableId)
    const nextDrafts = { ...viewRenameDrafts }

    delete nextVisibleFields[tableId]
    fieldsToDelete.forEach((fieldId) => {
      delete nextWidths[fieldId]
    })
    deletedViewIds.forEach((viewId) => {
      delete nextDrafts[viewId]
    })

    setBase((current) => {
      const nextBase = {
        ...current,
        tables: current.tables.filter((table) => table.id !== tableId),
        fields: current.fields
          .filter((field) => field.tableId !== tableId)
          .map((field) => (field.linkedTableId === tableId ? { ...field, linkedTableId: undefined } : field)),
        records: current.records
          .filter((record) => record.tableId !== tableId)
          .map((record) => {
            const values = Object.fromEntries(
              Object.entries(record.values).map(([fieldId, value]) => [
                fieldId,
                Array.isArray(value) ? value.filter((recordId) => !recordsToDelete.includes(recordId)) : value,
              ]),
            )

            return { ...record, values }
          }),
        dependencies: current.dependencies.filter(
          (dependency) =>
            !recordsToDelete.includes(dependency.fromRecordId) && !recordsToDelete.includes(dependency.toRecordId),
        ),
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
    setSelectedBuildTableId(nextBuildTable.id)
    setSelectedBuildRecordId(getRecordsForTable(base, nextBuildTable.id)[0]?.id || '')
    setGridFilter('')
    setGridSortFieldId(nextBuildTable.primaryFieldId)
    setGridSortDirection('asc')
    setGridGroupFieldId('')
    setGridColorFieldId('')
    setActiveGridViewId('')
    setRecordDraft(getEmptyRecordValues(base, nextBuildTable.id))
    setVisibleFieldIdsByTable(nextVisibleFields)
    setColumnWidths(nextWidths)
    setLocalGridViews(nextGridViews)
    setViewRenameDrafts(nextDrafts)
    writeBuildViewState({
      selectedBuildTableId: nextBuildTable.id,
      visibleFieldIdsByTable: nextVisibleFields,
      gridFilter: '',
      gridSortFieldId: nextBuildTable.primaryFieldId,
      gridSortDirection: 'asc',
      gridGroupFieldId: '',
      gridColorFieldId: '',
      localGridViews: nextGridViews,
      viewRenameDrafts: nextDrafts,
      activeGridViewId: '',
      columnWidths: nextWidths,
    })
    showToast('Table deleted.')
    closeBuildModal()
  }

  function createField() {
    const tableId = selectedBuildTable?.id
    const label = fieldDraft.label.trim()

    if (!tableId || !label) {
      return
    }

    const baseId = toSlug(label)
    const id = getUniqueSlug(baseId, fieldsForSelectedTable.map((field) => field.id))
    const options = optionFieldTypes.includes(fieldDraft.type) ? parseOptions(fieldDraft.options) : undefined
    const field: FieldDefinition = {
      id,
      tableId,
      label,
      type: fieldDraft.type,
      options,
    }

    if (fieldDraft.type === 'checkbox') {
      field.checkboxIcon = fieldDraft.checkboxIcon
      field.checkboxColor = fieldDraft.checkboxColor
    }

    if (fieldDraft.type === 'linkedRecord') {
      field.linkedTableId = fieldDraft.linkedTableId
      field.allowMultiple = fieldDraft.allowMultiple
    }

    if (fieldDraft.type === 'lookup' || fieldDraft.type === 'rollup') {
      field.sourceLinkedFieldId = effectiveSourceLinkedFieldId
      field.sourceFieldId = fieldDraft.sourceFieldId || sourceFields[0]?.id
    }

    if (fieldDraft.type === 'rollup') {
      field.operation = 'countWhere'
    }

    if (fieldDraft.type === 'count') {
      field.sourceLinkedFieldId = effectiveSourceLinkedFieldId
    }

    setBase((current) => {
      const nextBase = {
        ...current,
        fields: [...current.fields, field],
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
    const nextVisibleFieldIds = [...(visibleFieldIdsByTable[tableId] || getDefaultVisibleFieldIds(fieldsForSelectedTable)), field.id]

    if (!computedFieldTypes.includes(field.type)) {
      setRecordDraft((current) => ({
        ...current,
        [field.id]: getEmptyFieldValue(field.type),
      }))
    }
    setVisibleFieldIdsByTable((current) => ({
      ...current,
      [tableId]: nextVisibleFieldIds,
    }))
    writeBuildViewState({
      visibleFieldIdsByTable: { ...visibleFieldIdsByTable, [tableId]: nextVisibleFieldIds },
    })
    setFieldDraft((current) => ({ ...current, label: '' }))
    setIsAddFieldMenuOpen(false)
    showToast('Column added.')
    closeBuildModal()
  }

  function updateField(fieldId: string, updates: Partial<FieldDefinition>) {
    const tableId = selectedBuildTable?.id

    if (!tableId) {
      return
    }

    setBase((current) => {
      const currentField = current.fields.find((field) => field.tableId === tableId && field.id === fieldId)
      const nextField = currentField ? { ...currentField, ...updates } : null
      const shouldMigrateValues = Boolean(currentField && nextField && updates.type && updates.type !== currentField.type)
      const nextBase = {
        ...current,
        fields: current.fields.map((field) =>
          field.tableId === tableId && field.id === fieldId ? { ...field, ...updates } : field,
        ),
        records: shouldMigrateValues && nextField
          ? current.records.map((record) =>
              record.tableId === tableId && Object.prototype.hasOwnProperty.call(record.values, fieldId)
                ? {
                    ...record,
                    values: {
                      ...record.values,
                      [fieldId]: coerceStoredFieldValue(nextField, record.values[fieldId]),
                    },
                  }
                : record,
            )
          : current.records,
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
  }

  function requestDeleteField(field: FieldDefinition) {
    if (field.id === selectedBuildTable?.primaryFieldId) {
      return
    }

    setPendingDeleteFieldId(field.id)
    setOpenFieldMenuId('')
    setBuildModal('deleteField')
  }

  function deleteField(field: FieldDefinition) {
    const tableId = selectedBuildTable?.id

    if (!tableId || field.id === selectedBuildTable.primaryFieldId) {
      return
    }

    setBase((current) => {
      const nextBase = {
        ...current,
        fields: current.fields.filter((fieldItem) => !(fieldItem.tableId === field.tableId && fieldItem.id === field.id)),
        records: current.records.map((record) => {
          if (record.tableId !== tableId) {
            return record
          }

          const nextValues = { ...record.values }
          delete nextValues[field.id]

          return { ...record, values: nextValues }
        }),
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
    const nextVisibleFieldIds = (visibleFieldIdsByTable[tableId] || []).filter((fieldId) => fieldId !== field.id)
    const nextWidths = { ...columnWidths }
    const nextSortFieldId = gridSortFieldId === field.id ? selectedBuildTable.primaryFieldId : gridSortFieldId
    const nextGroupFieldId = gridGroupFieldId === field.id ? '' : gridGroupFieldId
    const nextColorFieldId = gridColorFieldId === field.id ? '' : gridColorFieldId

    delete nextWidths[field.id]
    setRecordDraft((current) => {
      const nextDraft = { ...current }
      delete nextDraft[field.id]

      return nextDraft
    })
    setVisibleFieldIdsByTable((current) => ({
      ...current,
      [tableId]: nextVisibleFieldIds,
    }))
    setColumnWidths(nextWidths)
    if (gridSortFieldId === field.id) {
      setGridSortFieldId(selectedBuildTable.primaryFieldId)
    }
    if (gridGroupFieldId === field.id) {
      setGridGroupFieldId('')
    }
    if (gridColorFieldId === field.id) {
      setGridColorFieldId('')
    }
    setOpenFieldMenuId('')
    writeBuildViewState({
      visibleFieldIdsByTable: { ...visibleFieldIdsByTable, [tableId]: nextVisibleFieldIds },
      gridSortFieldId: nextSortFieldId,
      gridSortDirection: gridSortFieldId === field.id ? 'asc' : gridSortDirection,
      gridGroupFieldId: nextGroupFieldId,
      gridColorFieldId: nextColorFieldId,
      columnWidths: nextWidths,
    })
    showToast('Field deleted.')
    closeBuildModal()
  }

  function selectBuildTable(tableId: string) {
    const nextRecord = getRecordsForTable(base, tableId)[0]

    setSelectedBuildTableId(tableId)
    setSelectedBuildRecordId(nextRecord?.id || '')
    setGridFilter('')
    setGridSortFieldId(base.tables.find((table) => table.id === tableId)?.primaryFieldId || '')
    setGridSortDirection('asc')
    setGridGroupFieldId('')
    setGridColorFieldId('')
    setActiveGridViewId('')
    setRecordDraft(getEmptyRecordValues(base, tableId))
  }

  function openBuildRecord(tableId: string, recordId: string) {
    const table = base.tables.find((tableItem) => tableItem.id === tableId)
    const record = getRecord(base, recordId)

    if (!table || !record) {
      return
    }

    setSelectedBuildTableId(tableId)
    setSelectedBuildRecordId(recordId)
    setGridFilter('')
    setGridSortFieldId(table.primaryFieldId)
    setGridSortDirection('asc')
    setGridGroupFieldId('')
    setGridColorFieldId('')
    setActiveGridViewId('')
    setRecordDraft(getEmptyRecordValues(base, tableId))
    setIsCreatingRecord(false)
    setBuildModal('')
    setIsRecordDrawerOpen(true)
    openScreen('build')
    window.setTimeout(() => {
      document.getElementById('record')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }, 0)
  }

  function openDailyRecord(record: BaseRecord) {
    openBuildRecord(record.tableId, record.id)
  }

  function openWorkflowTagRoute(record: BaseRecord, tag: string) {
    const table = base.tables.find((tableItem) => tableItem.id === record.tableId)
    const statusField = base.fields.find((field) => field.tableId === record.tableId && field.id === 'status')
    const nextSortFieldId = table?.primaryFieldId || ''
    const nextGroupFieldId = statusField?.id || ''

    if (!table) {
      return
    }

    setSelectedBuildTableId(record.tableId)
    setSelectedBuildRecordId(record.id)
    setGridFilter(tag)
    setGridSortFieldId(nextSortFieldId)
    setGridSortDirection('asc')
    setGridGroupFieldId(nextGroupFieldId)
    setGridColorFieldId('')
    setActiveGridViewId('')
    setRecordDraft(getEmptyRecordValues(base, record.tableId))
    setIsRecordDrawerOpen(false)
    writeBuildViewState({
      selectedBuildTableId: record.tableId,
      gridFilter: tag,
      gridSortFieldId: nextSortFieldId,
      gridSortDirection: 'asc',
      gridGroupFieldId: nextGroupFieldId,
      gridColorFieldId: '',
      activeGridViewId: '',
    })
    openScreen('build')
    showToast(`Tag route opened: ${tag}.`)
  }

  function openCommunitySourceRoute(communityRecord: BaseRecord, tableId: string, label: string) {
    const table = base.tables.find((tableItem) => tableItem.id === tableId)
    const statusField = base.fields.find((field) => field.tableId === tableId && field.id === 'status')
    const filter = getRecordTitle(base, communityRecord)
    const nextSortFieldId = table?.primaryFieldId || ''
    const nextGroupFieldId = statusField?.id || ''
    const nextRecord = getRecordsForTable(base, tableId)[0]

    if (!table) {
      return
    }

    setSelectedBuildTableId(tableId)
    setSelectedBuildRecordId(nextRecord?.id || '')
    setGridFilter(filter)
    setGridSortFieldId(nextSortFieldId)
    setGridSortDirection('asc')
    setGridGroupFieldId(nextGroupFieldId)
    setGridColorFieldId('')
    setActiveGridViewId('')
    setRecordDraft(getEmptyRecordValues(base, tableId))
    setIsRecordDrawerOpen(false)
    writeBuildViewState({
      selectedBuildTableId: tableId,
      gridFilter: filter,
      gridSortFieldId: nextSortFieldId,
      gridSortDirection: 'asc',
      gridGroupFieldId: nextGroupFieldId,
      gridColorFieldId: '',
      activeGridViewId: '',
    })
    openScreen('build')
    showToast(`Community route opened: ${label}.`)
  }

  function toggleVisibleField(fieldId: string) {
    const tableId = selectedBuildTable?.id

    if (!tableId) {
      return
    }

    setVisibleFieldIdsByTable((current) => {
      const currentFieldIds = current[tableId] || getDefaultVisibleFieldIds(fieldsForSelectedTable)
      const nextFieldIds = currentFieldIds.includes(fieldId)
        ? currentFieldIds.filter((currentFieldId) => currentFieldId !== fieldId)
        : [...currentFieldIds, fieldId]
      const safeFieldIds = nextFieldIds.length > 0 ? nextFieldIds : currentFieldIds

      writeBuildViewState({
        visibleFieldIdsByTable: { ...visibleFieldIdsByTable, [tableId]: safeFieldIds },
      })

      setOpenFieldMenuId('')
      return {
        ...current,
        [tableId]: safeFieldIds,
      }
    })
  }

  function saveGridView() {
    if (!selectedBuildTable) {
      return
    }

    const viewCount = localGridViews.filter((view) => view.tableId === selectedBuildTable.id).length + 1
    const viewId = getUniqueSlug(
      `${selectedBuildTable.id}_view_${viewCount}`,
      localGridViews.map((view) => view.id),
    )
    const view: LocalGridView = {
      id: viewId,
      name: `${selectedBuildTable.label} view ${viewCount}`,
      tableId: selectedBuildTable.id,
      filter: gridFilter,
      sortFieldId: gridSortFieldId,
      sortDirection: gridSortDirection,
      groupFieldId: gridGroupFieldId,
      colorFieldId: gridColorFieldId,
      density: gridDensity,
      visibleFieldIds,
    }

    setLocalGridViews((current) => [view, ...current])
    setViewRenameDrafts((current) => ({ ...current, [view.id]: view.name }))
    setActiveGridViewId(view.id)
    writeBuildViewState({
      localGridViews: [view, ...localGridViews],
      viewRenameDrafts: { ...viewRenameDrafts, [view.id]: view.name },
      activeGridViewId: view.id,
    })
    showToast('View saved.')
  }

  function applyGridView(view: LocalGridView, buildStateUpdates: Partial<StoredBuildViewState> = {}) {
    const table = base.tables.find((tableItem) => tableItem.id === view.tableId)
    const nextRecord = getRecordsForTable(base, view.tableId)[0]

    if (!table) {
      return
    }

    setSelectedBuildTableId(view.tableId)
    setSelectedBuildRecordId(nextRecord?.id || '')
    setVisibleFieldIdsByTable((current) => ({ ...current, [view.tableId]: view.visibleFieldIds }))
    setGridFilter(view.filter)
    setGridSortFieldId(view.sortFieldId)
    setGridSortDirection(view.sortDirection || 'asc')
    setGridGroupFieldId(view.groupFieldId)
    setGridColorFieldId(view.colorFieldId || '')
    setGridDensity(view.density || 'comfortable')
    setActiveGridViewId(view.id)
    setRecordDraft(getEmptyRecordValues(base, view.tableId))
    writeBuildViewState({
      selectedBuildTableId: view.tableId,
      visibleFieldIdsByTable: { ...visibleFieldIdsByTable, [view.tableId]: view.visibleFieldIds },
      gridFilter: view.filter,
      gridSortFieldId: view.sortFieldId,
      gridSortDirection: view.sortDirection || 'asc',
      gridGroupFieldId: view.groupFieldId,
      gridColorFieldId: view.colorFieldId || '',
      gridDensity: view.density || 'comfortable',
      activeGridViewId: view.id,
      ...buildStateUpdates,
    })
  }

  function openPinnedGridView(view: LocalGridView) {
    applyGridView(view)
    openBuildScreen()
  }

  function openBuildScreen() {
    openScreen('build')
  }

  function openScreen(screen: AppScreen) {
    setActiveScreen(screen)
    if (screen !== 'build') {
      setIsRecordDrawerOpen(false)
    }

    if (window.location.hash !== `#${screen}`) {
      window.history.pushState(null, '', `#${screen}`)
    }
  }

  function getDependencySummary(recordId: string) {
    return getDependencySummaryForBase(base, recordId)
  }

  function createDependency() {
    if (!selectedBuildRecord || !dependencyDraft.toRecordId || selectedBuildRecord.id === dependencyDraft.toRecordId) {
      return
    }

    const nextDependency = {
      fromRecordId: selectedBuildRecord.id,
      toRecordId: dependencyDraft.toRecordId,
      relationship: dependencyDraft.relationship,
    }

    if (hasDuplicateDependency(base.dependencies, nextDependency)) {
      return
    }

    const dependency: DependencyLink = {
      id: getUniqueDependencyId(base.dependencies, nextDependency),
      ...nextDependency,
      reason: dependencyDraft.reason.trim() || 'No reason set.',
    }

    setBase((current) => {
      const nextBase = {
        ...current,
        dependencies: [...current.dependencies, dependency],
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
    setDependencyDraft({ toRecordId: '', relationship: 'dependsOn', reason: '' })
    setDependencySearch('')
  }

  function updateDependency(dependencyId: string, updates: Partial<DependencyLink>) {
    setBase((current) => {
      const nextBase = {
        ...current,
        dependencies: current.dependencies.map((dependency) =>
          dependency.id === dependencyId ? { ...dependency, ...updates } : dependency,
        ),
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
  }

  function flipDependencyDirection(dependencyId: string) {
    setBase((current) => {
      const dependencyToFlip = current.dependencies.find((dependency) => dependency.id === dependencyId)

      if (!dependencyToFlip) {
        return current
      }

      const duplicateExists = hasDuplicateDependency(
        current.dependencies,
        {
          fromRecordId: dependencyToFlip.toRecordId,
          toRecordId: dependencyToFlip.fromRecordId,
          relationship: dependencyToFlip.relationship,
        },
        dependencyId,
      )

      if (duplicateExists) {
        return current
      }

      const nextBase = {
        ...current,
        dependencies: current.dependencies.map((dependency) =>
          dependency.id === dependencyId
            ? {
                ...dependency,
                fromRecordId: dependency.toRecordId,
                toRecordId: dependency.fromRecordId,
              }
            : dependency,
        ),
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
  }

  function deleteDependency(dependencyId: string) {
    setBase((current) => {
      const nextBase = {
        ...current,
        dependencies: current.dependencies.filter((dependency) => dependency.id !== dependencyId),
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
  }

  function getCommandReason(rule: LocalRule) {
    const field = base.fields.find((fieldItem) => fieldItem.tableId === rule.tableId && fieldItem.id === rule.fieldId)
    const operator = ruleOperatorOptions.find((option) => option.value === rule.operator)?.label.toLowerCase() || rule.operator
    const linkedRecord = getRecord(base, rule.value)
    const value = linkedRecord ? getRecordTitle(base, linkedRecord) : rule.value
    const fieldLabel = field?.label || rule.fieldId

    if (rule.operator === 'hasAnyLink') {
      return `${fieldLabel} is linked.`
    }

    if (rule.operator === 'hasNoLink') {
      return `${fieldLabel} has no link.`
    }

    if (rule.operator === 'isToday') {
      return `${fieldLabel} is today.`
    }

    if (rule.operator === 'isWithin7Days') {
      return `${fieldLabel} is within 7 days.`
    }

    if (rule.operator === 'isBeforeToday') {
      return `${fieldLabel} is before today.`
    }

    if (rule.operator === 'isOnOrBeforeToday') {
      return `${fieldLabel} is due.`
    }

    if (rule.operator === 'isEmpty') {
      return `${fieldLabel} is empty.`
    }

    return ruleOperatorNeedsValue(rule.operator)
      ? `${fieldLabel} ${operator} ${value || 'value'}.`
      : `${fieldLabel} ${operator}.`
  }

  function getCommandTableLabel(tableId: string) {
    if (tableId === 'followups') {
      return 'Waiting On'
    }

    return base.tables.find((table) => table.id === tableId)?.label || tableId
  }

  function getTodayRuleMatchesForRecord(recordId: string) {
    return todayRuleMatches.filter((match) => match.record.id === recordId)
  }

  function getRecordWorkflowTags(record: BaseRecord) {
    return base.fields
      .filter((field) => field.tableId === record.tableId && field.type === 'multiSelect')
      .flatMap((field) => {
        const value = record.values[field.id]

        return Array.isArray(value) ? value.map(String) : []
      })
  }

  function getTimelineRuleMatchesForRecord(recordId: string) {
    return timelineRuleMatches.filter((match) => match.record.id === recordId)
  }

  function resetLocalWorkbase() {
    const nextBase = cloneWorkbase(workbase)
    const nextTableId = 'tasks'

    localStorage.removeItem(workbaseStorageKey)
    setBase(nextBase)
    setSelectedBuildTableId(nextTableId)
    setSelectedBuildRecordId(getRecordsForTable(nextBase, nextTableId)[0]?.id || '')
    setRecordDraft(getEmptyRecordValues(nextBase, nextTableId))
    setGridFilter('')
    setGridSortFieldId('title')
    setGridGroupFieldId('')
    setActiveGridViewId('')
    setBuildModal('')
  }

  function coercePastedCellValue(field: FieldDefinition, value: string): RecordValue {
    const linkedRecords = field.linkedTableId
      ? getRecordsForTable(base, field.linkedTableId).map((record) => ({
          id: record.id,
          title: getRecordTitle(base, record),
        }))
      : []

    return coerceBuildPasteCellValue(field, value, linkedRecords)
  }

  function coerceStoredFieldValue(field: FieldDefinition, value: RecordValue): RecordValue {
    if (value === null) {
      return value
    }

    if (field.type === 'multiSelect') {
      if (Array.isArray(value)) {
        return value.map(String).filter(Boolean)
      }

      return String(value)
        .split(/[,;]/)
        .map((option) => option.trim())
        .filter(Boolean)
    }

    if (['number', 'currency', 'percent', 'rating'].includes(field.type)) {
      if (typeof value === 'number') {
        return value
      }

      const numericValue = Number(String(value).replace(/[$,%]/g, ''))

      return Number.isFinite(numericValue) ? numericValue : 0
    }

    if (field.type === 'checkbox') {
      if (typeof value === 'boolean') {
        return value
      }

      return ['true', 'yes', 'y', '1', 'done', 'received'].includes(String(value).trim().toLowerCase())
    }

    if (field.type === 'date' || field.type === 'dateTime') {
      return String(value).trim()
    }

    if (field.type === 'text' || field.type === 'longText' || field.type === 'url' || field.type === 'phone') {
      return Array.isArray(value) ? value.join(', ') : String(value ?? '')
    }

    return value
  }

  function getPasteFieldSuggestion(field: FieldDefinition, values: string[]) {
    const filledValues = values.map((value) => value.trim()).filter(Boolean)

    if (filledValues.length === 0) {
      return ''
    }

    if (computedFieldTypes.includes(field.type)) {
      return `${field.label} is computed. Paste skipped it.`
    }

    if (field.type === 'singleSelect' || field.type === 'status') {
      return `${field.label} reads as a select field.`
    }

    if (field.type === 'multiSelect') {
      return `${field.label} reads as tags.`
    }

    if (field.type === 'linkedRecord') {
      return `${field.label} connects related work.`
    }

    if (field.type === 'text' && filledValues.every((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))) {
      return `${field.label} may be a date field.`
    }

    if (field.type === 'text' && filledValues.every((value) => Number.isFinite(Number(value.replace(/[$,%]/g, ''))))) {
      return `${field.label} may be a number field.`
    }

    if (field.type === 'text' && filledValues.some((value) => /[,;]/.test(value))) {
      return `${field.label} may be tags.`
    }

    return ''
  }

  function getPasteFieldAction(field: FieldDefinition, values: string[]): BuildPasteAction | null {
    const filledValues = values.map((value) => value.trim()).filter(Boolean)

    if (filledValues.length === 0 || computedFieldTypes.includes(field.type)) {
      return null
    }

    if (field.type === 'singleSelect' || field.type === 'status') {
      return {
        fieldId: field.id,
        label: field.label,
        updates: { type: field.type, options: field.options },
      }
    }

    if (field.type === 'multiSelect') {
      return {
        fieldId: field.id,
        label: field.label,
        updates: { type: 'multiSelect', options: field.options },
      }
    }

    if (field.type === 'linkedRecord') {
      return {
        fieldId: field.id,
        label: field.label,
        updates: { type: 'linkedRecord', linkedTableId: field.linkedTableId, allowMultiple: field.allowMultiple },
      }
    }

    if (field.type === 'text' && filledValues.every((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))) {
      return {
        fieldId: field.id,
        label: `${field.label} as date`,
        updates: { type: 'date' },
        migrateValues: true,
      }
    }

    if (field.type === 'text' && filledValues.every((value) => Number.isFinite(Number(value.replace(/[$,%]/g, ''))))) {
      return {
        fieldId: field.id,
        label: `${field.label} as number`,
        updates: { type: 'number' },
        migrateValues: true,
      }
    }

    if (field.type === 'text' && filledValues.some((value) => /[,;]/.test(value))) {
      const options = Array.from(new Set(filledValues.flatMap((value) =>
        value
          .split(/[,;]/)
          .map((option) => option.trim())
          .filter(Boolean),
      )))

      return {
        fieldId: field.id,
        label: `${field.label} as tags`,
        updates: { type: 'multiSelect', options },
        migrateValues: true,
      }
    }

    return null
  }

  function applyPasteAction(action: BuildPasteAction) {
    const field = fieldsForSelectedTable.find((tableField) => tableField.id === action.fieldId)

    if (!field) {
      return
    }

    setBase((current) => {
      const nextField = { ...field, ...action.updates }
      const nextBase = {
        ...current,
        fields: current.fields.map((currentField) =>
          currentField.tableId === field.tableId && currentField.id === field.id ? nextField : currentField,
        ),
        records: current.records.map((record) =>
          action.migrateValues && record.tableId === field.tableId && Object.prototype.hasOwnProperty.call(record.values, field.id)
            ? {
                ...record,
                values: {
                  ...record.values,
                  [field.id]: coerceStoredFieldValue(nextField, record.values[field.id]),
                },
              }
            : record,
        ),
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
    showToast(`${field.label} behavior applied.${action.migrateValues ? ' Values migrated.' : ''}`)
  }

  function handleBuildGridPaste(event: ClipboardEvent<HTMLDivElement>) {
    if (!selectedBuildTable) {
      return
    }

    const pasteFields = visibleFieldsForGrid.length > 0 ? visibleFieldsForGrid : fieldsForSelectedTable

    if (pasteFields.length === 0) {
      return
    }

    const pastedText = event.clipboardData.getData('text/plain')
    const rows = parseBuildPasteRows(pastedText)

    if (rows.length === 0) {
      return
    }

    event.preventDefault()

    const flattenedRecords = groupedRecords.flatMap((group) => group.records)
    const startRecordIndex = selectedGridCell
      ? Math.max(0, flattenedRecords.findIndex((record) => record.id === selectedGridCell.recordId))
      : 0
    const startFieldIndex = selectedGridCell
      ? Math.max(0, pasteFields.findIndex((field) => field.id === selectedGridCell.fieldId))
      : 0
    const newRecords: BaseRecord[] = []
    const touchedColumnLabels = new Set<string>()
    const skippedColumnLabels = new Set<string>()
    const pastedValuesByFieldId = new Map<string, string[]>()
    const updatedRowCount = rows.filter((_, rowIndex) => Boolean(flattenedRecords[startRecordIndex + rowIndex])).length
    const createdRowCount = rows.length - updatedRowCount
    getBuildPasteOverflowColumns(rows, startFieldIndex, pasteFields.length).forEach((label) => skippedColumnLabels.add(label))

    rows.forEach((row) => {
      row.forEach((cell, cellIndex) => {
        const field = pasteFields[startFieldIndex + cellIndex]

        if (!field) {
          return
        }

        if (computedFieldTypes.includes(field.type)) {
          skippedColumnLabels.add(field.label)
          return
        }

        pastedValuesByFieldId.set(field.id, [...(pastedValuesByFieldId.get(field.id) || []), cell])
        touchedColumnLabels.add(field.label)
      })
    })
    const pasteSuggestions = pasteFields
      .flatMap((field) => {
        const values = pastedValuesByFieldId.get(field.id)

        return values ? [getPasteFieldSuggestion(field, values)] : []
      })
      .filter(Boolean)
    const pasteActions = pasteFields
      .flatMap((field) => {
        const values = pastedValuesByFieldId.get(field.id)
        const action = values ? getPasteFieldAction(field, values) : null

        return action ? [action] : []
      })
    const optionUpdatesByFieldId = getBuildPasteOptionUpdates(pasteFields, pastedValuesByFieldId)

    setBase((current) => {
      const nextRecords = [...current.records]
      const existingTableRecords = flattenedRecords

      rows.forEach((row, rowIndex) => {
        const existingRecord = existingTableRecords[startRecordIndex + rowIndex]
        const baseValues = existingRecord
          ? { ...existingRecord.values }
          : getEmptyRecordValues(current, selectedBuildTable.id)
        const primaryField = current.fields.find((field) => field.tableId === selectedBuildTable.id && field.id === selectedBuildTable.primaryFieldId)

        row.forEach((cell, cellIndex) => {
          const field = pasteFields[startFieldIndex + cellIndex]

          if (!field) {
            return
          }

          if (computedFieldTypes.includes(field.type)) {
            return
          }

          baseValues[field.id] = coercePastedCellValue(field, cell)
        })

        if (!existingRecord && primaryField && !baseValues[primaryField.id]) {
          baseValues[primaryField.id] = row[0]?.trim() || `Pasted row ${newRecords.length + 1}`
        }

        if (existingRecord) {
          const recordIndex = nextRecords.findIndex((record) => record.id === existingRecord.id)

          if (recordIndex >= 0) {
            nextRecords[recordIndex] = {
              ...nextRecords[recordIndex],
              values: baseValues,
            }
          }
          return
        }

        const primaryValue = String(baseValues[selectedBuildTable.primaryFieldId] || `Pasted row ${newRecords.length + 1}`)
        const record: BaseRecord = {
          id: getUniqueSlug(`${selectedBuildTable.id}_${toSlug(primaryValue)}`, [...current.records, ...newRecords].map((baseRecord) => baseRecord.id)),
          tableId: selectedBuildTable.id,
          values: baseValues,
        }

        newRecords.push(record)
        nextRecords.push(record)
      })

      const nextBase = {
        ...current,
        fields: current.fields.map((field) =>
          field.tableId === selectedBuildTable.id && optionUpdatesByFieldId[field.id]
            ? { ...field, options: optionUpdatesByFieldId[field.id] }
            : field,
        ),
        records: nextRecords,
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })

    const pastedCellCount = rows.reduce((count, row) => count + row.length, 0)

    setBuildPasteReceipt(`${rows.length} rows pasted. ${pastedCellCount} cells changed.`)
    setBuildPasteSummary({
      rows: rows.length,
      cells: pastedCellCount,
      created: createdRowCount,
      updated: updatedRowCount,
      columns: Array.from(touchedColumnLabels),
      skippedColumns: Array.from(skippedColumnLabels),
      suggestions: pasteSuggestions,
      actions: pasteActions,
    })
    showToast(`${rows.length} rows pasted.`)
  }

  function updateRecordDraft(fieldId: string, value: RecordValue) {
    setRecordDraft((current) => ({
      ...current,
      [fieldId]: value,
    }))
  }

  function createRecord() {
    const tableId = selectedBuildTable?.id

    if (!tableId) {
      return
    }

    const primaryValue = recordDraft[selectedBuildTable.primaryFieldId]
    const hasPrimaryValue = typeof primaryValue === 'string' && primaryValue.trim().length > 0

    if (!hasPrimaryValue) {
      return
    }

    const record: BaseRecord = {
      id: getUniqueSlug(`${tableId}_${toSlug(primaryValue)}`, base.records.map((baseRecord) => baseRecord.id)),
      tableId,
      values: { ...recordDraft },
    }

    setBase((current) => {
      const nextBase = {
        ...current,
        records: [...current.records, record],
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
    setSelectedBuildRecordId(record.id)
    setRecordDraft(getEmptyRecordValues(base, tableId))
    setIsCreatingRecord(false)
    showToast('Record added.')
  }

  function createBlankGridRow() {
    const table = selectedBuildTable

    if (!table) {
      return
    }

    const rowNumber = base.records.filter((record) => record.tableId === table.id).length + 1
    const values = {
      ...getEmptyRecordValues(base, table.id),
      [table.primaryFieldId]: `New row ${rowNumber}`,
    }
    const record: BaseRecord = {
      id: getUniqueSlug(`${table.id}_new_row_${rowNumber}`, base.records.map((baseRecord) => baseRecord.id)),
      tableId: table.id,
      values,
    }
    const nextCell = { recordId: record.id, fieldId: table.primaryFieldId }

    setBase((current) => {
      const nextBase = {
        ...current,
        records: [...current.records, record],
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
    setSelectedBuildRecordId(record.id)
    setSelectedGridCell(nextCell)
    setEditingGridCell(nextCell)
    setGridEditDraft(values[table.primaryFieldId])
    showToast('Row added.')
  }

  function openCreateRecordForTable(tableId: string) {
    const table = base.tables.find((tableItem) => tableItem.id === tableId)

    if (!table) {
      return
    }

    setSelectedBuildTableId(tableId)
    setSelectedBuildRecordId(getRecordsForTable(base, tableId)[0]?.id || '')
    setGridFilter('')
    setGridSortFieldId(table.primaryFieldId)
    setGridGroupFieldId('')
    setActiveGridViewId('')
    setRecordDraft(getEmptyRecordValues(base, tableId))
    setIsCreatingRecord(true)
    setBuildModal('record')
  }

  function updateSelectedRecord(fieldId: string, value: RecordValue) {
    if (!selectedBuildRecord) {
      return
    }

    updateRecordField(selectedBuildRecord.id, fieldId, value)
  }

  function updateRecordField(recordId: string, fieldId: string, value: RecordValue) {
    setBase((current) => {
      const nextBase = {
        ...current,
        records: current.records.map((record) =>
          record.id === recordId
            ? {
                ...record,
                values: {
                  ...record.values,
                  [fieldId]: value,
                },
              }
            : record,
        ),
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
  }

  function deleteRecord(recordId: string) {
    setBase((current) => {
      const nextBase = {
        ...current,
        records: current.records
          .filter((record) => record.id !== recordId)
          .map((record) => ({
            ...record,
            values: Object.fromEntries(
              Object.entries(record.values).map(([fieldId, value]) => [
                fieldId,
                Array.isArray(value) ? value.filter((linkedRecordId) => linkedRecordId !== recordId) : value,
              ]),
            ),
          })),
        dependencies: current.dependencies.filter(
          (dependency) => dependency.fromRecordId !== recordId && dependency.toRecordId !== recordId,
        ),
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
    if (selectedBuildRecordId === recordId) {
      setSelectedBuildRecordId('')
    }
    setSelectedGridCell((current) => current?.recordId === recordId ? null : current)
    setEditingGridCell((current) => current?.recordId === recordId ? null : current)
    showToast('Row deleted.')
  }

  function getCommunityLinkField(record: BaseRecord) {
    return base.fields.find((field) =>
      field.tableId === record.tableId &&
      field.type === 'linkedRecord' &&
      field.linkedTableId === 'communities',
    )
  }

  function addCommunityLink() {
    if (!communityDetailRecord || !communityLinkRecordId) {
      return
    }

    const record = getRecord(base, communityLinkRecordId)
    const field = record ? getCommunityLinkField(record) : null

    if (!record || !field) {
      return
    }

    const currentValue = record.values[field.id]
    const currentIds = Array.isArray(currentValue) ? currentValue.map(String) : []
    const nextIds = field.allowMultiple === false
      ? [communityDetailRecord.id]
      : Array.from(new Set([...currentIds, communityDetailRecord.id]))

    updateRecordField(record.id, field.id, nextIds)
    setCommunityLinkRecordId('')
  }

  function removeCommunityLink(record: BaseRecord) {
    if (!communityDetailRecord) {
      return
    }

    const field = getCommunityLinkField(record)

    if (!field) {
      return
    }

    const currentValue = record.values[field.id]
    const currentIds = Array.isArray(currentValue) ? currentValue.map(String) : []
    const nextIds = currentIds.filter((recordId) => recordId !== communityDetailRecord.id)

    updateRecordField(record.id, field.id, nextIds)
  }

  function coerceCommunityNewLinkValue(field: FieldDefinition, value: string): RecordValue {
    const trimmedValue = value.trim()

    if (field.type === 'checkbox') {
      return ['true', 'yes', 'y', '1', 'done', 'received'].includes(trimmedValue.toLowerCase())
    }

    if (field.type === 'multiSelect') {
      return trimmedValue
        .split(/[,;]/)
        .map((option) => option.trim())
        .filter(Boolean)
    }

    if (['number', 'currency', 'percent', 'rating'].includes(field.type)) {
      const numericValue = Number(trimmedValue.replace(/[$,%]/g, ''))

      return Number.isFinite(numericValue) ? numericValue : 0
    }

    return trimmedValue
  }

  function getCommunityLinkedRowExtraSummary(record: BaseRecord) {
    return base.fields
      .filter((field) =>
        field.tableId === record.tableId &&
        ['priority', 'tags'].includes(field.id) &&
        !computedFieldTypes.includes(field.type),
      )
      .map((field) => getFieldDisplayValue(record, field))
      .filter(Boolean)
      .join(' · ')
  }

  function createCommunityLinkedRecord() {
    if (!communityDetailRecord || !communityNewLinkTable) {
      return
    }

    const title = communityNewLinkTitle.trim()

    if (!title) {
      return
    }

    const communityField = base.fields.find((field) =>
      field.tableId === communityNewLinkTable.id &&
      field.type === 'linkedRecord' &&
      field.linkedTableId === 'communities',
    )

    if (!communityField) {
      return
    }

    const values: Record<string, RecordValue> = {
      ...getEmptyRecordValues(base, communityNewLinkTable.id),
      [communityNewLinkTable.primaryFieldId]: title,
      [communityField.id]: [communityDetailRecord.id],
    }

    if (communityNewLinkStatusField) {
      values[communityNewLinkStatusField.id] = communityNewLinkStatus || communityNewLinkStatusField.options?.[0] || ''
    }

    if (communityNewLinkDateField && communityNewLinkDate) {
      values[communityNewLinkDateField.id] = communityNewLinkDate
    }

    communityNewLinkExtraFields.forEach((field) => {
      const value = communityNewLinkExtraValues[field.id]

      if (value) {
        values[field.id] = coerceCommunityNewLinkValue(field, value)
      }
    })

    const record: BaseRecord = {
      id: getUniqueSlug(`${communityNewLinkTable.id}_${toSlug(title)}`, base.records.map((baseRecord) => baseRecord.id)),
      tableId: communityNewLinkTable.id,
      values,
    }

    setBase((current) => {
      const nextBase = {
        ...current,
        records: [...current.records, record],
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
    setCommunityNewLinkTitle('')
    setCommunityNewLinkStatus('')
    setCommunityNewLinkDate('')
    setCommunityNewLinkExtraValues({})
    showToast('Connected item added.')
  }

  function getGridCellKey(cell: GridCell) {
    return `${cell.recordId}:${cell.fieldId}`
  }

  function isSameGridCell(firstCell: GridCell | null, secondCell: GridCell | null) {
    return Boolean(firstCell && secondCell && firstCell.recordId === secondCell.recordId && firstCell.fieldId === secondCell.fieldId)
  }

  function cloneRecordValue(value: RecordValue): RecordValue {
    return Array.isArray(value) ? [...value] : value
  }

  function focusGridCell(cell: GridCell) {
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>(`[data-grid-cell="${CSS.escape(getGridCellKey(cell))}"]`)?.focus()
    }, 0)
  }

  function selectGridCell(recordId: string, fieldId: string) {
    const nextCell = { recordId, fieldId }

    setSelectedGridCell(nextCell)
    focusGridCell(nextCell)
  }

  function startGridCellEdit(record: BaseRecord, field: FieldDefinition) {
    if (computedFieldTypes.includes(field.type)) {
      return
    }

    const nextCell = { recordId: record.id, fieldId: field.id }

    setSelectedGridCell(nextCell)
    setEditingGridCell(nextCell)
    setGridEditDraft(cloneRecordValue(record.values[field.id]))
  }

  function commitGridCellEdit() {
    if (!editingGridCell) {
      return
    }

    updateRecordField(editingGridCell.recordId, editingGridCell.fieldId, gridEditDraft)
    setEditingGridCell(null)
  }

  function cancelGridCellEdit() {
    setEditingGridCell(null)
  }

  function moveGridCell(recordId: string, fieldId: string, rowOffset: number, fieldOffset: number) {
    const gridRecords = groupedRecords.flatMap((group) => group.records)
    const rowIndex = gridRecords.findIndex((record) => record.id === recordId)
    const fieldIndex = visibleFieldsForGrid.findIndex((field) => field.id === fieldId)

    if (rowIndex < 0 || fieldIndex < 0 || visibleFieldsForGrid.length === 0 || gridRecords.length === 0) {
      return
    }

    let nextRowIndex = rowIndex + rowOffset
    let nextFieldIndex = fieldIndex + fieldOffset

    if (nextFieldIndex >= visibleFieldsForGrid.length) {
      nextFieldIndex = 0
      nextRowIndex += 1
    }

    if (nextFieldIndex < 0) {
      nextFieldIndex = visibleFieldsForGrid.length - 1
      nextRowIndex -= 1
    }

    nextRowIndex = Math.max(0, Math.min(gridRecords.length - 1, nextRowIndex))

    const nextCell = {
      recordId: gridRecords[nextRowIndex].id,
      fieldId: visibleFieldsForGrid[nextFieldIndex].id,
    }

    setSelectedGridCell(nextCell)
    focusGridCell(nextCell)
  }

  function handleSavedGridCellKeyDown(record: BaseRecord, field: FieldDefinition, event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      startGridCellEdit(record, field)
      return
    }

    if (event.key === ' ') {
      event.preventDefault()
      if (field.type === 'checkbox') {
        selectGridCell(record.id, field.id)
        updateRecordField(record.id, field.id, !record.values[field.id])
        return
      }

      setSelectedBuildRecordId(record.id)
      setIsRecordDrawerOpen(true)
      return
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      moveGridCell(record.id, field.id, 0, event.shiftKey ? -1 : 1)
      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      moveGridCell(record.id, field.id, 0, 1)
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      moveGridCell(record.id, field.id, 0, -1)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveGridCell(record.id, field.id, 1, 0)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveGridCell(record.id, field.id, -1, 0)
    }
  }

  function handleGridEditorKeyDown(record: BaseRecord, field: FieldDefinition, event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelGridCellEdit()
      focusGridCell({ recordId: record.id, fieldId: field.id })
      return
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      commitGridCellEdit()
      moveGridCell(record.id, field.id, 0, event.shiftKey ? -1 : 1)
      return
    }

    if (event.key === 'Enter' && field.type !== 'longText') {
      event.preventDefault()
      commitGridCellEdit()
      focusGridCell({ recordId: record.id, fieldId: field.id })
    }
  }

  function resizeColumn(fieldId: string, event: PointerEvent<HTMLButtonElement>) {
    const startX = event.clientX
    const startWidth = columnWidths[fieldId] || 180

    function updateWidth(pointerEvent: globalThis.PointerEvent) {
      const nextWidth = Math.max(120, Math.min(420, startWidth + pointerEvent.clientX - startX))

      setColumnWidths((current) => ({ ...current, [fieldId]: nextWidth }))
    }

    function stopResize() {
      document.removeEventListener('pointermove', updateWidth)
      document.removeEventListener('pointerup', stopResize)
    }

    document.addEventListener('pointermove', updateWidth)
    document.addEventListener('pointerup', stopResize)
  }

  function sortGridByField(fieldId: string, direction: GridSortDirection) {
    setGridSortFieldId(fieldId)
    setGridSortDirection(direction)
    setOpenFieldMenuId('')
    writeBuildViewState({
      gridSortFieldId: fieldId,
      gridSortDirection: direction,
    })
  }

  function groupGridByField(fieldId: string) {
    setGridGroupFieldId(fieldId)
    setOpenFieldMenuId('')
    writeBuildViewState({
      gridGroupFieldId: fieldId,
    })
  }

  function duplicateField(field: FieldDefinition) {
    const tableId = selectedBuildTable?.id

    if (!tableId) {
      return
    }

    const baseId = toSlug(`${field.label} copy`)
    const id = getUniqueSlug(baseId, fieldsForSelectedTable.map((fieldItem) => fieldItem.id))
    const duplicatedField: FieldDefinition = {
      ...field,
      id,
      label: `${field.label} copy`,
      options: field.options ? [...field.options] : undefined,
    }
    const nextVisibleFieldIds = [...visibleFieldIds, id]

    setBase((current) => {
      const nextBase = {
        ...current,
        fields: [...current.fields, duplicatedField],
        records: current.records.map((record) =>
          record.tableId === tableId && !computedFieldTypes.includes(field.type)
            ? {
                ...record,
                values: {
                  ...record.values,
                  [id]: cloneRecordValue(record.values[field.id] ?? getEmptyFieldValue(field.type)),
                },
              }
            : record,
        ),
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
    setVisibleFieldIdsByTable((current) => ({
      ...current,
      [tableId]: nextVisibleFieldIds,
    }))
    setOpenFieldMenuId('')
    writeBuildViewState({
      visibleFieldIdsByTable: { ...visibleFieldIdsByTable, [tableId]: nextVisibleFieldIds },
    })
  }

  function renderGridHeader(field: FieldDefinition, menuKey: string) {
    return (
      <BuildGridHeader
        field={field}
        fieldTypeOptions={fieldTypeOptions}
        isPrimaryField={selectedBuildTable?.primaryFieldId === field.id}
        menuKey={menuKey}
        optionFieldTypes={optionFieldTypes}
        openFieldMenuId={openFieldMenuId}
        onDuplicateField={duplicateField}
        onGroupGridByField={groupGridByField}
        onOpenFieldMenuIdChange={setOpenFieldMenuId}
        onRequestDeleteField={requestDeleteField}
        onResizeColumn={resizeColumn}
        onSortGridByField={sortGridByField}
        onToggleVisibleField={toggleVisibleField}
        onUpdateField={updateField}
        parseOptions={parseOptions}
      />
    )
  }

  function openAddFieldMenu() {
    setBuildModal('')
    setOpenFieldMenuId('')
    setIsAddFieldMenuOpen((current) => !current)
  }

  function renderAddFieldMenu() {
    if (!isAddFieldMenuOpen) {
      return null
    }

    const fieldNeedsSource = fieldDraft.type === 'lookup' || fieldDraft.type === 'rollup' || fieldDraft.type === 'count'

    return (
      <form
        className="grid-field-menu add-field-menu"
        data-testid="build-add-column-menu"
        aria-label="Add column"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          createField()
        }}
      >
        <label>
          <span>Column name</span>
          <input
            aria-label="Column name"
            placeholder="Permit status"
            value={fieldDraft.label}
            onChange={(event) => setFieldDraft((current) => ({ ...current, label: event.target.value }))}
          />
        </label>
        <label>
          <span>Type</span>
          <select
            aria-label="Type"
            value={fieldDraft.type}
            onChange={(event) => {
              const type = event.target.value as FieldType

              setFieldDraft((current) => ({
                ...current,
                type,
                sourceLinkedFieldId: linkedFieldsForSelectedTable[0]?.id || '',
                sourceFieldId: '',
              }))
            }}
          >
            {fieldTypeOptions.map((fieldType) => (
              <option key={fieldType.value} value={fieldType.value}>
                {fieldType.label}
              </option>
            ))}
          </select>
        </label>
        {optionFieldTypes.includes(fieldDraft.type) && (
          <label>
            <span>Options</span>
            <textarea
              aria-label="Options"
              rows={2}
              value={fieldDraft.options}
              onChange={(event) => setFieldDraft((current) => ({ ...current, options: event.target.value }))}
            />
          </label>
        )}
        {fieldDraft.type === 'linkedRecord' && (
          <label>
            <span>Connected table</span>
            <select
              aria-label="Connected table"
              value={fieldDraft.linkedTableId}
              onChange={(event) => setFieldDraft((current) => ({ ...current, linkedTableId: event.target.value }))}
            >
              {base.tables
                .filter((table) => table.id !== selectedBuildTable?.id)
                .map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.label}
                  </option>
                ))}
            </select>
          </label>
        )}
        {fieldNeedsSource && (
          <label>
            <span>Connection</span>
            <select
              aria-label="Connection"
              value={effectiveSourceLinkedFieldId}
              onChange={(event) => setFieldDraft((current) => ({ ...current, sourceLinkedFieldId: event.target.value, sourceFieldId: '' }))}
            >
              {linkedFieldsForSelectedTable.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {(fieldDraft.type === 'lookup' || fieldDraft.type === 'rollup') && (
          <label>
            <span>Detail</span>
            <select
              aria-label="Detail"
              value={fieldDraft.sourceFieldId || sourceFields[0]?.id || ''}
              onChange={(event) => setFieldDraft((current) => ({ ...current, sourceFieldId: event.target.value }))}
            >
              {sourceFields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="add-field-menu-actions">
          <button type="button" onClick={() => setIsAddFieldMenuOpen(false)}>Cancel</button>
          <button className="primary" type="submit">Add column</button>
        </div>
      </form>
    )
  }

  function getFieldDisplayValue(record: BaseRecord, field: FieldDefinition) {
    return getRecordFieldDisplayValue(base, record, field)
  }

  function getPickerRecordLabel(record: BaseRecord) {
    const status = getStringValue(record, 'status') || getStringValue(record, 'level') || getStringValue(record, 'priority')
    const date = getFirstDateValue(record)

    return [getRecordTitle(base, record), status, date].filter(Boolean).join(' · ')
  }

  function getPickerRecordMeta(record: BaseRecord) {
    const table = base.tables.find((tableItem) => tableItem.id === record.tableId)
    const status = getStringValue(record, 'status') || getStringValue(record, 'level') || getStringValue(record, 'priority') || 'No status'
    const date = getFirstDateValue(record) || 'No date'

    return `${table?.label || record.tableId} · ${status} · ${date}`
  }

  function getGridRowColorClass(record: BaseRecord) {
    const field = fieldsForSelectedTable.find((fieldItem) => fieldItem.id === gridColorFieldId)

    if (!field) {
      return ''
    }

    const value = getFieldDisplayValue(record, field).toLowerCase()

    if (['blocked', 'fire', 'risk', 'high', 'missing'].some((token) => value.includes(token))) {
      return 'grid-row-color-coral'
    }

    if (['waiting', 'requested', 'pending', 'due'].some((token) => value.includes(token))) {
      return 'grid-row-color-gold'
    }

    if (['done', 'received', 'complete', 'on track'].some((token) => value.includes(token))) {
      return 'grid-row-color-green'
    }

    if (['prep', 'meeting', 'in progress'].some((token) => value.includes(token))) {
      return 'grid-row-color-lavender'
    }

    if (['empty', 'archived', 'inactive', 'not needed', 'no status'].some((token) => value.includes(token))) {
      return 'grid-row-color-gray'
    }

    return 'grid-row-color-blue'
  }

  function renderRecordInput(
    field: FieldDefinition,
    value: RecordValue,
    onChange: (fieldId: string, value: RecordValue) => void,
  ) {
    return (
      <RecordFieldInput
        base={base}
        field={field}
        getPickerRecordLabel={getPickerRecordLabel}
        getPickerRecordMeta={getPickerRecordMeta}
        getRecord={getRecord}
        getRecordContext={getRecordContext}
        getRecordTitle={getRecordTitle}
        getRecordsForTable={getRecordsForTable}
        linkedRecordFilters={linkedRecordFilters}
        setLinkedRecordFilters={setLinkedRecordFilters}
        toggleListValue={toggleListValue}
        value={value}
        onChange={onChange}
      />
    )
  }

  function getWeeklyNoteSection(note: string, heading: string) {
    const pattern = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, 'i')
    const match = note.match(pattern)

    return match?.[1]?.trim() || ''
  }

  function updateWeeklyNoteSection(note: string, heading: string, value: string) {
    const nextSection = `## ${heading}\n${value.trim()}`
    const pattern = new RegExp(`## ${heading}\\n[\\s\\S]*?(?=\\n## |$)`, 'i')

    if (pattern.test(note)) {
      return note.replace(pattern, nextSection)
    }

    return `${note.trim()}\n\n${nextSection}`.trim()
  }

  function appendWeeklyNoteSectionLine(note: string, heading: string, record: BaseRecord) {
    const currentSection = getWeeklyNoteSection(note, heading)
    const recordLine = `- ${getRecordTitle(base, record)}. ${getPickerRecordMeta(record)}.`
    const nextSection = currentSection ? `${currentSection}\n${recordLine}` : recordLine

    return updateWeeklyNoteSection(note, heading, nextSection)
  }

  function getWeeklyNoteSectionRoute(record: BaseRecord) {
    const status = getStringValue(record, 'status')
    const level = getStringValue(record, 'level')
    const date = getFirstDateValue(record)

    if (record.tableId === 'risks' || level === 'High') {
      return {
        section: 'Risks',
        reason: level ? `${level} risk belongs in the risk read.` : 'Risk records belong in the risk read.',
      }
    }

    if (record.tableId === 'approvals') {
      return {
        section: status === 'Missing' || status === 'Requested' ? 'Decisions' : 'Next steps',
        reason: `${status || 'Approval'} needs an explicit meeting call.`,
      }
    }

    if (record.tableId === 'followups') {
      return {
        section: 'Next steps',
        reason: `${status || 'Waiting'} loop needs an owner and next move.`,
      }
    }

    if (record.tableId === 'tasks') {
      return {
        section: status === 'Blocked' ? 'Risks' : 'Next steps',
        reason: status === 'Blocked'
          ? 'Blocked work belongs in the risk read.'
          : `${status || 'Work'}${date ? ` by ${date}` : ''} belongs in next steps.`,
      }
    }

    if (record.tableId === 'communities') {
      return {
        section: status === 'At risk' || status === 'Blocked' ? 'Risks' : 'Decisions',
        reason: `${status || 'Place'} context sets the meeting frame.`,
      }
    }

    return {
      section: 'Decisions',
      reason: 'Source context belongs in decisions.',
    }
  }

  function openMeetingSourceRoute(record: BaseRecord) {
    openBuildRecord(record.tableId, record.id)
    showToast(`Meeting item opened: ${getRecordTitle(base, record)}.`)
  }

  function renderMeetingPrep(prep: NonNullable<ReturnType<typeof getMeetingPrep>>) {
    return (
      <MeetingPrepPanel
        activeDigestPreviewMeetingId={activeDigestPreviewMeetingId}
        appendWeeklyNoteSectionLine={appendWeeklyNoteSectionLine}
        base={base}
        getPickerRecordMeta={getPickerRecordMeta}
        getWeeklyNoteSection={getWeeklyNoteSection}
        getWeeklyNoteSectionRoute={getWeeklyNoteSectionRoute}
        onCopyMeetingAgenda={copyMeetingAgenda}
        onCopyMeetingNote={copyMeetingNote}
        onExportMeetingAgenda={exportMeetingAgenda}
        onExportMeetingNote={exportMeetingNote}
        onOpenMeetingSourceRoute={openMeetingSourceRoute}
        onOpenRecord={openBuildRecord}
        onSetActiveDigestPreviewMeetingId={setActiveDigestPreviewMeetingId}
        onUpdateRecordField={updateRecordField}
        prep={prep}
        rupaulMode={rupaulMode}
        updateWeeklyNoteSection={updateWeeklyNoteSection}
      />
    )
  }

  function renderEditableGridCell(record: BaseRecord, field: FieldDefinition) {
    return (
      <BuildGridCell
        commitGridCellEdit={commitGridCellEdit}
        editDraft={gridEditDraft}
        editingGridCell={editingGridCell}
        field={field}
        getChipColorClass={getChipColorClass}
        getFieldDisplayValue={getFieldDisplayValue}
        getGridCellKey={getGridCellKey}
        getLinkedRecord={(recordId) => getRecord(base, recordId)}
        getLinkedRecordsForTable={(tableId) => getRecordsForTable(base, tableId)}
        getLinkedTableLabel={(tableId) => base.tables.find((table) => table.id === tableId)?.label}
        getPickerRecordLabel={getPickerRecordLabel}
        getPickerRecordMeta={getPickerRecordMeta}
        getRecordContext={getRecordContext}
        getRecordTitle={(recordItem) => getRecordTitle(base, recordItem)}
        isComputedField={(fieldItem) => computedFieldTypes.includes(fieldItem.type)}
        linkedRecordFilters={linkedRecordFilters}
        onQuickUpdate={updateRecordField}
        record={record}
        renderCheckboxIcon={renderCheckboxIcon}
        selectedGridCell={selectedGridCell}
        selectGridCell={selectGridCell}
        setEditDraft={setGridEditDraft}
        setLinkedRecordFilters={setLinkedRecordFilters}
        setSelectedBuildRecordId={setSelectedBuildRecordId}
        startGridCellEdit={startGridCellEdit}
        onEditorKeyDown={handleGridEditorKeyDown}
        onSavedKeyDown={handleSavedGridCellKeyDown}
      />
    )
  }

  function renderTimelineView() {
    return (
      <TimelineModes
        base={base}
        communityRecords={communityRecords}
        timelineCalendarDate={timelineCalendarDate}
        timelineGraphCommunityId={timelineGraphCommunityId}
        timelineReadinessCommunityId={timelineReadinessCommunityId}
        timelineRecords={timelineRecords}
        timelineRuleMatches={timelineRuleMatches}
        timelineView={timelineView}
        todayDate={todayDate}
        onOpenDailyRecord={openDailyRecord}
        onSetTimelineCalendarDate={setTimelineCalendarDate}
        onSetTimelineGraphCommunityId={setTimelineGraphCommunityId}
        onSetTimelineReadinessCommunityId={setTimelineReadinessCommunityId}
        onShowToast={showToast}
        onUpdateRecordField={updateRecordField}
      />
    )
  }

  function renderRecordModal() {
    return (
      <RecordModal
        drawerBacklinks={drawerBacklinks}
        drawerLinkedRecords={drawerLinkedRecords}
        editableFieldsForSelectedTable={editableFieldsForSelectedTable}
        isCreatingRecord={isCreatingRecord}
        isOpen={buildModal === 'record'}
        recordDraft={recordDraft}
        rupaulMode={rupaulMode}
        selectedRecord={selectedBuildRecord}
        selectedRecordTitle={selectedBuildRecord ? getRecordTitle(base, selectedBuildRecord) : ''}
        selectedTableLabel={selectedBuildTable?.label}
        onClose={closeBuildModal}
        onCreateRecord={createRecord}
        onOpenRecord={openBuildRecord}
        onRenderRecordInput={renderRecordInput}
        onSelectedRecordChange={updateSelectedRecord}
        onUpdateRecordDraft={updateRecordDraft}
      />
    )
  }

  useEffect(() => {
    if (!authRequired) {
      return
    }

    let cancelled = false
    let unsubscribe = () => undefined as void

    void subscribeToFirebaseAuthState((session) => {
      if (cancelled) {
        return
      }

      setAuthSession(session)
      setAuthLoading(false)
      if (!session) {
        setWorkspaceHydrated(false)
        workspaceHydrationRef.current = false
        setWorkspaceStatus('Sign in to load the shared workspace.')
      }
    }).then((nextUnsubscribe) => {
      unsubscribe = nextUnsubscribe
    }).catch((error) => {
      if (!cancelled) {
        const message = error instanceof Error ? error.message : 'Auth check failed.'

        setAuthLoading(false)
        setWorkspaceStatus(message)
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [authRequired])

  useEffect(() => {
    if (!authRequired || !authAllowed || !authSession || workspaceHydrationRef.current) {
      return
    }

    let cancelled = false

    setWorkspaceStatus('Loading shared workspace.')

    void (async () => {
      const services = await getFirebaseServices()

      if (!services) {
        return 'Shared setup is not configured. Local workspace remains active.'
      }

      const client = createFirestoreWorkspaceClient({
        store: createFirestoreWorkspaceSdkDocumentStore(services.db),
        writeGate: { enabled: firestoreWritesEnabled },
      })
      const result = await client.loadCurrent()

      if (cancelled) {
        return ''
      }

      if (result.exists) {
        setBase(result.state.base)
        setLocalRules(result.state.rules)
        setSelectedTheme(result.state.theme)
        setEducationState(writeSundeskEducationState(result.state.educationState))
        applyRemoteBuildViewState(result.state.buildViewState)
        writeWorkbaseState(result.state.base)
        writeRulesState(result.state.rules)
        localStorage.setItem('sundesk-theme', result.state.theme)
        localStorage.setItem(buildViewStateStorageKey, JSON.stringify(result.state.buildViewState))

        return result.state.usedFallbacks.base || result.state.usedFallbacks.rules || result.state.usedFallbacks.buildViewState || result.state.usedFallbacks.educationState
          ? 'Shared workspace loaded with repaired defaults.'
          : 'Shared workspace loaded.'
      }

      return firestoreWritesEnabled
        ? 'No shared workspace found yet. The next approved save will create it.'
        : 'No shared workspace found yet. Local workspace remains active until writes are approved.'
    })().then((message) => {
      if (!cancelled) {
        workspaceHydrationRef.current = true
        setWorkspaceHydrated(true)
        if (message) {
          setWorkspaceStatus(message)
        }
      }
    }).catch((error) => {
      if (!cancelled) {
        const message = error instanceof Error ? error.message : 'Shared workspace failed to load.'

        workspaceHydrationRef.current = true
        setWorkspaceHydrated(true)
        setWorkspaceStatus(`${message} Local workspace remains active.`)
      }
    })

    return () => {
      cancelled = true
    }
  }, [authAllowed, authRequired, authSession, firestoreWritesEnabled])

  useEffect(() => {
    localStorage.setItem('sundesk-theme', selectedTheme)
  }, [selectedTheme])

  useEffect(() => {
    const workbaseState: StoredWorkbaseState = {
      version: 1,
      base,
    }

    localStorage.setItem(workbaseStorageKey, JSON.stringify(workbaseState))
  }, [base])

  useEffect(() => {
    localStorage.setItem(rulesStorageKey, JSON.stringify(localRules))
  }, [localRules])

  useEffect(() => {
    const currentState = getFirestoreReadShadowState()

    if (currentState.state !== 'ready') {
      return
    }

    let cancelled = false

    void (async () => {
      const services = await getFirebaseServices()

      if (!services) {
        return {
          state: 'missing-config',
          label: 'Missing config',
          detail: 'Shared services are not available.',
        } satisfies FirestoreReadShadowState
      }

      if (!cancelled) {
        setFirestoreReadShadowState({
          state: 'loading',
          label: 'Loading',
          detail: 'Reading remote counts. Local storage is still active.',
        })
      }

      return loadFirestoreReadShadow(createFirestoreReadShadowReader(services.db))
    })().then((state) => {
      if (!cancelled) {
        setFirestoreReadShadowState(state)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!toastMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => setToastMessage(''), 2400)

    return () => window.clearTimeout(timeoutId)
  }, [toastMessage])

  useEffect(() => {
    const buildViewState: StoredBuildViewState = {
      version: 1,
      selectedBuildTableId,
      visibleFieldIdsByTable,
      gridFilter,
      gridSortFieldId,
      gridSortDirection,
      gridColorFieldId,
      gridDensity,
      gridGroupFieldId,
      localGridViews,
      viewRenameDrafts,
      activeGridViewId,
      columnWidths,
    }

    localStorage.setItem(buildViewStateStorageKey, JSON.stringify(buildViewState))
  }, [
    activeGridViewId,
    columnWidths,
    gridFilter,
    gridColorFieldId,
    gridDensity,
    gridGroupFieldId,
    gridSortFieldId,
    gridSortDirection,
    localGridViews,
    selectedBuildTableId,
    viewRenameDrafts,
    visibleFieldIdsByTable,
  ])

  useEffect(() => {
    if (!authRequired || !authAllowed || !authSession || !workspaceHydrated || !firestoreWritesEnabled) {
      return
    }

    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        const services = await getFirebaseServices()

        if (!services) {
          return 'Shared setup is not configured. Shared save skipped.'
        }

        const client = createFirestoreWorkspaceClient({
          store: createFirestoreWorkspaceSdkDocumentStore(services.db),
          writeGate: { enabled: firestoreWritesEnabled },
        })

        await client.saveCurrent({
          base,
          rules: localRules,
          buildViewState: {
            version: 1,
            selectedBuildTableId,
            visibleFieldIdsByTable,
            gridFilter,
            gridSortFieldId,
            gridSortDirection,
            gridGroupFieldId,
            gridColorFieldId,
            gridDensity,
            localGridViews,
            viewRenameDrafts,
            activeGridViewId,
            columnWidths,
          },
          educationState,
          theme: selectedTheme,
          metadata: {
            updatedAt: new Date().toISOString(),
            updatedByUid: authSession.uid,
            updatedByEmail: authSession.email || undefined,
          },
        })

        return 'Shared workspace saved.'
      })().then((message) => {
        if (!cancelled) {
          setWorkspaceStatus(message)
        }
      }).catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Shared workspace save failed.'

          setWorkspaceStatus(message)
        }
      })
    }, 900)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [
    activeGridViewId,
    authAllowed,
    authRequired,
    authSession,
    base,
    columnWidths,
    educationState,
    firestoreWritesEnabled,
    gridColorFieldId,
    gridDensity,
    gridFilter,
    gridGroupFieldId,
    gridSortDirection,
    gridSortFieldId,
    localGridViews,
    localRules,
    selectedBuildTableId,
    selectedTheme,
    viewRenameDrafts,
    visibleFieldIdsByTable,
    workspaceHydrated,
  ])

  useEffect(() => {
    function closeTransientSurfaces(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      if (openFieldMenuId) {
        setOpenFieldMenuId('')
        return
      }

      if (isAddFieldMenuOpen) {
        setIsAddFieldMenuOpen(false)
        return
      }

      if (buildModal && canDismissBuildModalWithEscape(buildModal)) {
        closeBuildModal()
      }
    }

    window.addEventListener('keydown', closeTransientSurfaces)

    return () => window.removeEventListener('keydown', closeTransientSurfaces)
  }, [buildModal, isAddFieldMenuOpen, openFieldMenuId])

  useEffect(() => {
    function syncScreenFromHash() {
      const nextScreen = getScreenFromHash()

      setActiveScreen(nextScreen)
      setBuildModal('')
      setPendingDeleteTableId('')
      setSelectedFieldSettingsId('')
      setPendingDeleteFieldId('')
      setIsCreatingRecord(false)
      if (nextScreen !== 'build') {
        setIsRecordDrawerOpen(false)
      }
    }

    window.addEventListener('hashchange', syncScreenFromHash)
    syncScreenFromHash()

    return () => window.removeEventListener('hashchange', syncScreenFromHash)
  }, [])

  useEffect(() => {
    if (educationState.onboarding.status !== 'inProgress' || !activeOnboardingStep) {
      return
    }

    const target = document.querySelector(`[data-onboarding-target="${activeOnboardingStep.targetId}"]`)

    if (!target && activeOnboardingStep.screen && activeScreen !== activeOnboardingStep.screen) {
      openScreen(activeOnboardingStep.screen)
    }
  }, [activeOnboardingStep, activeScreen, educationState.onboarding.status])

  useEffect(() => {
    if (
      educationState.onboarding.status !== 'inProgress' ||
      !activeOnboardingStep ||
      activeOnboardingStep.requiredAction !== 'routeMounted' ||
      activeOnboardingStep.screen !== activeScreen
    ) {
      return
    }

    const target = document.querySelector(`[data-onboarding-target="${activeOnboardingStep.targetId}"]`)

    if (!target) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      updateEducationState((current) => advanceOnboarding(current, activeOnboardingStep.id, activeOnboardingStep.actionId))
    }, 650)

    return () => window.clearTimeout(timeoutId)
  }, [activeOnboardingStep, activeScreen, educationState.onboarding.status])

  if (authRequired && (authLoading || !authAllowed || !workspaceHydrated)) {
    return (
      <main className="app" data-theme={selectedTheme}>
        {toastMessage && (
          <div className="toast-region" role="status" aria-live="polite">
            {toastMessage}
          </div>
        )}
        <AuthGate
          allowed={authAllowed}
          loading={authLoading || (authAllowed && !workspaceHydrated)}
          userAvatarUrl={authSession?.photoURL}
          userEmail={authSession?.email}
          userName={authSession?.displayName}
          onContinue={() => setWorkspaceHydrated(true)}
          rupaulMode={rupaulMode}
          onSignIn={signInToSundesk}
          onSignOut={signOutOfSundesk}
        />
      </main>
    )
  }

  return (
    <main className="app" data-theme={selectedTheme}>
      {toastMessage && (
        <div className="toast-region" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
      <OnboardingTour
        canGoBack={activeOnboardingProgress.current > 1}
        progressLabel={activeOnboardingProgress.label}
        status={visibleOnboardingStatus}
        step={activeOnboardingStep}
        onAdvance={advanceOnboardingTourStep}
        onBack={goBackOnboardingTourStep}
        onDismiss={dismissOnboardingTour}
        onSkip={dismissOnboardingTour}
        onStart={startOnboardingTour}
      />
      <aside className={`rail rail-screen-${activeScreen}`}>
        <div className="brand">
          <img src="/brand/sundesk-icon.png" alt="Sundesk logo" />
          <div>
            <strong>Sundesk</strong>
            <span>command center</span>
          </div>
        </div>

        {activeScreen === 'communities' && (
          <section className="rail-context-card" aria-label="Workspace Fyre Festival GTA">
            <strong>Fyre Festival GTA</strong>
            <span>Fake Ontario event data. GTA community shape.</span>
          </section>
        )}

        <nav className="main-nav" aria-label="Sundesk navigation">
          <span>Work</span>
          {mainScreens
            .filter((screen) => screen.group === 'Work')
            .map((screen) => {
              const copyId = getNavCopyId(screen.id)
              const label = copyId ? getCopy(copyId) : screen.label

              return (
                <a
                  aria-current={activeScreen === screen.id ? 'page' : undefined}
                  aria-label={screen.label}
                  className={activeScreen === screen.id ? 'active' : ''}
                  data-copy-plain={screen.label}
                  data-onboarding-target={screen.id === 'lab' ? 'nav-sundesk-lab' : `nav-${screen.id}`}
                  data-short={screen.shortLabel}
                  href={`#${screen.id}`}
                  key={screen.id}
                  title={screen.label}
                >
                  <span>{label}</span>
                </a>
              )
            })}
          <span>System</span>
          {mainScreens
            .filter((screen) => screen.group === 'System')
            .map((screen) => {
              const copyId = getNavCopyId(screen.id)
              const label = copyId ? getCopy(copyId) : screen.label

              return (
                <a
                  aria-current={activeScreen === screen.id ? 'page' : undefined}
                  aria-label={screen.label}
                  className={activeScreen === screen.id ? 'active' : ''}
                  data-copy-plain={screen.label}
                  data-onboarding-target={`nav-${screen.id}`}
                  data-short={screen.shortLabel}
                  href={`#${screen.id}`}
                  key={screen.id}
                  title={screen.label}
                >
                  {label}
                </a>
              )
            })}
        </nav>

        {pinnedGridViews.length > 0 && (
          <section className="pinned-view-nav" aria-label="Pinned Build scans">
            <span>Pinned scans</span>
            {pinnedGridViews.map((view) => (
              <button
                aria-current={activeScreen === 'build' && activeGridViewId === view.id ? 'page' : undefined}
                className={activeScreen === 'build' && activeGridViewId === view.id ? 'active' : ''}
                key={view.id}
                type="button"
                onClick={() => openPinnedGridView(view)}
              >
                <strong>{view.name}</strong>
                <small>{base.tables.find((table) => table.id === view.tableId)?.label || view.tableId}</small>
              </button>
            ))}
          </section>
        )}

        <details className="privacy-card workspace-card" data-testid="rail-workspace-card">
          <summary>
            <span className="privacy-card-summary-copy">
              <span>Workspace</span>
              <strong>Fyre Festival GTA</strong>
            </span>
          </summary>
          <p>{workspaceStatus || 'Fake Ontario event data. GTA community shape.'}</p>
        </details>

        <details className="privacy-card rule-card" data-testid="rail-system-read-card">
          <summary>
            <span className="privacy-card-summary-copy">
              <span>Why here</span>
              <strong>{activeScreenRuleMatches.length} checks here.</strong>
            </span>
          </summary>
          <p>Saved checks explain why work needs attention here.</p>
          {activeScreenRuleMatches.length > 0 && (
            <div className="rule-card-list">
              {activeScreenRuleMatches.slice(0, 3).map((match) => (
                <button key={`${match.rule.id}-${match.record.id}`} type="button" onClick={() => openDailyRecord(match.record)}>
                  <strong>{getRecordTitle(base, match.record)}</strong>
                  <small>{getCommandReason(match.rule)}</small>
                </button>
              ))}
            </div>
          )}
        </details>
      </aside>

      <section className="desk">
        {activeScreen === 'today' && (
          <TodayScreen
            getCommandReason={getCommandReason}
            getCommandTableLabel={getCommandTableLabel}
            getDependencySummary={getDependencySummary}
            getRecordContext={getRecordContext}
            getRecordTitle={(record) => getRecordTitle(base, record)}
            getRecordWorkflowTags={getRecordWorkflowTags}
            getTodayRuleMatchesForRecord={getTodayRuleMatchesForRecord}
            isCommandSendPreviewOpen={isTodayCommandPreviewOpen}
            onOpenDailyRecord={openDailyRecord}
            onToggleCommandSendPreview={() => setIsTodayCommandPreviewOpen((isOpen) => !isOpen)}
            rupaulMode={rupaulMode}
            todayCommandPreview={todayCommandPreview}
            todayFocusRecord={todayFocusRecord}
            todayLanes={todayLanes}
            todayRuleMatches={todayRuleMatches}
          />
        )}

        {activeScreen === 'communities' && (
          <CommunitiesScreen
            addCommunityLink={addCommunityLink}
            atRiskCommunityRecords={atRiskCommunityRecords}
            base={base}
            communityDetailBlockers={communityDetailBlockers}
            communityDetailMeetings={communityDetailMeetings}
            communityDetailNextAction={communityDetailNextAction}
            communityDetailRecord={communityDetailRecord}
            communityDetailRecords={communityDetailRecords}
            communityDetailWaiting={communityDetailWaiting}
            communityLinkableRecords={communityLinkableRecords}
            communityLinkRecordId={communityLinkRecordId}
            communityNewLinkDate={communityNewLinkDate}
            communityNewLinkDateField={communityNewLinkDateField}
            communityNewLinkExtraFields={communityNewLinkExtraFields}
            communityNewLinkExtraValues={communityNewLinkExtraValues}
            communityNewLinkStatus={communityNewLinkStatus}
            communityNewLinkStatusField={communityNewLinkStatusField}
            communityNewLinkTableId={communityNewLinkTableId}
            communityNewLinkTitle={communityNewLinkTitle}
            communityRecords={communityRecords}
            createCommunityLinkedRecord={createCommunityLinkedRecord}
            getCommunityLinkField={getCommunityLinkField}
            getCommunityLinkedRowExtraSummary={getCommunityLinkedRowExtraSummary}
            getPickerRecordMeta={getPickerRecordMeta}
            onOpenCommunitySourceRoute={openCommunitySourceRoute}
            onOpenDailyRecord={openDailyRecord}
            onSelectCommunityDetail={setSelectedCommunityDetailId}
            onUpdateRecordField={updateRecordField}
            removeCommunityLink={removeCommunityLink}
            setCommunityLinkRecordId={setCommunityLinkRecordId}
            setCommunityNewLinkDate={setCommunityNewLinkDate}
            setCommunityNewLinkExtraValues={setCommunityNewLinkExtraValues}
            setCommunityNewLinkStatus={setCommunityNewLinkStatus}
            setCommunityNewLinkTableId={setCommunityNewLinkTableId}
            setCommunityNewLinkTitle={setCommunityNewLinkTitle}
            timelineSourceRecords={timelineSourceRecords}
          />
        )}

        {activeScreen === 'tasks' && (
          <TasksScreen
            base={base}
            getDueDate={(record) => getStringValue(record, 'dueDate')}
            getPriority={(record) => getStringValue(record, 'priority')}
            getStatus={(record) => getStringValue(record, 'status')}
            onCreateTask={() => openCreateRecordForTable('tasks')}
            onOpenRecord={openDailyRecord}
            openTaskRecords={openTaskRecords}
            selectedTask={selectedTask}
            selectedTaskDependencies={selectedTaskDependencies}
          />
        )}

        {activeScreen === 'followups' && (
          <WaitingOnScreen
            base={base}
            followupCommunityField={followupCommunityField}
            followupRecords={followupRecords}
            getFieldDisplayValue={getFieldDisplayValue}
            onCreateFollowup={() => openCreateRecordForTable('followups')}
            onOpenBuild={openBuildScreen}
            onOpenRecord={openDailyRecord}
          />
        )}

        {activeScreen === 'meetings' && (
          <MeetingsScreen
            base={base}
            getFieldDisplayValue={getFieldDisplayValue}
            meetingRecords={meetingRecords}
            meetingTasksField={meetingTasksField}
            nextMeetingLinkedTasks={nextMeetingLinkedTasks}
            nextMeetingPrep={nextMeetingPrep}
            nextMeetingRecord={nextMeetingRecord}
            onCreateMeeting={() => openCreateRecordForTable('meetings')}
            onOpenRecord={openDailyRecord}
            renderMeetingPrep={renderMeetingPrep}
          />
        )}

        <RecordDrawer
          activeScreenIsBuild={activeScreen === 'build'}
          base={base}
          dependencyDraft={dependencyDraft}
          dependencyPickerRecords={dependencyPickerRecords}
          dependencySearch={dependencySearch}
          drawerBacklinks={drawerBacklinks}
          drawerCommunityBlockers={drawerCommunityBlockers}
          drawerCommunityMeetings={drawerCommunityMeetings}
          drawerCommunityNextAction={drawerCommunityNextAction}
          drawerCommunityReadiness={selectedBuildRecord ? getNumberValue(selectedBuildRecord, 'readiness') : 0}
          drawerCommunityWaiting={drawerCommunityWaiting}
          drawerDateText={drawerDateText}
          drawerDependencies={drawerDependencies}
          drawerKeyFields={drawerKeyFields}
          drawerLinkedRecords={drawerLinkedRecords}
          drawerMeetingPrep={drawerMeetingPrep}
          drawerStatusText={drawerStatusText}
          editableFieldsForSelectedTable={editableFieldsForSelectedTable}
          getFieldDisplayValue={getFieldDisplayValue}
          getPickerRecordMeta={getPickerRecordMeta}
          isRecordDrawerOpen={isRecordDrawerOpen}
          onClose={() => setIsRecordDrawerOpen(false)}
          onCreateDependency={createDependency}
          onDeleteDependency={deleteDependency}
          onFlipDependencyDirection={flipDependencyDirection}
          onOpenRecord={openBuildRecord}
          onRenderMeetingPrep={renderMeetingPrep}
          onRenderRecordInput={renderRecordInput}
          onSelectedRecordChange={updateSelectedRecord}
          onSetDependencyDraft={setDependencyDraft}
          onSetDependencySearch={setDependencySearch}
          onUpdateDependency={updateDependency}
          selectedDependencyTargetRecord={selectedDependencyTargetRecord}
          selectedRecord={selectedBuildRecord}
          selectedTableLabel={selectedBuildTable?.label || 'Item'}
        />

        {activeScreen === 'lab' && <section className="connection-zone" id="connections">
          <article className="connection-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Connection core</span>
                <h2>Connections have a home.</h2>
              </div>
              <span className="metric-pill">{materializedLinks.length} links</span>
            </div>
            <div className="connection-grid">
              <article>
                <span>Selected work</span>
                <strong>{selectedTask ? getRecordTitle(base, selectedTask) : 'Work item'}</strong>
                <small>Lookup: community event date is {String(taskCommunityEventDate)}.</small>
              </article>
              <article>
                <span>Outgoing links</span>
                <strong>{selectedTaskLinks.length}</strong>
                <small>Community, approval, and owner are linked-record fields.</small>
              </article>
              <article>
                <span>Related here</span>
                <strong>{selectedTaskBacklinks.length}</strong>
                <small>Risks and meetings can point back without duplicate entry.</small>
              </article>
              <article>
                <span>Blockers</span>
                <strong>{selectedTaskDependencies.length}</strong>
                <small>Blockers explain what is stuck and why.</small>
              </article>
            </div>
          </article>

          <article className="connection-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Universal picker</span>
                <h2>Pick from any area.</h2>
              </div>
            </div>
            <div className="picker-list">
              {recordPickerItems.map((record) => (
                <button key={record.id} type="button" onClick={() => openBuildRecord(record.tableId, record.id)}>
                  <span>{record.tableLabel}</span>
                  <strong>{record.title}</strong>
                  <small>{record.context}</small>
                </button>
              ))}
            </div>
          </article>
        </section>}

        {activeScreen === 'timeline' && (
          <TimelineScreen
            base={base}
            getChipColorClass={getChipColorClass}
            renderTimelineView={renderTimelineView}
            timelineDatedRecordCount={timelineDatedRecords.length}
            timelineDependencyRecordCount={timelineDependencyRecordCount}
            timelineFilter={timelineFilter}
            timelineRecords={timelineRecords}
            timelineRuleReadCount={timelineRuleReadCount}
            timelineStatus={timelineStatus}
            timelineStatusOptions={timelineStatusOptions}
            timelineTableId={timelineTableId}
            timelineTagRouteOptions={timelineTagRouteOptions}
            timelineView={timelineView}
            timelineViewQuestion={timelineViewQuestion}
            onTimelineFilterChange={setTimelineFilter}
            onTimelineStatusChange={setTimelineStatus}
            onTimelineTableChange={setTimelineTableId}
            onTimelineViewChange={setTimelineView}
            onWorkflowTagRouteOpen={openWorkflowTagRoute}
          />
        )}

        {activeScreen === 'lab' && (
          <SundeskLabScreen
            educationState={educationState}
            modules={sundeskLabModules}
            onApplyAction={applyLabAction}
            onCompleteStep={completeLabModuleStep}
            onContinueModule={continueLabModule}
            onResetLabProgress={resetLabProgress}
            onStartModuleOver={startLabModuleOver}
            rupaulMode={rupaulMode}
          />
        )}

        {activeScreen === 'build' && (
        <section className="build-zone build-reset" data-testid="build-screen" id="build">
          <article className="builder-panel wide build-workbench">
            <div className="panel-title build-title-row">
              <div>
                <span className="eyebrow">Build</span>
                <h2>{selectedBuildTable?.label || 'Tables'}</h2>
              </div>
              <details
                className="build-options-menu build-table-menu"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.currentTarget.open = false
                  }
                }}
              >
                <summary>Table</summary>
                <div>
                  {activeGridView && (
                    <button type="button" onClick={() => showToast(`${activeGridView.name} is active.`)}>
                      {activeGridViewChanged ? 'View changed' : activeGridView.name}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.currentTarget.closest('details')?.removeAttribute('open')
                      showToast('Click a cell, then paste from a sheet.')
                    }}
                  >
                    Paste help
                  </button>
                  <button
                    aria-label="Save view"
                    data-copy-plain="Save view"
                    data-onboarding-target="build-save-view"
                    title="Save view"
                    type="button"
                    onClick={(event) => {
                      event.currentTarget.closest('details')?.removeAttribute('open')
                      saveGridView()
                    }}
                  >
                    Save view
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.currentTarget.closest('details')?.removeAttribute('open')
                      showToast('Tags live in cells and filters.')
                    }}
                  >
                    Tags
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.currentTarget.closest('details')?.removeAttribute('open')
                      showToast('Links connect rows across tables.')
                    }}
                  >
                    Connections
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.currentTarget.closest('details')?.removeAttribute('open')
                      openTableSettings()
                    }}
                  >
                    Rename table
                  </button>
                  <button
                    className="danger"
                    disabled={!canDeleteSelectedBuildTable}
                    type="button"
                    onClick={(event) => {
                      event.currentTarget.closest('details')?.removeAttribute('open')
                      requestDeleteTable()
                    }}
                  >
                    Delete table
                  </button>
                  <button
                    className="danger"
                    type="button"
                    onClick={(event) => {
                      event.currentTarget.closest('details')?.removeAttribute('open')
                      setBuildModal('resetLocalData')
                    }}
                  >
                    Reset local data
                  </button>
                </div>
              </details>
            </div>
            <div className="build-table-row">
              <div className="table-tabs" data-onboarding-target="build-table-tabs" role="tablist" aria-label="Tables">
                {buildTableRows.map((table) => (
                  <button
                    aria-selected={table.id === selectedBuildTable?.id}
                    className={table.id === selectedBuildTable?.id ? 'selected' : ''}
                    data-onboarding-target={table.id === selectedBuildTable?.id ? 'build-active-table' : undefined}
                    data-testid={`build-table-${table.id}`}
                    key={table.id}
                    role="tab"
                    type="button"
                    onClick={() => selectBuildTable(table.id)}
                  >
                    <strong>{table.label}</strong>
                    <span>{table.recordCount}</span>
                  </button>
                ))}
                <button
                  className="add-table-tab"
                  aria-label="Add table"
                  data-copy-plain="Add table"
                  data-onboarding-target="build-add-table"
                  title="Add table"
                  type="button"
                  onClick={() => setBuildModal('table')}
                >
                  + Add table
                </button>
              </div>
            </div>
            <BuildPasteHelper
              applyPasteAction={applyPasteAction}
              buildPasteReceipt={buildPasteReceipt}
              buildPasteSummary={buildPasteSummary}
            />
            {gridFilter && (
              <div className="tag-route-strip active-filter-strip" aria-label="Active Build filter" data-onboarding-target="tag-route-controls">
                <span>Showing</span>
                <button
                  aria-pressed="true"
                  className={`select-tag ${getChipColorClass(gridFilter)} selected`}
                  data-onboarding-target="tag-route-chip"
                  type="button"
                  onClick={() => setGridFilter('')}
                >
                  {gridFilter}
                </button>
                <button type="button" onClick={() => setGridFilter('')}>Clear</button>
              </div>
            )}
            {migrationMessages.length > 0 && (
              <div className="local-state-strip migration-strip">
                <span>Migration</span>
                <strong>{migrationMessages.join(' ')}</strong>
              </div>
            )}
            <BuildGrid
              columnWidths={columnWidths}
              getGridRowColorClass={getGridRowColorClass}
              groupField={groupField}
              groupedRecords={groupedRecords}
              gridDensity={gridDensity}
              isGridCellSelected={(cell) => isSameGridCell(selectedGridCell, cell)}
              addFieldMenu={renderAddFieldMenu()}
              onAddField={openAddFieldMenu}
              onCreateRecord={createBlankGridRow}
              onDeleteRecord={deleteRecord}
              onPaste={handleBuildGridPaste}
              onSelectRecord={setSelectedBuildRecordId}
              renderEditableGridCell={renderEditableGridCell}
              renderGridHeader={renderGridHeader}
              rupaulMode={rupaulMode}
              selectedRecordId={selectedBuildRecord?.id}
              sortedAndFilteredRecordCount={sortedAndFilteredRecords.length}
              visibleFieldsForGrid={visibleFieldsForGrid}
            />
          </article>

          <BuildModals
            base={base}
            buildModal={buildModal}
            checkboxColorOptions={checkboxColorOptions}
            checkboxIconOptions={checkboxIconOptions}
            closeBuildModal={closeBuildModal}
            createField={createField}
            createTable={createTable}
            deleteField={deleteField}
            deleteTable={deleteTable}
            effectiveSourceLinkedFieldId={effectiveSourceLinkedFieldId}
            fieldBehaviorOptions={fieldBehaviorOptions}
            fieldDraft={fieldDraft}
            fieldTypeOptions={fieldTypeOptions}
            linkedFieldsForSelectedTable={linkedFieldsForSelectedTable}
            optionFieldTypes={optionFieldTypes}
            parseOptions={parseOptions}
            pendingDeleteField={pendingDeleteField}
            pendingDeleteTable={pendingDeleteTable}
            renameTable={renameTable}
            renderCheckboxIcon={renderCheckboxIcon}
            resetLocalWorkbase={resetLocalWorkbase}
            rupaulMode={rupaulMode}
            selectedBuildTable={selectedBuildTable}
            setFieldDraft={setFieldDraft}
            setTableDraft={setTableDraft}
            setTableSettingsDraft={setTableSettingsDraft}
            settingsField={settingsField}
            sourceFields={sourceFields}
            tableDraft={tableDraft}
            tableSettingsDraft={tableSettingsDraft}
            updateField={updateField}
          />

        </section>
        )}

        {activeScreen === 'settings' && (
          <SettingsScreen
            authAllowed={authAllowed}
            authRequired={authRequired}
            authUserEmail={authSession?.email}
            firebaseSetupState={firebaseSetupState}
            firestoreReadShadowComparison={firestoreReadShadowComparison}
            firestoreReadShadowState={firestoreReadShadowState}
            firestoreWriteGateState={firestoreWriteGateState}
            launchReadinessItems={launchReadinessSummary.items}
            localEngineStats={localEngineStats}
            localRules={localRules}
            migrationMessages={migrationMessages}
            onExportBackup={exportLocalBackup}
            onImportBackup={applyLocalBackupFile}
            onOpenLabModule={continueLabModule}
            onRestartTour={restartOnboardingTour}
            onRupaulModeChange={updateRupaulMode}
            openScreen={openScreen}
            rupaulMode={rupaulMode}
            ruleDestinationStats={ruleDestinationStats}
            selectedTheme={selectedTheme}
            themes={themes}
            workspaceHydrated={workspaceHydrated}
            workspaceStatus={workspaceStatus}
            onThemeChange={setSelectedTheme}
          />
        )}
        {renderRecordModal()}
      </section>
    </main>
  )
}

export default App
