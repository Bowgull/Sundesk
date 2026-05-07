import './App.css'
import { useEffect, useState, type KeyboardEvent, type PointerEvent } from 'react'
import {
  buildFieldTypes,
  savedViews,
} from './data/demoData'
import {
  type DependencyRelationship,
  getDependencyLabel,
  getDependencySummary as getDependencySummaryForBase,
  getUniqueDependencyId,
  hasDuplicateDependency,
} from './data/dependencies'
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
  isDateField,
  ruleActionOptions,
  ruleDestinationOptions,
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
  getRuleDestinationStats,
  getRuleMatchesForDestination,
  getScreenStats,
  getTimelineRecords,
  getTimelineSourceRecords,
  getTimelineStatusOptions,
  getTodayLanes,
  getWorkRecordGroups,
} from './data/views'

const themes = [
  { label: 'Sunrise Soft', value: 'sunrise-soft' },
  { label: 'Sunset Bold', value: 'sunset-bold' },
  { label: 'Cloud Light', value: 'cloud-light' },
  { label: 'Focus Dark', value: 'focus-dark' },
  { label: 'Light', value: 'light' },
]

const mainScreens = [
  { id: 'today', label: 'Today', group: 'Work' },
  { id: 'communities', label: 'Communities', group: 'Work' },
  { id: 'tasks', label: 'Tasks', group: 'Work' },
  { id: 'followups', label: 'Follow-ups', group: 'Work' },
  { id: 'meetings', label: 'Meetings', group: 'Work' },
  { id: 'timeline', label: 'Timeline', group: 'Work' },
  { id: 'build', label: 'Build', group: 'System' },
  { id: 'settings', label: 'Settings', group: 'System' },
] as const

type AppScreen = (typeof mainScreens)[number]['id']

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
  const [selectedTheme, setSelectedTheme] = useState(
    () => localStorage.getItem('sundesk-theme') || 'sunrise-soft',
  )
  const [activeScreen, setActiveScreen] = useState<AppScreen>(() => getScreenFromHash())
  const [base, setBase] = useState(() => readStoredWorkbase())
  const [timelineFilter, setTimelineFilter] = useState('')
  const [timelineTableId, setTimelineTableId] = useState('all')
  const [timelineStatus, setTimelineStatus] = useState('all')
  const [localRules, setLocalRules] = useState<LocalRule[]>(() => readStoredRules())
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
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () => initialBuildViewState.columnWidths || {},
  )
  const [buildModal, setBuildModal] = useState<BuildModal>('')
  const [pendingDeleteTableId, setPendingDeleteTableId] = useState('')
  const [selectedFieldSettingsId, setSelectedFieldSettingsId] = useState('')
  const [pendingDeleteFieldId, setPendingDeleteFieldId] = useState('')
  const [isCreatingRecord, setIsCreatingRecord] = useState(false)
  const [linkedRecordFilters, setLinkedRecordFilters] = useState<Record<string, string>>({})
  const [dependencyDraft, setDependencyDraft] = useState({
    toRecordId: '',
    relationship: 'dependsOn' as DependencyRelationship,
    reason: '',
  })
  const [dependencySearch, setDependencySearch] = useState('')
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
    blockedTaskRecords,
    waitingTaskRecords,
    waitingFollowupRecords,
  } = getWorkRecordGroups(base)
  const nextMeetingRecord = sortRecordsByDate(meetingRecords)[0]
  const nextMeetingLinkedTasks = nextMeetingRecord ? getLinkedRecordsForRecord(base, nextMeetingRecord.id).filter((link) => link.record.tableId === 'tasks') : []
  const dailyTimelineRecords = getDailyTimelineRecords(base)
  const timelineSourceRecords = getTimelineSourceRecords(base)
  const timelineStatusOptions = getTimelineStatusOptions(timelineSourceRecords)
  const timelineRecords = getTimelineRecords(base, timelineSourceRecords, timelineTableId, timelineStatus, timelineFilter)
  const todayRuleMatches = getRuleMatchesForDestination(base, localRules, 'today', todayDate)
  const timelineRuleMatches = getRuleMatchesForDestination(base, localRules, 'timeline', todayDate)
  const todayLanes = getTodayLanes(base, todayRuleMatches)
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
  const pendingDeleteField = fieldsForSelectedTable.find((field) => field.id === pendingDeleteFieldId)
  const pendingDeleteTable = base.tables.find((table) => table.id === pendingDeleteTableId)
  const pinnedGridViews = localGridViews.filter((view) => view.pinned)
  const activeScreenRuleMatches = getRuleMatchesForDestination(base, localRules, activeScreen, todayDate)
  const migrationMessages = [
    initialMigrationReport.workbaseReset ? 'Workbase state was repaired.' : '',
    initialMigrationReport.rulesReset ? 'Rules state was repaired.' : '',
    initialMigrationReport.buildViewReset ? 'Build view state was repaired.' : '',
  ].filter(Boolean)
  const localEngineStats = getLocalEngineStats(base, localRules, localGridViews)
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

  function closeBuildModal() {
    setBuildModal('')
    setPendingDeleteTableId('')
    setSelectedFieldSettingsId('')
    setPendingDeleteFieldId('')
    setIsCreatingRecord(false)
    setLinkedRecordFilters({})
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
    setBuildModal('record')
  }

  function openDailyRecord(record: BaseRecord) {
    openBuildRecord(record.tableId, record.id)
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
    setActiveScreen('build')

    if (window.location.hash !== '#build') {
      window.history.pushState(null, '', '#build')
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
    const isPrimaryField = selectedBuildTable?.primaryFieldId === field.id

    return (
      <div className="grid-header-cell">
        <button
          className="grid-field-menu-trigger"
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setOpenFieldMenuId(openFieldMenuId === menuKey ? '' : menuKey)
          }}
        >
          <span>{field.label}</span>
          {isPrimaryField && <small>Name field</small>}
          <strong>⌄</strong>
        </button>
        {openFieldMenuId === menuKey && (
          <div className="grid-field-menu">
            <button type="button" onClick={() => openFieldSettings(field)}>Edit field</button>
            <button type="button" onClick={() => openFieldSettings(field)}>Rename</button>
            <button type="button" onClick={() => openFieldSettings(field)}>Change type</button>
            <button type="button" onClick={() => toggleVisibleField(field.id)}>Hide from view</button>
            <button type="button" onClick={() => sortGridByField(field.id, 'asc')}>Sort ascending</button>
            <button type="button" onClick={() => sortGridByField(field.id, 'desc')}>Sort descending</button>
            <button type="button" onClick={() => groupGridByField(field.id)}>Group by this field</button>
            <button type="button" onClick={() => duplicateField(field)}>Duplicate field</button>
            <button
              className="danger"
              disabled={isPrimaryField}
              type="button"
              onClick={() => requestDeleteField(field)}
            >
              Delete field
            </button>
          </div>
        )}
        <button
          aria-label={`Resize ${field.label}`}
          className="column-resizer"
          type="button"
          onPointerDown={(event) => resizeColumn(field.id, event)}
        />
      </div>
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

  function renderRecordInput(
    field: FieldDefinition,
    value: RecordValue,
    onChange: (fieldId: string, value: RecordValue) => void,
  ) {
    const linkedRecords = field.linkedTableId ? getRecordsForTable(base, field.linkedTableId) : []
    const selectedLinkedIds = Array.isArray(value) ? value : []

    if (field.type === 'linkedRecord') {
      const linkedTable = base.tables.find((table) => table.id === field.linkedTableId)
      const searchKey = `${field.tableId}:${field.id}`
      const searchTerm = linkedRecordFilters[searchKey] || ''
      const normalizedSearchTerm = searchTerm.trim().toLowerCase()
      const selectedRecords = selectedLinkedIds.map((recordId) => getRecord(base, recordId))
      const filteredLinkedRecords = linkedRecords.filter((record) => {
        if (!normalizedSearchTerm) {
          return true
        }

        const title = getRecordTitle(base, record).toLowerCase()
        const context = getRecordContext(record).toLowerCase()

        return title.includes(normalizedSearchTerm) || context.includes(normalizedSearchTerm)
      })

      return (
        <label className="full-row" key={field.id}>
          <span>{field.label}</span>
          <div className="linked-record-picker">
            <div className="linked-picker-head">
              <strong>{linkedTable ? linkedTable.label : 'No linked table'}</strong>
              <small>{field.allowMultiple ? `${selectedLinkedIds.length} selected` : selectedLinkedIds.length > 0 ? '1 selected' : 'None selected'}</small>
            </div>
            {field.linkedTableId ? (
              <>
                <input
                  aria-label={`Search ${field.label}`}
                  placeholder={`Search ${linkedTable?.label || 'records'}`}
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setLinkedRecordFilters((current) => ({
                      ...current,
                      [searchKey]: event.target.value,
                    }))
                  }
                />
                {selectedLinkedIds.length > 0 && (
                  <div className="linked-selected-list" aria-label={`Selected ${field.label}`}>
                    {selectedRecords.map((record, index) => {
                      const recordId = selectedLinkedIds[index]

                      return (
                        <button
                          key={recordId}
                          type="button"
                          onClick={() => onChange(field.id, selectedLinkedIds.filter((selectedId) => selectedId !== recordId))}
                        >
                          <strong>{record ? getRecordTitle(base, record) : recordId}</strong>
                          <small>Remove</small>
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="linked-choice-grid">
                  {linkedRecords.length === 0 && <small>No records in linked table.</small>}
                  {linkedRecords.length > 0 && filteredLinkedRecords.length === 0 && <small>No records match.</small>}
                  {filteredLinkedRecords.map((record) => {
                    const isSelected = selectedLinkedIds.includes(record.id)

                    return (
                      <button
                        className={isSelected ? 'selected' : ''}
                        key={record.id}
                        type="button"
                        onClick={() => onChange(field.id, toggleListValue(selectedLinkedIds, record.id, field.allowMultiple))}
                      >
                        <strong>{getPickerRecordLabel(record)}</strong>
                        <small>{getRecordContext(record)}</small>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <p className="empty-note">Choose a linked table in field settings.</p>
            )}
          </div>
        </label>
      )
    }

    if (field.type === 'multiSelect' && field.options) {
      const selectedOptions = Array.isArray(value) ? value : []

      return (
        <label className="full-row" key={field.id}>
          <span>{field.label}</span>
          <div className="linked-choice-grid option-choice-grid">
            {field.options.map((option) => {
              const isSelected = selectedOptions.includes(option)

              return (
                <button
                  className={isSelected ? 'selected' : ''}
                  key={option}
                  type="button"
                  onClick={() => onChange(field.id, toggleListValue(selectedOptions, option))}
                >
                  <strong>{option}</strong>
                </button>
              )
            })}
          </div>
        </label>
      )
    }

    if (field.options) {
      return (
        <label key={field.id}>
          <span>{field.label}</span>
          <select
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => onChange(field.id, event.target.value)}
          >
            <option value="">Choose</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      )
    }

    if (field.type === 'checkbox') {
      return (
        <label className="checkbox-row" key={field.id}>
          <span>{field.label}</span>
          <input
            checked={Boolean(value)}
            type="checkbox"
            onChange={(event) => onChange(field.id, event.target.checked)}
          />
        </label>
      )
    }

    if (field.type === 'longText') {
      return (
        <label className="full-row" key={field.id}>
          <span>{field.label}</span>
          <textarea
            value={typeof value === 'string' ? value : ''}
            rows={3}
            onChange={(event) => onChange(field.id, event.target.value)}
          />
        </label>
      )
    }

    const inputType = field.type === 'date' ? 'date' : field.type === 'dateTime' ? 'datetime-local' : ['number', 'currency', 'percent', 'rating'].includes(field.type) ? 'number' : field.type === 'url' ? 'url' : 'text'

    return (
      <label key={field.id}>
        <span>{field.label}</span>
        <input
          type={inputType}
          value={typeof value === 'string' || typeof value === 'number' ? value : ''}
          onChange={(event) => onChange(field.id, inputType === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value)}
        />
      </label>
    )
  }

  function renderSavedGridCell(record: BaseRecord, field: FieldDefinition) {
    const value = record.values[field.id]

    if (field.type === 'checkbox') {
      return (
        <span className={`saved-check check-${field.checkboxColor || 'lime'} ${value ? 'checked' : ''}`}>
          {value ? renderCheckboxIcon(field.checkboxIcon) : 'No'}
        </span>
      )
    }

    if (field.type === 'multiSelect' && Array.isArray(value)) {
      return (
        <span className="saved-pill-list">
          {value.length === 0 && <span className="grid-linked-empty">Empty</span>}
          {value.map((option) => (
            <span className={`select-tag ${getOptionColorClass(option)}`} key={option}>{option}</span>
          ))}
        </span>
      )
    }

    if (field.options) {
      const selectedValue = typeof value === 'string' ? value : ''

      return selectedValue ? <span className={`select-tag ${getOptionColorClass(selectedValue)}`}>{selectedValue}</span> : <span className="grid-linked-empty">Empty</span>
    }

    if (field.type === 'linkedRecord' && Array.isArray(value)) {
      return (
        <span className="saved-pill-list">
          {value.length === 0 && <span className="grid-linked-empty">Empty</span>}
          {value.map((recordId) => {
            const linkedRecord = getRecord(base, recordId)

            return (
              <span className="linked-display-pill" key={recordId}>
                {linkedRecord ? getRecordTitle(base, linkedRecord) : recordId}
              </span>
            )
          })}
        </span>
      )
    }

    return <span className={computedFieldTypes.includes(field.type) ? 'grid-cell-readonly' : 'saved-cell-value'}>{getFieldDisplayValue(record, field)}</span>
  }

  function renderGridCellEditor(field: FieldDefinition) {
    const value = gridEditDraft

    if (field.type === 'checkbox') {
      return (
        <input
          autoFocus
          aria-label={`${field.label} editor`}
          checked={Boolean(value)}
          type="checkbox"
          onChange={(event) => setGridEditDraft(event.target.checked)}
        />
      )
    }

    if (field.type === 'multiSelect' && field.options) {
      const selectedOptions = Array.isArray(value) ? value : []

      return (
        <div className="grid-option-list" aria-label={`${field.label} editor`}>
          {field.options.map((option) => (
            <button
              className={selectedOptions.includes(option) ? 'selected' : ''}
              key={option}
              type="button"
              onClick={() => setGridEditDraft(toggleListValue(selectedOptions, option))}
            >
              {option}
            </button>
          ))}
        </div>
      )
    }

    if (field.options) {
      return (
        <select
          autoFocus
          aria-label={`${field.label} editor`}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => setGridEditDraft(event.target.value)}
        >
          <option value="">Choose</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === 'linkedRecord' && field.linkedTableId) {
      const selectedLinkedIds = Array.isArray(value) ? value : []
      const searchKey = `grid:${field.tableId}:${field.id}`
      const searchTerm = linkedRecordFilters[searchKey] || ''
      const normalizedSearchTerm = searchTerm.trim().toLowerCase()
      const linkedRecords = getRecordsForTable(base, field.linkedTableId)
      const selectedRecords = selectedLinkedIds.map((recordId) => getRecord(base, recordId)).filter(Boolean) as BaseRecord[]
      const filteredLinkedRecords = linkedRecords.filter((linkedRecord) => {
        if (!normalizedSearchTerm) {
          return true
        }

        return [
          getPickerRecordLabel(linkedRecord),
          getRecordContext(linkedRecord),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearchTerm)
      })

      return (
        <div className="grid-linked-editor" aria-label={`${field.label} editor`}>
          <div className="grid-linked-editor-head">
            <strong>{base.tables.find((table) => table.id === field.linkedTableId)?.label || 'Linked records'}</strong>
            <small>{selectedLinkedIds.length} selected</small>
          </div>
          <input
            autoFocus
            aria-label={`Search ${field.label}`}
            placeholder="Search records"
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setLinkedRecordFilters((current) => ({
                ...current,
                [searchKey]: event.target.value,
              }))
            }
          />
          {selectedRecords.length > 0 && (
            <div className="grid-linked-selected" aria-label={`Selected ${field.label}`}>
              {selectedRecords.map((selectedRecord) => (
                <button
                  key={selectedRecord.id}
                  type="button"
                  onClick={() => setGridEditDraft(selectedLinkedIds.filter((recordId) => recordId !== selectedRecord.id))}
                >
                  {getPickerRecordLabel(selectedRecord)}
                  <small>Remove</small>
                </button>
              ))}
            </div>
          )}
          <div className="grid-linked-pills">
            {filteredLinkedRecords.length === 0 && <small>No records match.</small>}
            {filteredLinkedRecords.map((linkedRecord) => {
              const isSelected = selectedLinkedIds.includes(linkedRecord.id)

              return (
                <button
                  className={isSelected ? 'selected' : ''}
                  key={linkedRecord.id}
                  type="button"
                  onClick={() => setGridEditDraft(toggleListValue(selectedLinkedIds, linkedRecord.id, field.allowMultiple))}
                >
                  {getPickerRecordLabel(linkedRecord)}
                </button>
              )
            })}
          </div>
          <button type="button" onClick={commitGridCellEdit}>Done</button>
        </div>
      )
    }

    if (field.type === 'longText') {
      return (
        <textarea
          autoFocus
          aria-label={`${field.label} editor`}
          rows={2}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => setGridEditDraft(event.target.value)}
        />
      )
    }

    const inputType = field.type === 'date' ? 'date' : field.type === 'dateTime' ? 'datetime-local' : ['number', 'currency', 'percent', 'rating'].includes(field.type) ? 'number' : field.type === 'url' ? 'url' : 'text'

    return (
      <input
        autoFocus
        aria-label={`${field.label} editor`}
        type={inputType}
        value={typeof value === 'string' || typeof value === 'number' ? value : ''}
        onChange={(event) => setGridEditDraft(inputType === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value)}
      />
    )
  }

  function renderEditableGridCell(record: BaseRecord, field: FieldDefinition) {
    const cell = { recordId: record.id, fieldId: field.id }
    const isSelected = isSameGridCell(selectedGridCell, cell)
    const isEditing = isSameGridCell(editingGridCell, cell)

    if (isEditing) {
      return (
        <div
          className="grid-cell-editor"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => handleGridEditorKeyDown(record, field, event)}
        >
          {renderGridCellEditor(field)}
        </div>
      )
    }

    return (
      <button
        aria-label={`${getRecordTitle(base, record)} ${field.label}`}
        className={`grid-cell-button ${isSelected ? 'selected-cell' : ''} ${computedFieldTypes.includes(field.type) ? 'readonly-cell' : ''}`}
        data-grid-cell={getGridCellKey(cell)}
        data-testid={`grid-cell-${record.id}-${field.id}`}
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          if (editingGridCell && !isSameGridCell(editingGridCell, cell)) {
            commitGridCellEdit()
          }
          selectGridCell(record.id, field.id)
          setSelectedBuildRecordId(record.id)
        }}
        onDoubleClick={(event) => {
          event.stopPropagation()
          startGridCellEdit(record, field)
        }}
        onKeyDown={(event) => handleSavedGridCellKeyDown(record, field, event)}
      >
        {renderSavedGridCell(record, field)}
      </button>
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
              ? editableFieldsForSelectedTable.map((field) =>
                  renderRecordInput(field, recordDraft[field.id], updateRecordDraft),
                )
              : editableFieldsForSelectedTable.map((field) =>
                  renderRecordInput(field, selectedBuildRecord.values[field.id], updateSelectedRecord),
                )}
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
    function syncScreenFromHash() {
      setActiveScreen(getScreenFromHash())
      setBuildModal('')
      setPendingDeleteTableId('')
      setSelectedFieldSettingsId('')
      setPendingDeleteFieldId('')
      setIsCreatingRecord(false)
    }

    window.addEventListener('hashchange', syncScreenFromHash)
    syncScreenFromHash()

    return () => window.removeEventListener('hashchange', syncScreenFromHash)
  }, [])

  return (
    <main className="app" data-theme={selectedTheme}>
      <aside className="rail" aria-label="Sundesk navigation">
        <div className="brand">
          <img src="/brand/sundesk-icon.png" alt="Sundesk logo" />
          <div>
            <strong>Sundesk</strong>
            <span>private workbase</span>
          </div>
        </div>

        <nav className="main-nav">
          <span>Work</span>
          {mainScreens
            .filter((screen) => screen.group === 'Work')
            .map((screen) => (
              <a
                className={activeScreen === screen.id ? 'active' : ''}
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
                className={activeScreen === screen.id ? 'active' : ''}
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

        <section className="privacy-card">
          <span>Privacy boundary</span>
          <strong>Track status. Not files.</strong>
          <p>Upload sensitive information at your own risk. Sundesk is built for metadata, not files.</p>
        </section>

        <section className="privacy-card rule-card">
          <span>Rule read</span>
          <strong>{activeScreenRuleMatches.length} records match here.</strong>
          <p>Rules are structured locally. They do not run automations yet.</p>
          {activeScreenRuleMatches.length > 0 && (
            <div className="rule-card-list">
              {activeScreenRuleMatches.slice(0, 3).map((match) => (
                <button key={`${match.rule.id}-${match.record.id}`} type="button" onClick={() => openDailyRecord(match.record)}>
                  <strong>{getRecordTitle(base, match.record)}</strong>
                  <small>{getRulePreview(match.rule)}</small>
                </button>
              ))}
            </div>
          )}
        </section>
      </aside>

      <section className="desk">
        {activeScreen === 'today' && (
          <>
        <section className="onboarding-callout" aria-label="Onboarding status">
          <div>
            <span className="eyebrow">First run</span>
            <strong>Setup is required before real data.</strong>
            <p>Review privacy, choose a theme, set digest time, check starter tables, then add the first communities.</p>
          </div>
          <button>Run setup</button>
        </section>

        <header className="hero" id="today">
          <div>
            <span className="eyebrow">Today</span>
            <h1>Today builds the day.</h1>
            <p>
              First the fire. Then the waiting loops. Then the work that should not become urgent.
            </p>
          </div>
          <article className="digest-card">
            <span>Daily digest</span>
            <strong>7:30 AM</strong>
            <p>Next send goes to lindsaybelldesign@gmail.com.</p>
            <button>Preview digest</button>
          </article>
        </header>

        <section className="today-lane-grid" aria-label="Today lanes" data-testid="today-lanes">
          {todayLanes.map((lane) => (
            <article className={`today-lane ${lane.id}`} data-testid={`today-lane-${lane.id}`} key={lane.id}>
              <div className="lane-head">
                <span>{lane.label}</span>
                <strong>{lane.records.length}</strong>
              </div>
              <h2>{lane.title}</h2>
              <ol>
                {lane.records.map((record) => (
                  <li key={record.id}>
                    <button className="lane-record-link" type="button" onClick={() => openDailyRecord(record)}>
                      <strong>{getRecordTitle(base, record)}</strong>
                    </button>
                    <span>{getRecordContext(record)}</span>
                    {getTodayRuleMatchesForRecord(record.id).length > 0 && (
                      <div className="lane-rule-list">
                        {getTodayRuleMatchesForRecord(record.id).slice(0, 2).map((match) => (
                          <small key={match.rule.id}>Rule: {getRulePreview(match.rule)}</small>
                        ))}
                      </div>
                    )}
                    {getDependencySummary(record.id).length > 0 && (
                      <div className="lane-dependency-list">
                        {getDependencySummary(record.id).slice(0, 2).map((dependency) => (
                          <small key={dependency.id}>{dependency.label}: {dependency.title}</small>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </section>

        <section className="command-grid">
          <article className="queue-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Why it surfaced</span>
                <h2>The system shows its work.</h2>
              </div>
              <button className="ghost" type="button" onClick={openBuildScreen}>Adjust rules</button>
            </div>

            <div className="priority-list" data-testid="today-rule-receipts">
              {todayRuleMatches.slice(0, 4).map((match, index) => (
                <article className="priority-card prep" key={`${match.rule.id}-${match.record.id}`}>
                  <div className="priority-rank">{index + 1}</div>
                  <div className="priority-main">
                    <div className="priority-top">
                      <strong>{getRecordTitle(base, match.record)}</strong>
                      <span className="pill prep">{base.tables.find((table) => table.id === match.record.tableId)?.label || match.record.tableId}</span>
                    </div>
                    <p>{getRulePreview(match.rule)}</p>
                    <div className="reason-chain">
                      <span>Rule matched</span>
                      <span><i aria-hidden="true" />Destination: Today</span>
                      <span><i aria-hidden="true" />No automation ran</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => openDailyRecord(match.record)}>Open</button>
                </article>
              ))}
              {todayRuleMatches.length === 0 && <p className="empty-note">No Today Rules match records.</p>}
            </div>
          </article>

          <aside className="focus-stack">
            <article className="insight-card">
              <span>System read</span>
              <strong>Halifax is the only fire.</strong>
              <p>Everything else can move after the COI status is handled.</p>
            </article>

            <article className="next-meeting" id="meetings">
              <span className="eyebrow">Next meeting</span>
              <strong>Charlottetown. Tomorrow.</strong>
              <p>Agenda can be generated from 2 tasks, 1 risk, and 1 follow-up.</p>
              <button>Generate prep</button>
            </article>
          </aside>
        </section>

        <section className="data-summary-grid" aria-label="Workbase status">
          {screenStats.map((stat) => (
            <article key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.detail}</small>
            </article>
          ))}
        </section>
          </>
        )}

        {activeScreen === 'communities' && (
        <section className="screen-grid" id="communities">
          <article className="screen-panel wide">
            <div className="panel-title compact">
              <div>
                <span className="eyebrow">Communities</span>
                <h2>Daily map.</h2>
              </div>
              <span className="metric-pill">{communityRecords.length} records</span>
            </div>
            <div className="record-card-grid three">
                {communityRecords.map((record) => {
                const readiness = getNumberValue(record, 'readiness')
                const status = getStringValue(record, 'status')

                return (
                <button className="work-record-card" key={record.id} type="button" onClick={() => openDailyRecord(record)}>
                  <span>{status || 'No status'}</span>
                  <strong>{getRecordTitle(base, record)}</strong>
                  <small>{readiness}% ready. {getStringValue(record, 'eventDate') || 'No date set'}.</small>
                </button>
                )
              })}
            </div>
          </article>

          <article className="screen-panel">
            <div className="panel-title compact">
              <div>
                <span className="eyebrow">At risk</span>
                <h2>Watch these first.</h2>
              </div>
              <span className="metric-pill">{atRiskCommunityRecords.length}</span>
            </div>
            <div className="record-list">
              {atRiskCommunityRecords.map((record) => (
                <article key={record.id}>
                  <span>{getStringValue(record, 'status') || 'No status'}</span>
                  <strong>{getRecordTitle(base, record)}</strong>
                  <small>{getNumberValue(record, 'readiness')}% ready.</small>
                </article>
              ))}
            </div>
          </article>
        </section>
        )}

        {activeScreen === 'tasks' && (
        <section className="screen-grid" id="tasks">
          <article className="screen-panel wide">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Tasks</span>
                <h2>Open work.</h2>
              </div>
              <button className="primary" type="button" onClick={() => openCreateRecordForTable('tasks')}>New task</button>
            </div>
            <div className="record-card-grid">
              {openTaskRecords.map((record) => (
                <button className="work-record-card" key={record.id} type="button" onClick={() => openDailyRecord(record)}>
                  <span>{getStringValue(record, 'status') || 'No status'}</span>
                  <strong>{getRecordTitle(base, record)}</strong>
                  <small>{getStringValue(record, 'priority') || 'No priority'}. Due {getStringValue(record, 'dueDate') || 'not set'}.</small>
                </button>
              ))}
            </div>
          </article>

          <article className="screen-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Dependencies</span>
                <h2>What blocks what.</h2>
              </div>
              <button>Add dependency</button>
            </div>
            <div className="dependency-list">
              {selectedTaskDependencies.map((dependency) => (
                <article key={dependency.id}>
                  <strong>{getDependencyLabel(dependency, 'task_coi_halifax')} {dependency.record.title}</strong>
                  <span>{dependency.record.tableLabel}</span>
                  <small>{dependency.reason}</small>
                </article>
              ))}
            </div>
          </article>
        </section>
        )}

        {activeScreen === 'followups' && (
          <section className="screen-grid" id="followups">
            <article className="screen-panel wide">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">Follow-ups</span>
                  <h2>Waiting loops.</h2>
                </div>
                <button className="primary" type="button" onClick={() => openCreateRecordForTable('followups')}>New follow-up</button>
              </div>
              <div className="record-card-grid">
                {followupRecords.map((record) => (
                  <button className="work-record-card" key={record.id} type="button" onClick={() => openDailyRecord(record)}>
                    <span>{getRecordContext(record)}</span>
                    <strong>{getRecordTitle(base, record)}</strong>
                    <small>{followupCommunityField ? getFieldDisplayValue(record, followupCommunityField) : 'No community set'}</small>
                  </button>
                ))}
              </div>
            </article>

            <article className="screen-panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">Daily rule</span>
                  <h2>Waiting needs an owner.</h2>
                </div>
                <button>Adjust rule</button>
              </div>
              <div className="rules">
                <p><span>When</span> a follow-up is waiting and due today. <span>Do</span> show it in Today.</p>
                <p><span>When</span> a follow-up points to a community at risk. <span>Do</span> raise its priority.</p>
              </div>
            </article>
          </section>
        )}

        {activeScreen === 'meetings' && (
          <section className="screen-grid" id="meetings">
            <article className="screen-panel">
              <span className="eyebrow">Meetings</span>
              <strong>Prep comes from records.</strong>
              <p>Meetings read linked communities, tasks, risks, and follow-ups. The agenda should be deterministic before it is written.</p>
              <button>Generate prep</button>
            </article>

            <article className="screen-panel wide">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">Meeting records</span>
                  <h2>Scheduled work.</h2>
                </div>
                <div className="drawer-actions">
                  <span className="metric-pill">{meetingRecords.length} records</span>
                  <button className="primary" type="button" onClick={() => openCreateRecordForTable('meetings')}>New meeting</button>
                </div>
              </div>
              <div className="record-card-grid">
                {meetingRecords.map((record) => (
                  <button className="work-record-card" key={record.id} type="button" onClick={() => openDailyRecord(record)}>
                    <span>{getRecordContext(record)}</span>
                    <strong>{getRecordTitle(base, record)}</strong>
                    <small>{meetingTasksField ? getFieldDisplayValue(record, meetingTasksField) : 'No tasks linked'}</small>
                  </button>
                ))}
              </div>
              {nextMeetingRecord && (
                <div className="local-state-strip">
                  <span>Next prep</span>
                  <strong>{getRecordTitle(base, nextMeetingRecord)} reads {nextMeetingLinkedTasks.length} linked tasks.</strong>
                </div>
              )}
            </article>
          </section>
        )}

        <section className={`record-drawer ${activeScreen === 'build' ? 'active-record-drawer' : ''}`} data-testid="record-drawer" id="record">
          <div className="drawer-header">
            <div>
              <span className="eyebrow">{selectedBuildTable?.label || 'Record'}</span>
              <h2>{selectedBuildRecord ? getRecordTitle(base, selectedBuildRecord) : 'Select a record'}.</h2>
            </div>
            <div className="drawer-actions">
              <span className="metric-pill">{drawerBacklinks.length} backlinks</span>
              <span className="metric-pill">{drawerLinkedRecords.length} links out</span>
            </div>
          </div>

          {selectedBuildRecord ? (
            <>
              <div className="drawer-status-strip" aria-label="Record status">
                <span>{drawerStatusText}</span>
                <strong>{drawerDateText}</strong>
                <small>{drawerLinkedRecords.length} linked. {drawerBacklinks.length} backlinks. {drawerDependencies.length} dependencies.</small>
              </div>

              <div className="drawer-grid">
                {drawerKeyFields.map((field) => (
                  <article className="field-strip" key={field.id}>
                    <span>{field.label}</span>
                    <strong>{getFieldDisplayValue(selectedBuildRecord, field)}</strong>
                    <small>{field.type}</small>
                  </article>
                ))}
              </div>

              <div className="record-edit-layout">
                <section>
                  <div className="mini-title">
                    <strong>Edit record</strong>
                  </div>
                  <div className="record-form">
                    {editableFieldsForSelectedTable.map((field) =>
                      renderRecordInput(field, selectedBuildRecord.values[field.id], updateSelectedRecord),
                    )}
                  </div>
                </section>

                <section>
                  <div className="mini-title">
                    <strong>Backlinks</strong>
                  </div>
                  <div className="linked-list">
                    {drawerBacklinks.length === 0 && <p className="empty-line">No records point here.</p>}
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
              </div>

              <div className="linked-layout">
                <section id="followups">
                  <div className="mini-title">
                    <strong>Linked records</strong>
                  </div>
                  <div className="linked-list">
                    {drawerLinkedRecords.length === 0 && <p className="empty-line">No linked records selected.</p>}
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

                <section className="why-card">
                  <div className="mini-title">
                    <strong>Dependencies</strong>
                  </div>
                  <div className="dependency-editor" data-testid="dependency-editor">
                    <label>
                      <span>Relationship</span>
                      <select
                        value={dependencyDraft.relationship}
                        onChange={(event) =>
                          setDependencyDraft((current) => ({
                            ...current,
                            relationship: event.target.value as DependencyRelationship,
                          }))
                        }
                      >
                        <option value="dependsOn">Depends on</option>
                        <option value="blocks">Blocks</option>
                      </select>
                    </label>
                    <label>
                      <span>Find record</span>
                      <input
                        placeholder="Search records"
                        type="search"
                        value={dependencySearch}
                        onChange={(event) => setDependencySearch(event.target.value)}
                      />
                    </label>
                    {selectedDependencyTargetRecord && (
                      <button
                        className="selected-dependency-target"
                        type="button"
                        onClick={() => setDependencyDraft((current) => ({ ...current, toRecordId: '' }))}
                      >
                        <strong>{getRecordTitle(base, selectedDependencyTargetRecord)}</strong>
                        <small>Clear selected record</small>
                      </button>
                    )}
                    <div className="dependency-picker-list">
                      {dependencyPickerRecords.length === 0 && <p className="empty-note">No records match.</p>}
                      {dependencyPickerRecords.slice(0, 6).map((record) => {
                        const table = base.tables.find((tableItem) => tableItem.id === record.tableId)
                        const isSelected = dependencyDraft.toRecordId === record.id

                        return (
                          <button
                            className={isSelected ? 'selected' : ''}
                            key={record.id}
                            type="button"
                            onClick={() => setDependencyDraft((current) => ({ ...current, toRecordId: record.id }))}
                          >
                            <strong>{getRecordTitle(base, record)}</strong>
                            <small>{table?.label || record.tableId}. {getRecordContext(record)}</small>
                          </button>
                        )
                      })}
                    </div>
                    <label className="full-row">
                      <span>Reason</span>
                      <textarea
                        rows={3}
                        value={dependencyDraft.reason}
                        onChange={(event) => setDependencyDraft((current) => ({ ...current, reason: event.target.value }))}
                        placeholder="Why this link matters"
                      />
                    </label>
                    <button className="primary" disabled={!dependencyDraft.toRecordId} type="button" onClick={createDependency}>
                      Add dependency
                    </button>
                  </div>
                  {drawerDependencies.length > 0 ? (
                    <ol className="editable-dependency-list">
                      {drawerDependencies.map((dependency) => (
                        <li key={dependency.id}>
                          <div>
                            <button
                              className="dependency-record-link"
                              type="button"
                              onClick={() => openBuildRecord(dependency.record.tableId, dependency.record.id)}
                            >
                              {getDependencyLabel(dependency, selectedBuildRecord.id)} {dependency.record.title}.
                            </button>
                            <span>{dependency.record.tableLabel}</span>
                          </div>
                          <label>
                            <span>Type</span>
                            <select
                              value={dependency.relationship}
                              onChange={(event) =>
                                updateDependency(dependency.id, { relationship: event.target.value as DependencyRelationship })
                              }
                            >
                              <option value="dependsOn">Depends on</option>
                              <option value="blocks">Blocks</option>
                            </select>
                          </label>
                          <label>
                            <span>Reason</span>
                            <textarea
                              rows={2}
                              value={dependency.reason}
                              onChange={(event) => updateDependency(dependency.id, { reason: event.target.value })}
                            />
                          </label>
                          <div className="dependency-row-actions">
                            <button type="button" onClick={() => flipDependencyDirection(dependency.id)}>Flip direction</button>
                            <button className="danger" type="button" onClick={() => deleteDependency(dependency.id)}>Remove</button>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="empty-line">No dependency links for this record.</p>
                  )}
                </section>
              </div>
            </>
          ) : (
            <p className="empty-note">Create a record in Build to edit it here.</p>
          )}
        </section>

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
                <span>Selected task</span>
                <strong>{selectedTask ? getRecordTitle(base, selectedTask) : 'Task'}</strong>
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
                <button key={record.id}>
                  <span>{record.tableLabel}</span>
                  <strong>{record.title}</strong>
                  <small>{record.context}</small>
                </button>
              ))}
            </div>
          </article>
        </section>

        {activeScreen === 'timeline' && (
        <section className="screen-grid" data-testid="timeline-screen" id="timeline">
          <article className="screen-panel wide">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Timeline</span>
                <h2>Records by date.</h2>
              </div>
              <span className="metric-pill">{timelineRecords.length} shown</span>
            </div>
            <div className="grid-toolbar timeline-toolbar">
              <label>
                <span>Filter</span>
                <input
                  value={timelineFilter}
                  onChange={(event) => setTimelineFilter(event.target.value)}
                  placeholder="Find records"
                />
              </label>
              <label>
                <span>Table</span>
                <select value={timelineTableId} onChange={(event) => setTimelineTableId(event.target.value)}>
                  <option value="all">All tables</option>
                  {base.tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select value={timelineStatus} onChange={(event) => setTimelineStatus(event.target.value)}>
                  <option value="all">All statuses</option>
                  {timelineStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
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
              {timelineRecords.length === 0 && <p className="empty-note">No records match this timeline view.</p>}
            </div>
          </article>

          <article className="screen-panel">
            <div className="panel-title compact">
              <div>
                <span className="eyebrow">Status board</span>
                <h2>Current pressure.</h2>
              </div>
            </div>
            <div className="kanban-preview timeline-status-preview">
              <div><b>Waiting</b><p>{waitingTaskRecords.length + waitingFollowupRecords.length} records</p></div>
              <div><b>Blocked</b><p>{blockedTaskRecords.length} records</p></div>
              <div><b>In progress</b><p>{openTaskRecords.filter((record) => getStringValue(record, 'status') === 'In progress').length} records</p></div>
            </div>

            <div className="panel-title compact timeline-panel-gap">
              <div>
                <span className="eyebrow">Date sample</span>
                <h2>Next records.</h2>
              </div>
            </div>
            <div className="gantt-preview">
              {dailyTimelineRecords.slice(0, 5).map((record, index) => (
                <div key={record.id}>
                  <span>{getRecordTitle(base, record)}</span>
                  <i className={`bar ${index % 3 === 0 ? 'firebar' : index % 3 === 1 ? 'waitbar' : 'prepbar'}`} />
                  <em>{getRecordContext(record)}</em>
                </div>
              ))}
            </div>
          </article>
        </section>
        )}

        {activeScreen === 'build' && (
        <section className="build-zone build-reset" data-testid="build-screen" id="build">
          <article className="builder-panel wide build-workbench">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Build</span>
                <h2>{selectedBuildTable?.label}</h2>
              </div>
              <div className="drawer-actions">
                <span className="metric-pill">{sortedAndFilteredRecords.length} shown</span>
                {activeGridView && (
                  <span className={`metric-pill ${activeGridViewChanged ? 'changed-view' : 'active-view'}`}>
                    {activeGridViewChanged ? 'View changed' : 'View active'}: {activeGridView.name}
                  </span>
                )}
                <button onClick={() => setBuildModal('table')}>Add table</button>
                <button onClick={openTableSettings}>Rename table</button>
                <button className="danger" disabled={!canDeleteSelectedBuildTable} onClick={requestDeleteTable}>Delete table</button>
                <button onClick={() => setBuildModal('field')}>Add field</button>
                <button onClick={saveGridView}>Save view</button>
                <button className="danger" onClick={() => setBuildModal('resetLocalData')}>Reset local data</button>
              </div>
            </div>
            <div className="table-tabs" aria-label="Tables">
              {buildTableRows.map((table) => (
                <button
                  className={table.id === selectedBuildTable?.id ? 'selected' : ''}
                  data-testid={`build-table-${table.id}`}
                  key={table.id}
                  type="button"
                  onClick={() => selectBuildTable(table.id)}
                >
                  <strong>{table.label}</strong>
                  <span>{table.recordCount}</span>
                </button>
              ))}
            </div>
            <div className="grid-toolbar build-toolbar">
              <label>
                <span>View</span>
                <select
                  value={activeGridViewId}
                  onChange={(event) => {
                    const view = localGridViews.find((gridView) => gridView.id === event.target.value)

                    if (view) {
                      applyGridView(view)
                    } else {
                      setActiveGridViewId('')
                    }
                  }}
                >
                  <option value="">Current view</option>
                  {localGridViews.map((view) => (
                    <option key={view.id} value={view.id}>
                      {view.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Fields</span>
                <button className="toolbar-field-count" type="button" onClick={() => setBuildModal('field')}>
                  {visibleFieldsForGrid.length} shown
                </button>
              </label>
              <label>
                <span>Filter</span>
                <input
                  value={gridFilter}
                  onChange={(event) => setGridFilter(event.target.value)}
                  placeholder="Find in visible table"
                />
              </label>
              <label>
                <span>Sort</span>
                <select
                  value={gridSortFieldId}
                  onChange={(event) => {
                    setGridSortFieldId(event.target.value)
                    setGridSortDirection('asc')
                  }}
                >
                  <option value="">Manual</option>
                  {fieldsForSelectedTable.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Direction</span>
                <select value={gridSortDirection} onChange={(event) => setGridSortDirection(event.target.value as GridSortDirection)}>
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </label>
              <label>
                <span>Group</span>
                <select value={gridGroupFieldId} onChange={(event) => setGridGroupFieldId(event.target.value)}>
                  <option value="">None</option>
                  {fieldsForSelectedTable.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Colour</span>
                <select value={gridColorFieldId} onChange={(event) => setGridColorFieldId(event.target.value)}>
                  <option value="">None</option>
                  {fieldsForSelectedTable.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Density</span>
                <select value={gridDensity} onChange={(event) => setGridDensity(event.target.value as GridDensity)}>
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="expanded">Expanded</option>
                </select>
              </label>
            </div>
            <div className="view-bar">
              <div className="visible-field-list">
                {fieldsForSelectedTable.map((field) => (
                  <button
                    className={visibleFieldIds.includes(field.id) ? 'selected' : ''}
                    key={field.id}
                    type="button"
                    onClick={() => toggleVisibleField(field.id)}
                  >
                    {field.label}
                  </button>
                ))}
              </div>
              <div className="view-actions">
                {localGridViews.map((view) => (
                  <button
                    className={view.id === activeGridViewId ? 'selected' : ''}
                    key={view.id}
                    type="button"
                    onClick={() => applyGridView(view)}
                  >
                    {view.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="local-state-strip">
              <span>Local only</span>
              <strong>Grid state, widths, and saved views persist in this browser.</strong>
            </div>
            {migrationMessages.length > 0 && (
              <div className="local-state-strip migration-strip">
                <span>Migration</span>
                <strong>{migrationMessages.join(' ')}</strong>
              </div>
            )}
            {groupedRecords.map((group) => (
              <section className="record-grid-group" key={group.label || 'all-records'}>
                {groupField && (
                  <div className="group-header">
                    <strong>{group.label}</strong>
                    <span>{group.records.length} records</span>
                  </div>
                )}
                <div className="record-table-wrap">
                  <table className={`record-table density-${gridDensity}`}>
                    <thead>
                      <tr>
                        {visibleFieldsForGrid.map((field) => (
                          <th key={field.id} style={{ width: columnWidths[field.id] || 180, minWidth: columnWidths[field.id] || 180 }}>
                            {renderGridHeader(field, `${group.label || 'all'}:${field.id}`)}
                          </th>
                        ))}
                        <th className="add-field-column">
                          <button aria-label="Add field from grid" type="button" onClick={() => setBuildModal('field')}>+ Add field</button>
                        </th>
                        <th className="row-action-column">Saved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.records.map((record) => (
                        <tr
                          className={record.id === selectedBuildRecord?.id ? 'selected-row' : ''}
                          key={record.id}
                          onClick={() => setSelectedBuildRecordId(record.id)}
                          onDoubleClick={() => openEditRecordModal(record.id)}
                        >
                          {visibleFieldsForGrid.map((field) => (
                            <td
                              className={isSameGridCell(selectedGridCell, { recordId: record.id, fieldId: field.id }) ? 'selected-grid-cell' : ''}
                              key={field.id}
                              style={{ width: columnWidths[field.id] || 180, minWidth: columnWidths[field.id] || 180 }}
                            >
                              {renderEditableGridCell(record, field)}
                            </td>
                          ))}
                          <td className="add-field-cell" />
                          <td className="row-action-cell">
                            <button data-testid={`edit-record-${record.id}`} type="button" onClick={() => openEditRecordModal(record.id)}>Edit</button>
                          </td>
                        </tr>
                      ))}
                      <tr className="add-record-row">
                        <td colSpan={visibleFieldsForGrid.length + 2}>
                          <button data-testid="build-add-record" type="button" onClick={openCreateRecordModal}>+ Add record</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
            {sortedAndFilteredRecords.length === 0 && <p className="empty-note">No records match this filter.</p>}
          </article>

          <article className="automation-panel build-sidecar" data-testid="build-views-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Views</span>
                <h2>Saved ways to work.</h2>
              </div>
              <span className="metric-pill">{pinnedGridViews.length} pinned</span>
            </div>
            <p className="panel-copy">Saved views keep table context and can be pinned to the sidebar.</p>
            {localGridViews.length > 0 && (
              <div className="view-list">
                {localGridViews.map((view) => (
                  <article className={`local-view-row ${view.id === activeGridViewId ? 'active-row' : ''}`} data-testid="local-view-row" key={view.id}>
                    <div className="view-row-top">
                      <span>{base.tables.find((table) => table.id === view.tableId)?.label || view.tableId}</span>
                      {view.pinned ? (
                        <strong>Pinned</strong>
                      ) : view.id === activeGridViewId && (
                        <strong>{activeGridViewChanged ? 'Changed' : 'Active'}</strong>
                      )}
                    </div>
                    <label>
                      <span>View name</span>
                      <input
                        value={viewRenameDrafts[view.id] ?? view.name}
                        onChange={(event) => setViewRenameDrafts((current) => ({ ...current, [view.id]: event.target.value }))}
                      />
                    </label>
                    <p>
                      Filter: {view.filter || 'none'}. Sort: {view.sortFieldId || 'manual'} {view.sortDirection || 'asc'}. Group: {view.groupFieldId || 'none'}.
                    </p>
                    <div className="view-actions">
                      <button onClick={() => applyGridView(view)}>Apply</button>
                      <button onClick={() => updateGridView(view.id)}>Update</button>
                      <button onClick={() => duplicateGridView(view)}>Copy</button>
                      <button onClick={() => togglePinnedGridView(view.id)}>{view.pinned ? 'Unpin' : 'Pin'}</button>
                      {view.id === activeGridViewId && activeGridViewChanged && (
                        <button onClick={resetActiveGridView}>Reset</button>
                      )}
                      <button onClick={() => renameGridView(view.id)}>Rename</button>
                      <button className="danger" onClick={() => deleteGridView(view.id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="view-list">
              {savedViews.map((view) => (
                <article key={view.id}>
                  <span>{view.type}</span>
                  <strong>{view.name}</strong>
                  <p>{view.rule}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="automation-panel build-sidecar" data-testid="rules-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Rules</span>
                <h2>When this happens, do this.</h2>
              </div>
              <button className="primary" type="button" onClick={createLocalRule}>New rule</button>
            </div>
            <div className="rules editable-rules">
              {localRules.map((rule) => (
                <article data-testid="local-rule-row" key={rule.id}>
                  <label>
                    <span>Table</span>
                    <select
                      value={rule.tableId}
                      onChange={(event) => {
                        const tableId = event.target.value
                        const nextFieldId = base.fields.find((field) => field.tableId === tableId)?.id || ''

                        updateLocalRuleField(rule.id, tableId, nextFieldId)
                      }}
                    >
                      {base.tables.map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Field</span>
                    <select
                      value={rule.fieldId}
                      onChange={(event) => updateLocalRuleField(rule.id, rule.tableId, event.target.value)}
                    >
                      {base.fields
                        .filter((field) => field.tableId === rule.tableId)
                        .map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.label}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    <span>Operator</span>
                    <select
                      value={rule.operator}
                      onChange={(event) => {
                        const operator = event.target.value as LocalRule['operator']

                        updateLocalRule(rule.id, {
                          operator,
                          value: ruleOperatorNeedsValue(operator) ? rule.value : '',
                        })
                      }}
                    >
                      {getRuleOperatorOptionsForField(base.fields.find((field) => field.tableId === rule.tableId && field.id === rule.fieldId))
                        .map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    <span>Value</span>
                    {base.fields.find((field) => field.tableId === rule.tableId && field.id === rule.fieldId)?.type === 'linkedRecord' && ruleOperatorNeedsValue(rule.operator) ? (
                      <select value={rule.value} onChange={(event) => updateLocalRule(rule.id, { value: event.target.value })}>
                        <option value="">Choose record</option>
                        {getRecordsForTable(
                          base,
                          base.fields.find((field) => field.tableId === rule.tableId && field.id === rule.fieldId)?.linkedTableId || '',
                        ).map((record) => (
                          <option key={record.id} value={record.id}>
                            {getRecordTitle(base, record)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        disabled={!ruleOperatorNeedsValue(rule.operator)}
                        type={isDateField(base.fields.find((field) => field.tableId === rule.tableId && field.id === rule.fieldId)) && ruleOperatorNeedsValue(rule.operator) ? 'date' : 'text'}
                        value={rule.value}
                        onChange={(event) => updateLocalRule(rule.id, { value: event.target.value })}
                        placeholder={ruleOperatorNeedsValue(rule.operator) ? 'Value to match' : 'Computed from today'}
                      />
                    )}
                  </label>
                  <label>
                    <span>Action</span>
                    <select
                      value={rule.action}
                      onChange={(event) => updateLocalRule(rule.id, { action: event.target.value as LocalRule['action'] })}
                    >
                      {ruleActionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Destination</span>
                    <select
                      value={rule.destination}
                      onChange={(event) => updateLocalRule(rule.id, { destination: event.target.value as LocalRule['destination'] })}
                    >
                      {ruleDestinationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p>{getRulePreview(rule)}</p>
                  {getRuleValidationMessages(rule).length > 0 && (
                    <div className="rule-validation-list">
                      {getRuleValidationMessages(rule).map((message) => (
                        <span key={message}>{message}</span>
                      ))}
                    </div>
                  )}
                  <span className="rule-match-count">{getRuleMatchCount(rule)} matching records</span>
                  {getRuleMatchedRecords(rule).length > 0 && (
                    <div className="rule-match-list">
                      {getRuleMatchedRecords(rule).slice(0, 3).map((record) => (
                        <button key={record.id} type="button" onClick={() => openBuildRecord(record.tableId, record.id)}>
                          <strong>{getRecordTitle(base, record)}</strong>
                          <small>{base.tables.find((table) => table.id === record.tableId)?.label || record.tableId}</small>
                        </button>
                      ))}
                    </div>
                  )}
                  <button className="danger" type="button" onClick={() => deleteLocalRule(rule.id)}>Delete</button>
                </article>
              ))}
            </div>
          </article>

          {buildModal === 'table' && (
            <div className="modal-backdrop" role="presentation">
              <section className="build-modal" role="dialog" aria-modal="true" aria-label="Add table">
                <div className="modal-header">
                  <div>
                    <span className="eyebrow">Table</span>
                    <h2>Add table.</h2>
                  </div>
                  <button className="ghost" type="button" onClick={closeBuildModal}>Close</button>
                </div>
                <div className="build-form table-builder-form">
                  <label>
                    <span>Table name</span>
                    <input
                      value={tableDraft.label}
                      onChange={(event) => setTableDraft((current) => ({ ...current, label: event.target.value }))}
                      placeholder="Partners"
                    />
                  </label>
                  <label>
                    <span>Purpose</span>
                    <input
                      value={tableDraft.description}
                      onChange={(event) => setTableDraft((current) => ({ ...current, description: event.target.value }))}
                      placeholder="People or groups tied to the work."
                    />
                  </label>
                </div>
                <div className="modal-actions">
                  <button className="ghost" type="button" onClick={closeBuildModal}>Cancel</button>
                  <button className="primary" type="button" onClick={createTable}>Add table</button>
                </div>
              </section>
            </div>
          )}

          {buildModal === 'tableSettings' && selectedBuildTable && (
            <div className="modal-backdrop" role="presentation">
              <section className="build-modal" role="dialog" aria-modal="true" aria-label="Table settings">
                <div className="modal-header">
                  <div>
                    <span className="eyebrow">Table</span>
                    <h2>Rename table.</h2>
                  </div>
                  <button className="ghost" type="button" onClick={closeBuildModal}>Close</button>
                </div>
                <div className="build-form table-builder-form">
                  <label>
                    <span>Table name</span>
                    <input
                      value={tableSettingsDraft.label}
                      onChange={(event) => setTableSettingsDraft((current) => ({ ...current, label: event.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Purpose</span>
                    <input
                      value={tableSettingsDraft.description}
                      onChange={(event) => setTableSettingsDraft((current) => ({ ...current, description: event.target.value }))}
                    />
                  </label>
                </div>
                <div className="modal-actions">
                  <button className="ghost" type="button" onClick={closeBuildModal}>Cancel</button>
                  <button className="primary" type="button" onClick={renameTable}>Save table</button>
                </div>
              </section>
            </div>
          )}

          {buildModal === 'deleteTable' && pendingDeleteTable && (
            <div className="modal-backdrop" role="presentation">
              <section className="build-modal confirm-modal" role="dialog" aria-modal="true" aria-label="Delete table">
                <div className="modal-header">
                  <div>
                    <span className="eyebrow">Delete</span>
                    <h2>Delete {pendingDeleteTable.label}.</h2>
                  </div>
                </div>
                <p>This removes the table, its fields, its records, its saved views, and any links pointing to those records.</p>
                <p>This cannot be undone in this local build.</p>
                <div className="modal-actions">
                  <button className="ghost" type="button" onClick={closeBuildModal}>Cancel</button>
                  <button className="danger" type="button" onClick={() => deleteTable(pendingDeleteTable.id)}>Delete table</button>
                </div>
              </section>
            </div>
          )}

          {buildModal === 'resetLocalData' && (
            <div className="modal-backdrop" role="presentation">
              <section className="build-modal confirm-modal" role="dialog" aria-modal="true" aria-label="Reset local data">
                <div className="modal-header">
                  <div>
                    <span className="eyebrow">Reset</span>
                    <h2>Reset local data.</h2>
                  </div>
                </div>
                <p>This restores the starter workbase in this browser.</p>
                <p>Saved views and rules stay local. Record, table, and field edits return to the starter set.</p>
                <div className="modal-actions">
                  <button className="ghost" type="button" onClick={closeBuildModal}>Cancel</button>
                  <button className="danger" type="button" onClick={resetLocalWorkbase}>Reset local data</button>
                </div>
              </section>
            </div>
          )}

          {buildModal === 'field' && (
            <div className="modal-backdrop" role="presentation">
              <section className="build-modal" role="dialog" aria-modal="true" aria-label="Add field">
                <div className="modal-header">
                  <div>
                    <span className="eyebrow">Field</span>
                    <h2>Add field.</h2>
                  </div>
                  <button className="ghost" type="button" onClick={closeBuildModal}>Close</button>
                </div>
                <div className="build-form field-builder-form">
                  <label>
                    <span>Field name</span>
                    <input
                      value={fieldDraft.label}
                      onChange={(event) => setFieldDraft((current) => ({ ...current, label: event.target.value }))}
                      placeholder="COI status"
                    />
                  </label>
                  <label>
                    <span>Type</span>
                    <select
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
                    <label className="full-row">
                      <span>Options</span>
                      <textarea
                        value={fieldDraft.options}
                        onChange={(event) => setFieldDraft((current) => ({ ...current, options: event.target.value }))}
                        rows={3}
                      />
                    </label>
                  )}
                  {fieldDraft.type === 'checkbox' && (
                    <>
                      <label className="full-row">
                        <span>Icon</span>
                        <div className="checkbox-style-grid">
                          {checkboxIconOptions.map((option) => (
                            <button
                              aria-label={option.label}
                              className={fieldDraft.checkboxIcon === option.value ? 'selected' : ''}
                              key={option.value}
                              type="button"
                              onClick={() => setFieldDraft((current) => ({ ...current, checkboxIcon: option.value }))}
                            >
                              {renderCheckboxIcon(option.value)}
                            </button>
                          ))}
                        </div>
                      </label>
                      <label className="full-row">
                        <span>Colour</span>
                        <div className="checkbox-color-grid">
                          {checkboxColorOptions.map((option) => (
                            <button
                              aria-label={option.label}
                              className={`check-${option.value} ${fieldDraft.checkboxColor === option.value ? 'selected' : ''}`}
                              key={option.value}
                              type="button"
                              onClick={() => setFieldDraft((current) => ({ ...current, checkboxColor: option.value }))}
                            />
                          ))}
                        </div>
                      </label>
                    </>
                  )}
                  {fieldDraft.type === 'linkedRecord' && (
                    <>
                      <label>
                        <span>Linked table</span>
                        <select
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
                      <label className="checkbox-row">
                        <span>Allow multiple linked records</span>
                        <input
                          checked={fieldDraft.allowMultiple}
                          type="checkbox"
                          onChange={(event) => setFieldDraft((current) => ({ ...current, allowMultiple: event.target.checked }))}
                        />
                      </label>
                    </>
                  )}
                  {(fieldDraft.type === 'lookup' || fieldDraft.type === 'rollup' || fieldDraft.type === 'count') && (
                    <label>
                      <span>Source link</span>
                      <select
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
                      <span>Source field</span>
                      <select
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
                </div>
                <div className="build-grid field-grid modal-field-types">
                  {buildFieldTypes.map((fieldType) => (
                    <button key={fieldType} type="button">{fieldType}</button>
                  ))}
                </div>
                <div className="modal-actions">
                  <button className="ghost" type="button" onClick={closeBuildModal}>Cancel</button>
                  <button className="primary" type="button" onClick={createField}>Add field</button>
                </div>
              </section>
            </div>
          )}

          {buildModal === 'fieldSettings' && settingsField && (
            <div className="modal-backdrop" role="presentation">
              <section className="build-modal" role="dialog" aria-modal="true" aria-label="Field settings">
                <div className="modal-header">
                  <div>
                    <span className="eyebrow">Field settings</span>
                    <h2>{settingsField.label}</h2>
                  </div>
                  <button className="ghost" type="button" onClick={closeBuildModal}>Close</button>
                </div>
                <div className="build-form field-builder-form">
                  <label>
                    <span>Field name</span>
                    <input
                      value={settingsField.label}
                      onChange={(event) => updateField(settingsField.id, { label: event.target.value })}
                    />
                  </label>
                  <label>
                    <span>Type</span>
                    <select
                      value={settingsField.type}
                      onChange={(event) => updateField(settingsField.id, { type: event.target.value as FieldType })}
                    >
                      {fieldTypeOptions.map((fieldType) => (
                        <option key={fieldType.value} value={fieldType.value}>
                          {fieldType.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {optionFieldTypes.includes(settingsField.type) && (
                    <label className="full-row">
                      <span>Options</span>
                      <textarea
                        value={(settingsField.options || []).join(', ')}
                        rows={3}
                        onChange={(event) => updateField(settingsField.id, { options: parseOptions(event.target.value) })}
                      />
                    </label>
                  )}
                  {settingsField.type === 'checkbox' && (
                    <>
                      <label className="full-row">
                        <span>Icon</span>
                        <div className="checkbox-style-grid">
                          {checkboxIconOptions.map((option) => (
                            <button
                              aria-label={option.label}
                              className={(settingsField.checkboxIcon || 'check') === option.value ? 'selected' : ''}
                              key={option.value}
                              type="button"
                              onClick={() => updateField(settingsField.id, { checkboxIcon: option.value })}
                            >
                              {renderCheckboxIcon(option.value)}
                            </button>
                          ))}
                        </div>
                      </label>
                      <label className="full-row">
                        <span>Colour</span>
                        <div className="checkbox-color-grid">
                          {checkboxColorOptions.map((option) => (
                            <button
                              aria-label={option.label}
                              className={`check-${option.value} ${(settingsField.checkboxColor || 'lime') === option.value ? 'selected' : ''}`}
                              key={option.value}
                              type="button"
                              onClick={() => updateField(settingsField.id, { checkboxColor: option.value })}
                            />
                          ))}
                        </div>
                      </label>
                    </>
                  )}
                  {settingsField.type === 'linkedRecord' && (
                    <>
                      <label>
                        <span>Linked table</span>
                        <select
                          value={settingsField.linkedTableId || ''}
                          onChange={(event) => updateField(settingsField.id, { linkedTableId: event.target.value })}
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
                      <label className="checkbox-row">
                        <span>Allow multiple linked records</span>
                        <input
                          checked={settingsField.allowMultiple ?? true}
                          type="checkbox"
                          onChange={(event) => updateField(settingsField.id, { allowMultiple: event.target.checked })}
                        />
                      </label>
                    </>
                  )}
                </div>
                <div className="modal-actions">
                  <button className="primary" type="button" onClick={closeBuildModal}>Done</button>
                </div>
              </section>
            </div>
          )}

          {buildModal === 'deleteField' && pendingDeleteField && (
            <div className="modal-backdrop" role="presentation">
              <section className="build-modal confirm-modal" role="dialog" aria-modal="true" aria-label="Delete field">
                <div className="modal-header">
                  <div>
                    <span className="eyebrow">Delete</span>
                    <h2>Delete field.</h2>
                  </div>
                </div>
                <p>This removes the field from every record in this table.</p>
                <p>This cannot be undone in this local build.</p>
                <div className="modal-actions">
                  <button className="ghost" type="button" onClick={closeBuildModal}>Cancel</button>
                  <button className="danger" type="button" onClick={() => deleteField(pendingDeleteField)}>Delete field</button>
                </div>
              </section>
            </div>
          )}

        </section>
        )}

        {activeScreen === 'settings' && (
        <section className="settings-zone" data-testid="settings-screen" id="settings">
          <article className="settings-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Settings</span>
                <h2>Appearance.</h2>
              </div>
            </div>
            <div className="theme-grid">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  className={theme.value === selectedTheme ? 'selected' : ''}
                  onClick={() => setSelectedTheme(theme.value)}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </article>

          <article className="settings-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Digest</span>
                <h2>Morning summary.</h2>
              </div>
            </div>
            <div className="settings-list">
              <p><strong>Status.</strong> On</p>
              <p><strong>Recipient.</strong> lindsaybelldesign@gmail.com</p>
              <p><strong>Time.</strong> 7:30 AM</p>
              <p><strong>Timezone.</strong> America/Toronto</p>
              <p><strong>Includes.</strong> Today queue, overdue follow-ups, at-risk communities, meeting prep.</p>
              <p><strong>Actions.</strong> Preview digest. Send test digest.</p>
            </div>
          </article>

          <article className="settings-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Privacy</span>
                <h2>Upload at your own risk.</h2>
              </div>
            </div>
            <div className="settings-list">
              <p><strong>Boundary.</strong> Sundesk is for status, dates, owners, links, and short notes.</p>
              <p><strong>Sensitive information.</strong> Files, document contents, private numbers, permits, COI files, and contract text are your responsibility if added.</p>
              <p><strong>Build notes.</strong> Obsidian is for session memory only. No product data goes there.</p>
            </div>
          </article>

          <article className="settings-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Local engine</span>
                <h2>Browser state.</h2>
              </div>
              <span className="metric-pill">Local only</span>
            </div>
            <div className="engine-stat-grid">
              {localEngineStats.map((stat) => (
                <div key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
            <div className="settings-list">
              <p><strong>Storage.</strong> Tables, fields, records, dependencies, Rules, and Build views are saved in this browser.</p>
              <p><strong>Repair.</strong> {migrationMessages.length > 0 ? migrationMessages.join(' ') : 'No local repair was needed on this load.'}</p>
              <p><strong>Network.</strong> No Firebase writes in this local build.</p>
            </div>
          </article>

          <article className="settings-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Rule engine</span>
                <h2>Read targets.</h2>
              </div>
              <span className="metric-pill">{localRules.length} Rules</span>
            </div>
            <div className="rule-destination-grid" data-testid="rule-destination-grid">
              {ruleDestinationStats.map((stat) => (
                <div key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.matches}</strong>
                  <small>{stat.rules} Rules</small>
                </div>
              ))}
            </div>
          </article>

          <article className="settings-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Setup</span>
                <h2>Run setup again.</h2>
              </div>
              <button>Run setup again</button>
            </div>
            <div className="settings-list">
              <p><strong>Review privacy.</strong> Show the warning again.</p>
              <p><strong>Choose theme.</strong> Keep or change the saved theme.</p>
              <p><strong>Check digest.</strong> Recipient, time, timezone, and included items.</p>
              <p><strong>Review starter tables.</strong> No data will be deleted.</p>
            </div>
          </article>
        </section>
        )}
        {renderRecordModal()}
      </section>
    </main>
  )
}

export default App
