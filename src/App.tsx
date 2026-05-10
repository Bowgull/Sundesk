import './App.css'
import './styles/themes.css'
import { useEffect, useState, type ClipboardEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { mainScreens, themes, type AppScreen, type ThemeId, type TimelineView } from './appConfig'
import { BuildGrid } from './components/BuildGrid'
import { BuildGridCell } from './components/BuildGridCell'
import { BuildGridHeader } from './components/BuildGridHeader'
import { BuildModals } from './components/BuildModals'
import { BuildPasteHelper } from './components/BuildPasteHelper'
import { BuildRulesPanel } from './components/BuildRulesPanel'
import { BuildToolbar } from './components/BuildToolbar'
import { BuildViewsPanel } from './components/BuildViewsPanel'
import { CommunitiesScreen } from './components/CommunitiesScreen'
import { MeetingPrepPanel } from './components/MeetingPrepPanel'
import { MeetingsScreen } from './components/MeetingsScreen'
import { RecordFieldInput } from './components/RecordFieldInput'
import { RecordDrawer } from './components/RecordDrawer'
import { SettingsScreen } from './components/SettingsScreen'
import { TasksScreen } from './components/TasksScreen'
import { TimelineScreen } from './components/TimelineScreen'
import { TodayScreen } from './components/TodayScreen'
import { WaitingOnScreen } from './components/WaitingOnScreen'
import {
  savedViews,
} from './data/demoData'
import {
  type DependencyRelationship,
  getDependencySummary as getDependencySummaryForBase,
  getUniqueDependencyId,
  hasDuplicateDependency,
} from './data/dependencies'
import {
  compareFirestoreReadShadowCounts,
  createFirestoreReadShadowReader,
  getFirestoreReadShadowState,
  getFirestoreWriteGateState,
  loadFirestoreReadShadow,
  type FirestoreReadShadowState,
} from './data/firestoreReadShadow'
import {
  type LocalGridView,
  type StoredBuildViewState,
  type StoredMigrationReport,
  type StoredWorkbaseState,
  buildViewStateStorageKey,
  cloneWorkbase,
  computedFieldTypes,
  defaultVisibleFieldIdsByTable,
  getDefaultVisibleFieldIds,
  getEmptyFieldValue,
  getEmptyRecordValues,
  readStoredBuildViewState,
  readStoredRules,
  readStoredWorkbase,
  rulesStorageKey,
  storedMigrationReport,
  workbaseStorageKey,
} from './data/localStorage'
import { getFirebaseServices } from './lib/firebase'
import {
  type LocalRule,
  getFieldDisplayValue as getRecordFieldDisplayValue,
  getFirstDateValue,
  getNumberValue,
  getRuleMatchCount as getRuleMatchCountForBase,
  getRuleMatchedRecords as getRuleMatchedRecordsForBase,
  getRuleOperatorOptionsForField,
  getRulePreview as getRulePreviewForBase,
  getRuleValidationMessages as getRuleValidationMessagesForBase,
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
  getDailyTimelineRecords,
  getDependencyPickerRecords,
  getLocalEngineStats,
  getMeetingAgendaText,
  getMeetingPrep,
  getMeetingWeeklyNoteText,
  getRuleDestinationStats,
  getRuleMatchesForDestination,
  getScreenStats,
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
  { label: 'Linked record', value: 'linkedRecord' },
  { label: 'Lookup', value: 'lookup' },
  { label: 'Rollup', value: 'rollup' },
  { label: 'Count', value: 'count' },
  { label: 'System formula', value: 'systemFormula' },
  { label: 'Created time', value: 'createdTime' },
  { label: 'Last updated time', value: 'lastUpdatedTime' },
]

const fieldBehaviorOptions: { label: string; value: FieldType; description: string }[] = [
  { label: 'Write notes', value: 'longText', description: 'Open text for context, decisions, and internal notes.' },
  { label: 'Track status', value: 'status', description: 'A short workflow state that can surface work in Today.' },
  { label: 'Add tags', value: 'multiSelect', description: 'Reusable marks for grouping, routing, and filtering.' },
  { label: 'Set a date', value: 'date', description: 'A deadline or event date the command center can watch.' },
  { label: 'Link rows', value: 'linkedRecord', description: 'Connect this row to a community, person, meeting, or other table.' },
  { label: 'Read from links', value: 'lookup', description: 'Show a value from a linked record without retyping it.' },
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
        <path d="M5 21V4.2c0-.55.45-1 1-1h11.2c.48 0 .9.34.99.81l.92 4.78a1 1 0 0 1-.98 1.19H7v7.02h10.2c.48 0 .9.34.99.81l.92 4.78a1 1 0 0 1-.98 1.19H6a1 1 0 0 1-1-1Z" />
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
  const [initialBuildViewState] = useState(() => readStoredBuildViewState())
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
  const [expandedRuleId, setExpandedRuleId] = useState('')
  const [initialMigrationReport] = useState<StoredMigrationReport>(() => ({ ...storedMigrationReport }))
  const [todayDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [selectedBuildTableId, setSelectedBuildTableId] = useState(
    () => initialBuildViewState.selectedBuildTableId || 'risks',
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
  const [selectedBuildRecordId, setSelectedBuildRecordId] = useState('risk_venue_halifax')
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
  const [gridGroupFieldId, setGridGroupFieldId] = useState(() => initialBuildViewState.gridGroupFieldId || 'level')
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
  const [buildPasteCellCount, setBuildPasteCellCount] = useState(0)
  const [buildPasteSummary, setBuildPasteSummary] = useState<BuildPasteSummary | null>(null)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () => initialBuildViewState.columnWidths || {},
  )
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
  const [firestoreReadShadowState, setFirestoreReadShadowState] = useState<FirestoreReadShadowState>(() => getFirestoreReadShadowState())
  const selectedTask = getRecord(base, 'task_coi_halifax')
  const selectedTaskLinks = getLinkedRecordsForRecord(base, 'task_coi_halifax')
  const selectedTaskBacklinks = getBacklinksForRecord(base, 'task_coi_halifax')
  const selectedTaskDependencies = getDependencyReferencesForRecord(base, 'task_coi_halifax')
  const recordPickerItems = getRecordReferences(base).slice(0, 8)
  const materializedLinks = getMaterializedLinks(base)
  const taskCommunityEventDate = getLookupPreview(base, 'task_coi_halifax', 'communityEventDate')
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
  const dailyTimelineRecords = getDailyTimelineRecords(base)
  const timelineSourceRecords = getTimelineSourceRecords(base)
  const timelineStatusOptions = getTimelineStatusOptions(timelineSourceRecords)
  const timelineRecords = getTimelineRecords(base, timelineSourceRecords, timelineTableId, timelineStatus, timelineFilter)
  const todayRuleMatches = getRuleMatchesForDestination(base, localRules, 'today', todayDate)
  const timelineRuleMatches = getRuleMatchesForDestination(base, localRules, 'timeline', todayDate)
  const timelineDatedRecords = timelineRecords.filter((record) => getFirstDateValue(record))
  const timelineDependencyRecordCount = timelineRecords.filter((record) => getDependencySummary(record.id).length > 0).length
  const timelineRuleReadCount = timelineRecords.filter((record) => getTimelineRuleMatchesForRecord(record.id).length > 0).length
  const timelineViewQuestion = {
    grid: 'Which rows need a clean read.',
    kanban: 'Where is the work stuck.',
    calendar: 'Which dates are carrying pressure.',
    timeline: 'Which places are ready before event day.',
    graph: 'Why is this place at risk.',
  }[timelineView]
  const todayLanes = getTodayLanes(base, todayRuleMatches)
  const todayNowLane = todayLanes.find((lane) => lane.id === 'now')
  const todayWaitingLane = todayLanes.find((lane) => lane.id === 'waiting')
  const todayNextLane = todayLanes.find((lane) => lane.id === 'next')
  const todayChangedRecords = Array.from(new Map(todayRuleMatches.map((match) => [match.record.id, match.record])).values())
  const todaySlipRecord = todayNowLane?.records[0]
  const todayChangedRecord = todayChangedRecords[0]
  const todayFocusRecord = todaySlipRecord || todayWaitingLane?.records[0] || todayNextLane?.records[0] || todayChangedRecord
  const screenStats = getScreenStats(base)
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
  const tagRouteOptions = Array.from(
    new Set(
      recordsForSelectedTable.flatMap((record) =>
        fieldsForSelectedTable.flatMap((field) => {
          const value = record.values[field.id]

          return field.type === 'multiSelect' && Array.isArray(value) ? value.map(String) : []
        }),
      ),
    ),
  )
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
  const localEngineStats = getLocalEngineStats(base, localRules, localGridViews)
  const firestoreReadShadowComparison = compareFirestoreReadShadowCounts(localEngineStats, firestoreReadShadowState.collections)
  const ruleDestinationStats = getRuleDestinationStats(base, localRules, todayDate)

  function writeWorkbaseState(nextBase: StoredWorkbaseState['base']) {
    const workbaseState: StoredWorkbaseState = {
      version: 1,
      base: nextBase,
    }

    localStorage.setItem(workbaseStorageKey, JSON.stringify(workbaseState))
  }

  function writeBuildViewState(updates: Partial<StoredBuildViewState> = {}) {
    const buildViewState: StoredBuildViewState = {
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

    localStorage.setItem(buildViewStateStorageKey, JSON.stringify(buildViewState))
  }

  function writeRulesState(nextRules: LocalRule[]) {
    localStorage.setItem(rulesStorageKey, JSON.stringify(nextRules))
  }

  function showToast(message: string) {
    setToastMessage(message)
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
    const fileName = `${toSlug(getRecordTitle(base, prep.meeting))}-computed-agenda.md`
    const blob = new Blob([getMeetingAgendaText(base, prep)], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast('Agenda exported.')
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
    const fileName = `${toSlug(getRecordTitle(base, prep.meeting))}-weekly-note.md`
    const blob = new Blob([getStringValue(prep.meeting, 'weeklyNote') || getMeetingWeeklyNoteText(base, prep)], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast('Weekly note exported.')
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
    setGridGroupFieldId(base.fields.find((field) => field.tableId === nextBuildTable.id && field.id === 'status')?.id || '')
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
      gridGroupFieldId: base.fields.find((field) => field.tableId === nextBuildTable.id && field.id === 'status')?.id || '',
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
    if (!computedFieldTypes.includes(field.type)) {
      const nextVisibleFieldIds = [...(visibleFieldIdsByTable[tableId] || getDefaultVisibleFieldIds(fieldsForSelectedTable)), field.id]

      setRecordDraft((current) => ({
        ...current,
        [field.id]: getEmptyFieldValue(field.type),
      }))
      setVisibleFieldIdsByTable((current) => ({
        ...current,
        [tableId]: nextVisibleFieldIds,
      }))
      writeBuildViewState({
        visibleFieldIdsByTable: { ...visibleFieldIdsByTable, [tableId]: nextVisibleFieldIds },
      })
    }
    setFieldDraft((current) => ({ ...current, label: '' }))
    showToast('Field added.')
    closeBuildModal()
  }

  function updateField(fieldId: string, updates: Partial<FieldDefinition>) {
    const tableId = selectedBuildTable?.id

    if (!tableId) {
      return
    }

    setBase((current) => {
      const nextBase = {
        ...current,
        fields: current.fields.map((field) =>
          field.tableId === tableId && field.id === fieldId ? { ...field, ...updates } : field,
        ),
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })
  }

  function openFieldSettings(field: FieldDefinition) {
    setSelectedFieldSettingsId(field.id)
    setOpenFieldMenuId('')
    setBuildModal('fieldSettings')
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
    setGridGroupFieldId(base.fields.find((field) => field.tableId === tableId && field.id === 'status')?.id || '')
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
    setGridGroupFieldId(base.fields.find((field) => field.tableId === tableId && field.id === 'status')?.id || '')
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

  function updateGridView(viewId: string) {
    if (!selectedBuildTable) {
      return
    }

    const nextGridViews = localGridViews.map((view) =>
      view.id === viewId
        ? {
            ...view,
            tableId: selectedBuildTable.id,
            filter: gridFilter,
            sortFieldId: gridSortFieldId,
            sortDirection: gridSortDirection,
            groupFieldId: gridGroupFieldId,
            colorFieldId: gridColorFieldId,
            density: gridDensity,
            visibleFieldIds,
          }
        : view,
    )

    setLocalGridViews((current) =>
      current.map((view) =>
        view.id === viewId
          ? {
              ...view,
              tableId: selectedBuildTable.id,
              filter: gridFilter,
              sortFieldId: gridSortFieldId,
              sortDirection: gridSortDirection,
              groupFieldId: gridGroupFieldId,
              colorFieldId: gridColorFieldId,
              density: gridDensity,
              visibleFieldIds,
            }
          : view,
      ),
    )
    setActiveGridViewId(viewId)
    writeBuildViewState({
      localGridViews: nextGridViews,
      activeGridViewId: viewId,
    })
    showToast('View updated.')
  }

  function togglePinnedGridView(viewId: string) {
    const nextGridViews = localGridViews.map((view) => (view.id === viewId ? { ...view, pinned: !view.pinned } : view))

    setLocalGridViews((current) =>
      current.map((view) => (view.id === viewId ? { ...view, pinned: !view.pinned } : view)),
    )
    writeBuildViewState({ localGridViews: nextGridViews })
  }

  function duplicateGridView(view: LocalGridView) {
    const copyCount = localGridViews.filter((gridView) => gridView.name.startsWith(`${view.name} copy`)).length + 1
    const copyId = getUniqueSlug(
      `${view.id}_copy_${copyCount}`,
      localGridViews.map((gridView) => gridView.id),
    )
    const copy: LocalGridView = {
      ...view,
      id: copyId,
      name: `${view.name} copy ${copyCount}`,
      pinned: false,
      visibleFieldIds: [...view.visibleFieldIds],
    }

    setLocalGridViews((current) => [copy, ...current])
    setViewRenameDrafts((current) => ({ ...current, [copy.id]: copy.name }))
    applyGridView(copy, {
      localGridViews: [copy, ...localGridViews],
      viewRenameDrafts: { ...viewRenameDrafts, [copy.id]: copy.name },
    })
  }

  function resetActiveGridView() {
    if (!activeGridView) {
      return
    }

    applyGridView(activeGridView)
  }

  function renameGridView(viewId: string) {
    const nextName = viewRenameDrafts[viewId]?.trim()

    if (!nextName) {
      return
    }

    setLocalGridViews((current) =>
      current.map((view) => (view.id === viewId ? { ...view, name: nextName } : view)),
    )
    writeBuildViewState({
      localGridViews: localGridViews.map((view) => (view.id === viewId ? { ...view, name: nextName } : view)),
    })
    showToast('View renamed.')
  }

  function deleteGridView(viewId: string) {
    const nextGridViews = localGridViews.filter((view) => view.id !== viewId)
    const nextDrafts = { ...viewRenameDrafts }

    delete nextDrafts[viewId]
    setLocalGridViews((current) => current.filter((view) => view.id !== viewId))
    if (activeGridViewId === viewId) {
      setActiveGridViewId('')
    }
    setViewRenameDrafts((current) => {
      const nextDrafts = { ...current }
      delete nextDrafts[viewId]

      return nextDrafts
    })
    writeBuildViewState({
      localGridViews: nextGridViews,
      viewRenameDrafts: nextDrafts,
      activeGridViewId: activeGridViewId === viewId ? '' : activeGridViewId,
    })
    showToast('View deleted.')
  }

  function updateViewRenameDraft(viewId: string, value: string) {
    setViewRenameDrafts((current) => ({ ...current, [viewId]: value }))
  }

  function createLocalRule() {
    setLocalRules((current) => {
      const rule: LocalRule = {
        id: `rule_${current.length + 1}_${selectedBuildTable?.id || 'tasks'}`,
        tableId: selectedBuildTable?.id || 'tasks',
        fieldId: fieldsForSelectedTable[0]?.id || 'title',
        operator: 'is',
        value: '',
        action: 'showInScreen',
        destination: 'today',
      }
      const nextRules = [rule, ...current]

      writeRulesState(nextRules)
      setExpandedRuleId(rule.id)

      return nextRules
    })
  }

  function updateLocalRule(ruleId: string, updates: Partial<LocalRule>) {
    setLocalRules((current) => {
      const nextRules = current.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule))

      writeRulesState(nextRules)

      return nextRules
    })
  }

  function updateLocalRuleField(ruleId: string, tableId: string, fieldId: string) {
    const field = base.fields.find((fieldItem) => fieldItem.tableId === tableId && fieldItem.id === fieldId)

    setLocalRules((current) => {
      const nextRules = current.map((rule) => {
        if (rule.id !== ruleId) {
          return rule
        }

        const operatorOptions = getRuleOperatorOptionsForField(field)
        const operator = operatorOptions.some((option) => option.value === rule.operator)
          ? rule.operator
          : operatorOptions[0]?.value || 'is'

        return {
          ...rule,
          tableId,
          fieldId,
          operator,
          value: '',
        }
      })

      writeRulesState(nextRules)

      return nextRules
    })
  }

  function deleteLocalRule(ruleId: string) {
    setLocalRules((current) => {
      const nextRules = current.filter((rule) => rule.id !== ruleId)

      writeRulesState(nextRules)
      setExpandedRuleId((currentRuleId) => currentRuleId === ruleId ? '' : currentRuleId)

      return nextRules
    })
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

  function getRulePreview(rule: LocalRule) {
    return getRulePreviewForBase(base, rule)
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

  function getRuleValidationMessages(rule: LocalRule) {
    return getRuleValidationMessagesForBase(base, rule)
  }

  function getRuleMatchCount(rule: LocalRule) {
    return getRuleMatchCountForBase(base, rule, todayDate)
  }

  function getRuleMatchedRecords(rule: LocalRule) {
    return getRuleMatchedRecordsForBase(base, rule, todayDate)
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
    const nextTableId = 'risks'

    localStorage.removeItem(workbaseStorageKey)
    setBase(nextBase)
    setSelectedBuildTableId(nextTableId)
    setSelectedBuildRecordId(getRecordsForTable(nextBase, nextTableId)[0]?.id || '')
    setRecordDraft(getEmptyRecordValues(nextBase, nextTableId))
    setGridFilter('')
    setGridSortFieldId('title')
    setGridGroupFieldId('level')
    setActiveGridViewId('')
    setBuildModal('')
  }

  function coercePastedCellValue(field: FieldDefinition, value: string): RecordValue {
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

    if (field.type === 'linkedRecord') {
      const linkedRecords = field.linkedTableId ? getRecordsForTable(base, field.linkedTableId) : []
      const matchedRecord = linkedRecords.find((record) => getRecordTitle(base, record).toLowerCase() === trimmedValue.toLowerCase())

      return matchedRecord ? [matchedRecord.id] : []
    }

    if (['number', 'currency', 'percent', 'rating'].includes(field.type)) {
      const numericValue = Number(trimmedValue.replace(/[$,%]/g, ''))

      return Number.isFinite(numericValue) ? numericValue : 0
    }

    return trimmedValue
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
      return `${field.label} reads as linked rows.`
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
    const rows = pastedText
      .split(/\r?\n/)
      .map((row) => row.split('\t'))
      .filter((row) => row.some((cell) => cell.trim()))

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
        records: nextRecords,
      }

      writeWorkbaseState(nextBase)

      return nextBase
    })

    const pastedCellCount = rows.reduce((count, row) => count + row.length, 0)

    setBuildPasteCellCount(pastedCellCount)
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

  function openCreateRecordModal() {
    if (!selectedBuildTable) {
      return
    }

    setRecordDraft(getEmptyRecordValues(base, selectedBuildTable.id))
    setIsCreatingRecord(true)
    setBuildModal('record')
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
    setGridGroupFieldId(base.fields.find((field) => field.tableId === tableId && field.id === 'status')?.id || '')
    setActiveGridViewId('')
    setRecordDraft(getEmptyRecordValues(base, tableId))
    setIsCreatingRecord(true)
    setBuildModal('record')
  }

  function openEditRecordModal(recordId: string) {
    setSelectedBuildRecordId(recordId)
    setIsCreatingRecord(false)
    setBuildModal('')
    setIsRecordDrawerOpen(true)
    window.setTimeout(() => {
      document.getElementById('record')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }, 0)
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
    showToast('Linked row added.')
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
        isPrimaryField={selectedBuildTable?.primaryFieldId === field.id}
        menuKey={menuKey}
        openFieldMenuId={openFieldMenuId}
        onDuplicateField={duplicateField}
        onGroupGridByField={groupGridByField}
        onOpenFieldMenuIdChange={setOpenFieldMenuId}
        onOpenFieldSettings={openFieldSettings}
        onRequestDeleteField={requestDeleteField}
        onResizeColumn={resizeColumn}
        onSortGridByField={sortGridByField}
        onToggleVisibleField={toggleVisibleField}
      />
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
    showToast(`Meeting source opened: ${getRecordTitle(base, record)}.`)
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
    if (timelineView === 'kanban') {
      const groups = ['Blocked', 'Waiting', 'In progress', 'Done']
      const nextStatusByGroup: Record<string, string> = {
        Blocked: 'Waiting',
        Waiting: 'In progress',
        'In progress': 'Done',
      }

      return (
        <div className="timeline-kanban" data-testid="timeline-kanban">
          {groups.map((status) => {
            const records = timelineRecords.filter((record) => {
              const recordStatus = getStringValue(record, 'status') || getStringValue(record, 'level') || getStringValue(record, 'priority')

              return status === 'Done' ? recordStatus === 'Done' || recordStatus === 'Received' : recordStatus === status
            })

            return (
              <section aria-label={`${status} lane`} className="kanban-column" key={status}>
                <div>
                  <strong>{status}</strong>
                  <span>{records.length}</span>
                </div>
                {records.map((record) => {
                  const nextStatus = nextStatusByGroup[status]
                  const statusField = base.fields.find((field) =>
                    field.tableId === record.tableId &&
                    field.id === 'status' &&
                    (field.type === 'status' || field.type === 'singleSelect') &&
                    field.options?.includes(nextStatus),
                  )

                  return (
                    <article className="kanban-card" key={record.id}>
                      <button type="button" onClick={() => openDailyRecord(record)}>
                        <strong>{getRecordTitle(base, record)}</strong>
                        <small>{getRecordContext(record)}</small>
                        <span>{getFirstDateValue(record) || 'No date'}</span>
                      </button>
                      {statusField && nextStatus && (
                        <button
                          className="kanban-card-action"
                          type="button"
                          onClick={() => {
                            updateRecordField(record.id, statusField.id, nextStatus)
                            showToast(`${getRecordTitle(base, record)} moved to ${nextStatus}.`)
                          }}
                        >
                          Move to {nextStatus}
                        </button>
                      )}
                    </article>
                  )
                })}
              </section>
            )
          })}
        </div>
      )
    }

    if (timelineView === 'calendar') {
      const datedRecords = timelineRecords.filter((record) => getFirstDateValue(record))
      const dateGroups = Array.from(
        datedRecords.reduce((groups, record) => {
          const date = getFirstDateValue(record)

          if (!date) {
            return groups
          }

          groups.set(date, [...(groups.get(date) || []), record])

          return groups
        }, new Map<string, BaseRecord[]>()),
      ).sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
      const selectedDate = dateGroups.some(([date]) => date === timelineCalendarDate)
        ? timelineCalendarDate
        : dateGroups[0]?.[0] || ''
      const selectedDateRecords = dateGroups.find(([date]) => date === selectedDate)?.[1] || []

      return (
        <div className="calendar-mode" data-testid="timeline-calendar">
          <div className="calendar-date-strip" aria-label="Calendar date focus">
            <span>Date focus</span>
            <div>
              {dateGroups.slice(0, 10).map(([date, records]) => (
                <button
                  className={date === selectedDate ? 'selected' : ''}
                  key={date}
                  type="button"
                  onClick={() => setTimelineCalendarDate(date)}
                >
                  <strong>{date}</strong>
                  <small>{records.length}</small>
                </button>
              ))}
            </div>
          </div>
          {selectedDate && (
            <section className="calendar-day-detail" aria-label="Calendar day detail">
              <div>
                <span>Selected day</span>
                <strong>{selectedDate}</strong>
              </div>
              <div>
                {selectedDateRecords.map((record) => (
                  <button key={record.id} type="button" onClick={() => openDailyRecord(record)}>
                    <strong>{getRecordTitle(base, record)}</strong>
                    <small>{getRecordContext(record)}</small>
                  </button>
                ))}
              </div>
            </section>
          )}
          <div className="calendar-board">
            {datedRecords.slice(0, 14).map((record) => (
              <button key={record.id} type="button" onClick={() => openDailyRecord(record)}>
                <span>{getFirstDateValue(record)}</span>
                <strong>{getRecordTitle(base, record)}</strong>
                <small>{getRecordContext(record)}</small>
              </button>
            ))}
            {datedRecords.length === 0 && <p className="empty-note">No dated records match. Clear the filters.</p>}
          </div>
        </div>
      )
    }

    if (timelineView === 'timeline') {
      const selectedCommunity = communityRecords.find((community) => community.id === timelineReadinessCommunityId) || communityRecords[0]
      const selectedCommunityRecords = selectedCommunity
        ? timelineRecords.filter((record) =>
            base.fields.some((field) => {
              const value = record.values[field.id]

              return field.type === 'linkedRecord' && Array.isArray(value) && value.includes(selectedCommunity.id)
            }),
          )
        : []

      return (
        <div className="readiness-timeline" data-testid="timeline-readiness">
          {selectedCommunity && (
            <section className="readiness-focus-panel" aria-label="Readiness place focus">
              <div>
                <span>Place focus</span>
                <strong>{getRecordTitle(base, selectedCommunity)}</strong>
                <small>{getNumberValue(selectedCommunity, 'readiness')}% ready</small>
              </div>
              <div className="readiness-focus-options">
                {communityRecords.map((community) => (
                  <button
                    className={community.id === selectedCommunity.id ? 'selected' : ''}
                    key={community.id}
                    type="button"
                    onClick={() => setTimelineReadinessCommunityId(community.id)}
                  >
                    {getRecordTitle(base, community)}
                  </button>
                ))}
              </div>
              <div className="readiness-focus-records" aria-label="Focused readiness rows">
                {selectedCommunityRecords.slice(0, 5).map((record) => (
                  <button key={record.id} type="button" onClick={() => openDailyRecord(record)}>
                    <strong>{getRecordTitle(base, record)}</strong>
                    <small>{getRecordContext(record)}</small>
                  </button>
                ))}
                {selectedCommunityRecords.length === 0 && <p className="empty-note">No linked rows match the current filters.</p>}
              </div>
            </section>
          )}
          {communityRecords.map((community) => {
            const communityTitle = getRecordTitle(base, community)
            const linkedRecords = timelineRecords.filter((record) =>
              base.fields.some((field) => {
                const value = record.values[field.id]

                return field.type === 'linkedRecord' && Array.isArray(value) && value.includes(community.id)
              }),
            )

            return (
              <section key={community.id}>
                <div>
                  <strong>{communityTitle}</strong>
                  <span>{getNumberValue(community, 'readiness')}% ready</span>
                </div>
                <div className="readiness-track">
                  {linkedRecords.slice(0, 5).map((record) => (
                    <button key={record.id} type="button" onClick={() => openDailyRecord(record)}>
                      <span>{getRecordTitle(base, record)}</span>
                    </button>
                  ))}
                  <i>Event</i>
                </div>
              </section>
            )
          })}
        </div>
      )
    }

    if (timelineView === 'graph') {
      const selectedCommunity = communityRecords.find((community) => community.id === timelineGraphCommunityId) || communityRecords[0]
      const relatedRecords = selectedCommunity
        ? timelineRecords.filter((record) =>
            base.fields.some((field) => {
              const value = record.values[field.id]

              return field.type === 'linkedRecord' && Array.isArray(value) && value.includes(selectedCommunity.id)
            }),
          )
        : []

      return (
        <div className="risk-graph-shell" data-testid="timeline-graph">
          {selectedCommunity ? (
            <>
              <div className="graph-focus-strip" aria-label="Graph place focus">
                <span>Place focus</span>
                <div>
                  {communityRecords.map((community) => (
                    <button
                      className={community.id === selectedCommunity.id ? 'selected' : ''}
                      key={community.id}
                      type="button"
                      onClick={() => setTimelineGraphCommunityId(community.id)}
                    >
                      {getRecordTitle(base, community)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="risk-graph">
                <button className="graph-node center" type="button" onClick={() => openDailyRecord(selectedCommunity)}>
                  <strong>{getRecordTitle(base, selectedCommunity)}</strong>
                  <span>{getNumberValue(selectedCommunity, 'readiness')}% ready</span>
                </button>
                <div className="graph-spokes">
                  {relatedRecords.slice(0, 5).map((record) => (
                    <button className={`graph-node ${getSemanticChipClass(getRecordContext(record))}`} key={record.id} type="button" onClick={() => openDailyRecord(record)}>
                      <strong>{getRecordTitle(base, record)}</strong>
                      <span>{getRecordContext(record)}</span>
                    </button>
                  ))}
                  {relatedRecords.length === 0 && <p className="empty-note">No linked records match the current filters.</p>}
                </div>
              </div>
            </>
          ) : (
            <p className="empty-note">No community records are available.</p>
          )}
        </div>
      )
    }

    return (
      <div className="timeline-list" data-testid="timeline-list">
        {timelineRecords.map((record) => {
          const table = base.tables.find((tableItem) => tableItem.id === record.tableId)
          const recordStatus = getStringValue(record, 'status') || getStringValue(record, 'level') || getStringValue(record, 'priority') || 'No status'
          const recordDate = getFirstDateValue(record)
          const dependencySummary = getDependencySummary(record.id)
          const ruleSummary = getTimelineRuleMatchesForRecord(record.id)

          return (
            <button className="timeline-record-row" data-testid={`timeline-row-${record.id}`} key={record.id} type="button" onClick={() => openDailyRecord(record)}>
              <span>{recordDate || 'No date'}</span>
              <strong>{getRecordTitle(base, record)}</strong>
              <small>{table?.label || record.tableId}. {recordStatus}. {getRecordContext(record)}</small>
              <span className="timeline-dependency-summary">
                {dependencySummary.length === 0 ? (
                  <small>No dependencies</small>
                ) : (
                  dependencySummary.slice(0, 2).map((dependency) => (
                    <i key={dependency.id}>{dependency.label}: {dependency.title}</i>
                  ))
                )}
                {dependencySummary.length > 2 && <small>+{dependencySummary.length - 2} more</small>}
              </span>
              {ruleSummary.length > 0 && (
                <span className="timeline-rule-summary">
                  {ruleSummary.slice(0, 2).map((match) => (
                    <i key={match.rule.id}>Rule: {getRulePreview(match.rule)}</i>
                  ))}
                </span>
              )}
            </button>
          )
        })}
        {timelineRecords.length === 0 && <p className="empty-note">No records match. Clear the timeline filters.</p>}
      </div>
    )
  }

  function renderRecordModal() {
    if (buildModal !== 'record') {
      return null
    }

    return (
      <div className="modal-backdrop" role="presentation">
        <section className="build-modal record-modal" data-testid="record-modal" role="dialog" aria-modal="true" aria-label="Record editor">
          <div className="modal-header">
            <div>
              <span className="eyebrow">{selectedBuildTable?.label}</span>
              <h2>{isCreatingRecord || !selectedBuildRecord ? 'New record.' : getRecordTitle(base, selectedBuildRecord)}</h2>
            </div>
            <button className="ghost" type="button" onClick={closeBuildModal}>Close</button>
          </div>
          <div className="record-form">
            {isCreatingRecord || !selectedBuildRecord
              ? editableFieldsForSelectedTable.map((field) => (
                  <div className="record-field-input-slot" key={field.id}>
                    {renderRecordInput(field, recordDraft[field.id], updateRecordDraft)}
                  </div>
                ))
              : editableFieldsForSelectedTable.map((field) => (
                  <div className="record-field-input-slot" key={field.id}>
                    {renderRecordInput(field, selectedBuildRecord.values[field.id], updateSelectedRecord)}
                  </div>
                ))}
          </div>
          {!isCreatingRecord && selectedBuildRecord && (
            <div className="record-modal-links">
              <section>
                <strong>Backlinks</strong>
                <div className="linked-list">
                  {drawerBacklinks.length === 0 && <p className="empty-note">No records point here.</p>}
                  {drawerBacklinks.map((backlink) => (
                    <button
                      className="linked-record-card"
                      key={`${backlink.fromRecord.id}-${backlink.fieldId}`}
                      type="button"
                      onClick={() => openBuildRecord(backlink.fromRecord.tableId, backlink.fromRecord.id)}
                    >
                      <span className="pill prep">{backlink.fromRecord.tableLabel}</span>
                      <strong>{backlink.fromRecord.title}</strong>
                      <small>{backlink.fieldLabel}. {backlink.fromRecord.context}</small>
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <strong>Linked records</strong>
                <div className="linked-list">
                  {drawerLinkedRecords.length === 0 && <p className="empty-note">No linked records selected.</p>}
                  {drawerLinkedRecords.map((link) => (
                    <button
                      className="linked-record-card"
                      key={`${link.fieldId}-${link.record.id}`}
                      type="button"
                      onClick={() => openBuildRecord(link.record.tableId, link.record.id)}
                    >
                      <span className="pill waiting">{link.record.tableLabel}</span>
                      <strong>{link.record.title}</strong>
                      <small>{link.fieldLabel}. {link.record.context}</small>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}
          <div className="modal-actions">
            <button className="ghost" type="button" onClick={closeBuildModal}>Cancel</button>
            {isCreatingRecord ? (
              <button className="primary" type="button" onClick={createRecord}>Add record</button>
            ) : (
              <button className="primary" type="button" onClick={closeBuildModal}>Done</button>
            )}
          </div>
        </section>
      </div>
    )
  }

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
          detail: 'Firebase services are not available.',
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
    function closeTransientSurfaces(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      if (openFieldMenuId) {
        setOpenFieldMenuId('')
        return
      }

      if (buildModal && canDismissBuildModalWithEscape(buildModal)) {
        closeBuildModal()
      }
    }

    window.addEventListener('keydown', closeTransientSurfaces)

    return () => window.removeEventListener('keydown', closeTransientSurfaces)
  }, [buildModal, openFieldMenuId])

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

  return (
    <main className="app" data-theme={selectedTheme}>
      {toastMessage && (
        <div className="toast-region" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
      <aside className="rail">
        <div className="brand">
          <img src="/brand/sundesk-icon.png" alt="Sundesk logo" />
          <div>
            <strong>Sundesk</strong>
            <span>command center</span>
          </div>
        </div>

        <nav className="main-nav" aria-label="Sundesk navigation">
          <span>Work</span>
          {mainScreens
            .filter((screen) => screen.group === 'Work')
            .map((screen) => (
              <a
                aria-current={activeScreen === screen.id ? 'page' : undefined}
                className={activeScreen === screen.id ? 'active' : ''}
                data-short={screen.shortLabel}
                href={`#${screen.id}`}
                key={screen.id}
              >
                {screen.label}
              </a>
            ))}
          <span>System</span>
          {mainScreens
            .filter((screen) => screen.group === 'System')
            .map((screen) => (
              <a
                aria-current={activeScreen === screen.id ? 'page' : undefined}
                className={activeScreen === screen.id ? 'active' : ''}
                data-short={screen.shortLabel}
                href={`#${screen.id}`}
                key={screen.id}
              >
                {screen.label}
              </a>
            ))}
        </nav>

        {pinnedGridViews.length > 0 && (
          <section className="pinned-view-nav" aria-label="Pinned Build views">
            <span>Pinned views</span>
            {pinnedGridViews.map((view) => (
              <button key={view.id} type="button" onClick={() => openPinnedGridView(view)}>
                <strong>{view.name}</strong>
                <small>{base.tables.find((table) => table.id === view.tableId)?.label || view.tableId}</small>
              </button>
            ))}
          </section>
        )}

        <details className="privacy-card workspace-card" data-testid="rail-workspace-card">
          <summary>
            <span>Workspace</span>
            <strong>Fyre Festival GTA</strong>
          </summary>
          <p>Fake Ontario event data. GTA community shape.</p>
        </details>

        <details className="privacy-card rule-card" data-testid="rail-system-read-card">
          <summary>
            <span>System read</span>
            <strong>{activeScreenRuleMatches.length} records surface here.</strong>
          </summary>
          <p>The system shows its work when a record needs attention.</p>
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
            followupRecords={followupRecords}
            getChipColorClass={getChipColorClass}
            getCommandReason={getCommandReason}
            getCommandTableLabel={getCommandTableLabel}
            getDependencySummary={getDependencySummary}
            getRecordContext={getRecordContext}
            getRecordTitle={(record) => getRecordTitle(base, record)}
            getRecordWorkflowTags={getRecordWorkflowTags}
            getTodayRuleMatchesForRecord={getTodayRuleMatchesForRecord}
            nextMeetingLinkedTasks={nextMeetingLinkedTasks}
            nextMeetingRecord={nextMeetingRecord}
            onOpenBuild={openBuildScreen}
            onOpenDailyRecord={openDailyRecord}
            onOpenWorkflowTagRoute={openWorkflowTagRoute}
            screenStats={screenStats}
            todayChangedRecord={todayChangedRecord}
            todayChangedRecords={todayChangedRecords}
            todayFocusRecord={todayFocusRecord}
            todayLanes={todayLanes}
            todayNextLane={todayNextLane}
            todayNowLane={todayNowLane}
            todayRuleMatches={todayRuleMatches}
            todaySlipRecord={todaySlipRecord}
            todayWaitingLane={todayWaitingLane}
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
          selectedTableLabel={selectedBuildTable?.label || 'Record'}
        />

        <section className="connection-zone" id="connections">
          <article className="connection-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Connection core</span>
                <h2>Links are field values.</h2>
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
                <span>Backlinks</span>
                <strong>{selectedTaskBacklinks.length}</strong>
                <small>Risks and meetings can point back without duplicate entry.</small>
              </article>
              <article>
                <span>Dependencies</span>
                <strong>{selectedTaskDependencies.length}</strong>
                <small>Dependencies are typed links between records.</small>
              </article>
            </div>
          </article>

          <article className="connection-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Universal picker</span>
                <h2>Pick from any table.</h2>
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
        </section>

        {activeScreen === 'timeline' && (
          <TimelineScreen
            base={base}
            dailyTimelineRecords={dailyTimelineRecords}
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

        {activeScreen === 'build' && (
        <section className="build-zone build-reset" data-testid="build-screen" id="build">
          <article className="builder-panel wide build-workbench">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Build</span>
                <h2>Build is freeform first.</h2>
                <p>The grid should feel like Excel or Google Sheets. Paste into cells, edit directly, then let Sundesk suggest structure after the fact.</p>
              </div>
              <div className="drawer-actions">
                <span className="metric-pill">{sortedAndFilteredRecords.length} shown</span>
                {activeGridView && (
                  <span className={`metric-pill ${activeGridViewChanged ? 'changed-view' : 'active-view'}`}>
                    {activeGridViewChanged ? 'View changed' : 'View active'}: {activeGridView.name}
                  </span>
                )}
                <button type="button" onClick={() => setBuildModal('table')}>Add table</button>
                <button type="button" onClick={() => setBuildModal('field')}>Add field</button>
                <button type="button" onClick={saveGridView}>Save view</button>
                <details className="build-options-menu">
                  <summary>Table options</summary>
                  <div>
                    <button type="button" onClick={openTableSettings}>Rename</button>
                    <button className="danger" disabled={!canDeleteSelectedBuildTable} type="button" onClick={requestDeleteTable}>Delete table</button>
                    <button className="danger" type="button" onClick={() => setBuildModal('resetLocalData')}>Reset local data</button>
                  </div>
                </details>
              </div>
            </div>
            <div className="table-tabs" role="tablist" aria-label="Tables">
              {buildTableRows.map((table) => (
                <button
                  aria-selected={table.id === selectedBuildTable?.id}
                  className={table.id === selectedBuildTable?.id ? 'selected' : ''}
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
            </div>
            <BuildToolbar
              activeGridViewId={activeGridViewId}
              fieldsForSelectedTable={fieldsForSelectedTable}
              gridColorFieldId={gridColorFieldId}
              gridDensity={gridDensity}
              gridFilter={gridFilter}
              gridGroupFieldId={gridGroupFieldId}
              gridSortDirection={gridSortDirection}
              gridSortFieldId={gridSortFieldId}
              localGridViews={localGridViews}
              visibleFieldCount={visibleFieldsForGrid.length}
              visibleFieldIds={visibleFieldIds}
              onAddField={() => setBuildModal('field')}
              onApplyGridView={applyGridView}
              onClearActiveGridView={() => setActiveGridViewId('')}
              onGridColorFieldChange={setGridColorFieldId}
              onGridDensityChange={setGridDensity}
              onGridFilterChange={setGridFilter}
              onGridGroupFieldChange={setGridGroupFieldId}
              onGridSortDirectionChange={setGridSortDirection}
              onGridSortFieldChange={setGridSortFieldId}
              onToggleVisibleField={toggleVisibleField}
            />
            <BuildPasteHelper
              applyPasteAction={applyPasteAction}
              buildPasteCellCount={buildPasteCellCount}
              buildPasteReceipt={buildPasteReceipt}
              buildPasteSummary={buildPasteSummary}
              selectedGridCell={selectedGridCell}
              visibleFieldsForGrid={visibleFieldsForGrid}
            />
            {tagRouteOptions.length > 0 && (
              <div className="tag-route-strip" aria-label="Tag workflow routes">
                <span>Tag routes</span>
                <div>
                  {tagRouteOptions.map((tag) => (
                    <button
                      className={`select-tag ${getChipColorClass(tag)} ${gridFilter === tag ? 'selected' : ''}`}
                      key={tag}
                      type="button"
                      onClick={() => setGridFilter((current) => current === tag ? '' : tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
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
              onAddField={() => setBuildModal('field')}
              onCreateRecord={openCreateRecordModal}
              onEditRecord={openEditRecordModal}
              onPaste={handleBuildGridPaste}
              onSelectRecord={setSelectedBuildRecordId}
              renderEditableGridCell={renderEditableGridCell}
              renderGridHeader={renderGridHeader}
              selectedRecordId={selectedBuildRecord?.id}
              sortedAndFilteredRecordCount={sortedAndFilteredRecords.length}
              visibleFieldsForGrid={visibleFieldsForGrid}
            />
          </article>

          <BuildViewsPanel
            activeGridViewChanged={activeGridViewChanged}
            activeGridViewId={activeGridViewId}
            localGridViews={localGridViews}
            pinnedGridViewCount={pinnedGridViews.length}
            savedViews={savedViews}
            tables={base.tables}
            viewRenameDrafts={viewRenameDrafts}
            onApplyGridView={applyGridView}
            onDeleteGridView={deleteGridView}
            onDuplicateGridView={duplicateGridView}
            onRenameDraftChange={updateViewRenameDraft}
            onRenameGridView={renameGridView}
            onResetActiveGridView={resetActiveGridView}
            onTogglePinnedGridView={togglePinnedGridView}
            onUpdateGridView={updateGridView}
          />

          <BuildRulesPanel
            base={base}
            localRules={localRules}
            expandedRuleId={expandedRuleId}
            createLocalRule={createLocalRule}
            setExpandedRuleId={setExpandedRuleId}
            updateLocalRule={updateLocalRule}
            updateLocalRuleField={updateLocalRuleField}
            deleteLocalRule={deleteLocalRule}
            getCommandReason={getCommandReason}
            getRulePreview={getRulePreview}
            getRuleMatchCount={getRuleMatchCount}
            getRuleValidationMessages={getRuleValidationMessages}
            getRuleMatchedRecords={getRuleMatchedRecords}
            openBuildRecord={openBuildRecord}
          />

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
            firestoreReadShadowComparison={firestoreReadShadowComparison}
            firestoreReadShadowState={firestoreReadShadowState}
            firestoreWriteGateState={firestoreWriteGateState}
            localEngineStats={localEngineStats}
            localRules={localRules}
            migrationMessages={migrationMessages}
            openScreen={openScreen}
            ruleDestinationStats={ruleDestinationStats}
            selectedTheme={selectedTheme}
            themes={themes}
            onThemeChange={setSelectedTheme}
          />
        )}
        {renderRecordModal()}
      </section>
    </main>
  )
}

export default App
