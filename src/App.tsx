import './App.css'
import { useEffect, useState, type PointerEvent } from 'react'
import {
  automationRules,
  buildFieldTypes,
  priorityItems,
  savedViews,
  type Priority,
} from './data/demoData'
import {
  type BaseRecord,
  type CheckboxColor,
  type CheckboxIcon,
  type FieldDefinition,
  type FieldType,
  type RecordValue,
  type Workbase,
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
const computedFieldTypes: FieldType[] = ['lookup', 'rollup', 'count', 'systemFormula', 'createdTime', 'lastUpdatedTime']
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
const buildTableOrder = ['risks', 'tasks', 'followups', 'approvals', 'meetings', 'people']

type LocalGridView = {
  id: string
  name: string
  tableId: string
  filter: string
  sortFieldId: string
  groupFieldId: string
  visibleFieldIds: string[]
}

type BuildModal = '' | 'table' | 'tableSettings' | 'deleteTable' | 'field' | 'fieldSettings' | 'deleteField' | 'record'

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

  return slug || `field_${Date.now()}`
}

function cloneWorkbase(base: Workbase): Workbase {
  return {
    tables: base.tables.map((table) => ({ ...table })),
    fields: base.fields.map((field) => ({
      ...field,
      options: field.options ? [...field.options] : undefined,
    })),
    records: base.records.map((record) => ({ ...record, values: { ...record.values } })),
    dependencies: base.dependencies.map((dependency) => ({ ...dependency })),
  }
}

function getEmptyRecordValues(base: Workbase, tableId: string) {
  const values: Record<string, RecordValue> = {}

  base.fields
    .filter((field) => field.tableId === tableId && !computedFieldTypes.includes(field.type))
    .forEach((field) => {
      values[field.id] = getEmptyFieldValue(field.type)
    })

  return values
}

function getEmptyFieldValue(fieldType: FieldType): RecordValue {
  if (fieldType === 'checkbox') {
    return false
  }

  if (fieldType === 'linkedRecord' || fieldType === 'multiSelect') {
    return []
  }

  return ''
}

function toggleListValue(values: string[], value: string, allowMultiple = true) {
  if (!allowMultiple) {
    return values.includes(value) ? [] : [value]
  }

  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

function getDefaultVisibleFieldIds(fields: FieldDefinition[]) {
  return fields.slice(0, 5).map((field) => field.id)
}

function getOptionColorClass(value: string) {
  const colorIndex = value.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0) % optionColorClassNames.length

  return optionColorClassNames[colorIndex]
}

function getStringValue(record: BaseRecord, fieldId: string) {
  const value = record.values[fieldId]

  return typeof value === 'string' ? value : ''
}

function getNumberValue(record: BaseRecord, fieldId: string) {
  const value = record.values[fieldId]

  return typeof value === 'number' ? value : 0
}

function getFirstDateValue(record: BaseRecord) {
  return getStringValue(record, 'dueDate') || getStringValue(record, 'eventDate') || getStringValue(record, 'date')
}

function sortRecordsByDate(records: BaseRecord[]) {
  return [...records].sort((firstRecord, secondRecord) => getFirstDateValue(firstRecord).localeCompare(getFirstDateValue(secondRecord)))
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

function priorityLabel(priority: Priority) {
  const labels: Record<Priority, string> = {
    fire: 'Fire',
    urgent: 'Urgent',
    waiting: 'Waiting',
    prep: 'Prep',
    routine: 'Routine',
  }

  return labels[priority]
}

function App() {
  const [selectedTheme, setSelectedTheme] = useState(
    () => localStorage.getItem('sundesk-theme') || 'sunrise-soft',
  )
  const [activeScreen, setActiveScreen] = useState<AppScreen>(() => getScreenFromHash())
  const [base, setBase] = useState(() => cloneWorkbase(workbase))
  const [selectedBuildTableId, setSelectedBuildTableId] = useState('risks')
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
  const [visibleFieldIdsByTable, setVisibleFieldIdsByTable] = useState<Record<string, string[]>>(() => ({
    communities: ['name', 'status', 'eventDate', 'readiness', 'openTaskCount'],
    tasks: ['title', 'status', 'dueDate', 'priority', 'community'],
  }))
  const [gridFilter, setGridFilter] = useState('')
  const [gridSortFieldId, setGridSortFieldId] = useState('title')
  const [gridGroupFieldId, setGridGroupFieldId] = useState('level')
  const [localGridViews, setLocalGridViews] = useState<LocalGridView[]>([])
  const [viewRenameDrafts, setViewRenameDrafts] = useState<Record<string, string>>({})
  const [activeGridViewId, setActiveGridViewId] = useState('')
  const [openFieldMenuId, setOpenFieldMenuId] = useState('')
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [buildModal, setBuildModal] = useState<BuildModal>('')
  const [pendingDeleteTableId, setPendingDeleteTableId] = useState('')
  const [selectedFieldSettingsId, setSelectedFieldSettingsId] = useState('')
  const [pendingDeleteFieldId, setPendingDeleteFieldId] = useState('')
  const [isCreatingRecord, setIsCreatingRecord] = useState(false)
  const selectedTask = getRecord(base, 'task_coi_halifax')
  const selectedTaskLinks = getLinkedRecordsForRecord(base, 'task_coi_halifax')
  const selectedTaskBacklinks = getBacklinksForRecord(base, 'task_coi_halifax')
  const selectedTaskDependencies = getDependencyReferencesForRecord(base, 'task_coi_halifax')
  const recordPickerItems = getRecordReferences(base).slice(0, 8)
  const materializedLinks = getMaterializedLinks(base)
  const taskCommunityEventDate = getLookupPreview(base, 'task_coi_halifax', 'communityEventDate')
  const localTableRows = base.tables.map((table) => ({
    ...table,
    recordCount: getRecordsForTable(base, table.id).length,
    fieldCount: base.fields.filter((field) => field.tableId === table.id).length,
  }))
  const buildTableRows = localTableRows
    .filter((table) => table.id !== 'communities')
    .sort((firstTable, secondTable) => {
      const firstIndex = buildTableOrder.includes(firstTable.id) ? buildTableOrder.indexOf(firstTable.id) : buildTableOrder.length
      const secondIndex = buildTableOrder.includes(secondTable.id) ? buildTableOrder.indexOf(secondTable.id) : buildTableOrder.length

      return firstIndex - secondIndex
    })
  const selectedBuildTable = base.tables.find((table) => table.id === selectedBuildTableId) || base.tables[0]
  const fieldsForSelectedTable = base.fields.filter((field) => field.tableId === selectedBuildTable?.id)
  const editableFieldsForSelectedTable = fieldsForSelectedTable.filter((field) => !computedFieldTypes.includes(field.type))
  const recordsForSelectedTable = selectedBuildTable ? getRecordsForTable(base, selectedBuildTable.id) : []
  const taskRecords = getRecordsForTable(base, 'tasks')
  const approvalRecords = getRecordsForTable(base, 'approvals')
  const riskRecords = getRecordsForTable(base, 'risks')
  const followupRecords = getRecordsForTable(base, 'followups')
  const meetingRecords = getRecordsForTable(base, 'meetings')
  const communityRecords = getRecordsForTable(base, 'communities')
  const openTaskRecords = taskRecords.filter((record) => getStringValue(record, 'status') !== 'Done')
  const blockedTaskRecords = taskRecords.filter((record) => getStringValue(record, 'status') === 'Blocked')
  const waitingTaskRecords = taskRecords.filter((record) => getStringValue(record, 'status') === 'Waiting')
  const waitingFollowupRecords = followupRecords.filter((record) => getStringValue(record, 'status') === 'Waiting')
  const openApprovalRecords = approvalRecords.filter((record) => !['Received', 'Not needed'].includes(getStringValue(record, 'status')))
  const highRiskRecords = riskRecords.filter((record) => getStringValue(record, 'level') === 'High')
  const atRiskCommunityRecords = communityRecords.filter((record) => {
    const status = getStringValue(record, 'status')

    return status === 'At risk' || status === 'Blocked' || getNumberValue(record, 'readiness') < 70
  })
  const nextMeetingRecord = sortRecordsByDate(meetingRecords)[0]
  const nextMeetingLinkedTasks = nextMeetingRecord ? getLinkedRecordsForRecord(base, nextMeetingRecord.id).filter((link) => link.record.tableId === 'tasks') : []
  const dailyTimelineRecords = sortRecordsByDate([
    ...communityRecords,
    ...openTaskRecords,
    ...waitingFollowupRecords,
    ...meetingRecords,
  ])
  const todayLanes = [
    {
      id: 'now',
      label: 'Now',
      title: 'Move the work that can burn the day.',
      records: [...blockedTaskRecords, ...highRiskRecords].slice(0, 4),
    },
    {
      id: 'waiting',
      label: 'Waiting',
      title: 'Hold every open loop that depends on someone else.',
      records: [...waitingFollowupRecords, ...waitingTaskRecords, ...openApprovalRecords].slice(0, 4),
    },
    {
      id: 'next',
      label: 'Next',
      title: 'Pull work forward before it becomes urgent.',
      records: sortRecordsByDate([...meetingRecords, ...openTaskRecords]).slice(0, 4),
    },
  ]
  const screenStats = [
    { label: 'Communities', value: communityRecords.length, detail: `${atRiskCommunityRecords.length} need attention` },
    { label: 'Open tasks', value: openTaskRecords.length, detail: `${blockedTaskRecords.length} blocked` },
    { label: 'Waiting loops', value: waitingFollowupRecords.length, detail: `${openApprovalRecords.length} open approvals` },
    { label: 'Risks', value: riskRecords.length, detail: `${highRiskRecords.length} high` },
  ]
  const followupCommunityField = base.fields.find((field) => field.tableId === 'followups' && field.id === 'community')
  const meetingTasksField = base.fields.find((field) => field.tableId === 'meetings' && field.id === 'tasks')
  const visibleFieldIds = selectedBuildTable
    ? visibleFieldIdsByTable[selectedBuildTable.id] || getDefaultVisibleFieldIds(fieldsForSelectedTable)
    : []
  const visibleFieldsForGrid = fieldsForSelectedTable.filter((field) => visibleFieldIds.includes(field.id))
  const sortedAndFilteredRecords = recordsForSelectedTable
    .filter((record) => {
      const filter = gridFilter.trim().toLowerCase()

      if (!filter) {
        return true
      }

      return fieldsForSelectedTable.some((field) => getFieldDisplayValue(record, field).toLowerCase().includes(filter))
    })
    .sort((firstRecord, secondRecord) => {
      if (!gridSortFieldId) {
        return 0
      }

      const field = fieldsForSelectedTable.find((fieldItem) => fieldItem.id === gridSortFieldId)

      if (!field) {
        return 0
      }

      return getFieldDisplayValue(firstRecord, field).localeCompare(getFieldDisplayValue(secondRecord, field), undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    })
  const groupField = fieldsForSelectedTable.find((field) => field.id === gridGroupFieldId)
  const groupedRecords = groupField
    ? sortedAndFilteredRecords.reduce<{ label: string; records: BaseRecord[] }[]>((groups, record) => {
        const label = getFieldDisplayValue(record, groupField)
        const existingGroup = groups.find((group) => group.label === label)

        if (existingGroup) {
          existingGroup.records.push(record)
          return groups
        }

        return [...groups, { label, records: [record] }]
      }, [])
    : [{ label: '', records: sortedAndFilteredRecords }]
  const selectedBuildRecord = recordsForSelectedTable.find((record) => record.id === selectedBuildRecordId) || recordsForSelectedTable[0]
  const drawerBacklinks = selectedBuildRecord ? getBacklinksForRecord(base, selectedBuildRecord.id) : []
  const drawerLinkedRecords = selectedBuildRecord ? getLinkedRecordsForRecord(base, selectedBuildRecord.id) : []
  const drawerDependencies = selectedBuildRecord ? getDependencyReferencesForRecord(base, selectedBuildRecord.id) : []
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
      activeGridView.groupFieldId !== gridGroupFieldId ||
      activeGridView.visibleFieldIds.join('|') !== visibleFieldIds.join('|')
    : false
  const canDeleteSelectedBuildTable = Boolean(
    selectedBuildTable && selectedBuildTable.id !== 'communities' && buildTableRows.length > 1,
  )
  const settingsField = fieldsForSelectedTable.find((field) => field.id === selectedFieldSettingsId)
  const pendingDeleteField = fieldsForSelectedTable.find((field) => field.id === pendingDeleteFieldId)
  const pendingDeleteTable = base.tables.find((table) => table.id === pendingDeleteTableId)

  function closeBuildModal() {
    setBuildModal('')
    setPendingDeleteTableId('')
    setSelectedFieldSettingsId('')
    setPendingDeleteFieldId('')
    setIsCreatingRecord(false)
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

    const id = toSlug(label)
    const uniqueId = base.tables.some((table) => table.id === id) ? `${id}_${base.tables.length + 1}` : id

    setBase((current) => ({
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
          type: 'text',
        },
      ],
    }))
    setSelectedBuildTableId(uniqueId)
    setSelectedBuildRecordId('')
    setVisibleFieldIdsByTable((current) => ({ ...current, [uniqueId]: ['name'] }))
    setGridFilter('')
    setGridSortFieldId('name')
    setGridGroupFieldId('')
    setActiveGridViewId('')
    setRecordDraft({ name: '' })
    setTableDraft({ label: '', description: '' })
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

    setBase((current) => ({
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
    }))
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

    setBase((current) => ({
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
    }))
    setSelectedBuildTableId(nextBuildTable.id)
    setSelectedBuildRecordId(getRecordsForTable(base, nextBuildTable.id)[0]?.id || '')
    setGridFilter('')
    setGridSortFieldId(nextBuildTable.primaryFieldId)
    setGridGroupFieldId(base.fields.find((field) => field.tableId === nextBuildTable.id && field.id === 'status')?.id || '')
    setActiveGridViewId('')
    setRecordDraft(getEmptyRecordValues(base, nextBuildTable.id))
    setVisibleFieldIdsByTable((current) => {
      const nextVisibleFields = { ...current }
      delete nextVisibleFields[tableId]

      return nextVisibleFields
    })
    setColumnWidths((current) => {
      const nextWidths = { ...current }

      fieldsToDelete.forEach((fieldId) => {
        delete nextWidths[fieldId]
      })

      return nextWidths
    })
    setLocalGridViews((current) => current.filter((view) => view.tableId !== tableId))
    setViewRenameDrafts((current) => {
      const deletedViewIds = localGridViews.filter((view) => view.tableId === tableId).map((view) => view.id)
      const nextDrafts = { ...current }

      deletedViewIds.forEach((viewId) => {
        delete nextDrafts[viewId]
      })

      return nextDrafts
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
    const id = base.fields.some((field) => field.tableId === tableId && field.id === baseId)
      ? `${baseId}_${fieldsForSelectedTable.length + 1}`
      : baseId
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

    setBase((current) => ({
      ...current,
      fields: [...current.fields, field],
    }))
    if (!computedFieldTypes.includes(field.type)) {
      setRecordDraft((current) => ({
        ...current,
        [field.id]: getEmptyFieldValue(field.type),
      }))
      setVisibleFieldIdsByTable((current) => ({
        ...current,
        [tableId]: [...(current[tableId] || getDefaultVisibleFieldIds(fieldsForSelectedTable)), field.id],
      }))
    }
    setFieldDraft((current) => ({ ...current, label: '' }))
    closeBuildModal()
  }

  function updateField(fieldId: string, updates: Partial<FieldDefinition>) {
    const tableId = selectedBuildTable?.id

    if (!tableId) {
      return
    }

    setBase((current) => ({
      ...current,
      fields: current.fields.map((field) =>
        field.tableId === tableId && field.id === fieldId ? { ...field, ...updates } : field,
      ),
    }))
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

    setBase((current) => ({
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
    }))
    setRecordDraft((current) => {
      const nextDraft = { ...current }
      delete nextDraft[field.id]

      return nextDraft
    })
    setVisibleFieldIdsByTable((current) => ({
      ...current,
      [tableId]: (current[tableId] || []).filter((fieldId) => fieldId !== field.id),
    }))
    setColumnWidths((current) => {
      const nextWidths = { ...current }
      delete nextWidths[field.id]

      return nextWidths
    })
    if (gridSortFieldId === field.id) {
      setGridSortFieldId(selectedBuildTable.primaryFieldId)
    }
    if (gridGroupFieldId === field.id) {
      setGridGroupFieldId('')
    }
    setOpenFieldMenuId('')
    closeBuildModal()
  }

  function selectBuildTable(tableId: string) {
    const nextRecord = getRecordsForTable(base, tableId)[0]

    setSelectedBuildTableId(tableId)
    setSelectedBuildRecordId(nextRecord?.id || '')
    setGridFilter('')
    setGridSortFieldId(base.tables.find((table) => table.id === tableId)?.primaryFieldId || '')
    setGridGroupFieldId(base.fields.find((field) => field.tableId === tableId && field.id === 'status')?.id || '')
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
    setGridGroupFieldId(base.fields.find((field) => field.tableId === tableId && field.id === 'status')?.id || '')
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

      return {
        ...current,
        [tableId]: nextFieldIds.length > 0 ? nextFieldIds : currentFieldIds,
      }
    })
  }

  function saveGridView() {
    if (!selectedBuildTable) {
      return
    }

    const viewCount = localGridViews.filter((view) => view.tableId === selectedBuildTable.id).length + 1
    const view: LocalGridView = {
      id: `${selectedBuildTable.id}_view_${Date.now()}`,
      name: `${selectedBuildTable.label} view ${viewCount}`,
      tableId: selectedBuildTable.id,
      filter: gridFilter,
      sortFieldId: gridSortFieldId,
      groupFieldId: gridGroupFieldId,
      visibleFieldIds,
    }

    setLocalGridViews((current) => [view, ...current])
    setViewRenameDrafts((current) => ({ ...current, [view.id]: view.name }))
    setActiveGridViewId(view.id)
  }

  function applyGridView(view: LocalGridView) {
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
    setGridGroupFieldId(view.groupFieldId)
    setActiveGridViewId(view.id)
    setRecordDraft(getEmptyRecordValues(base, view.tableId))
  }

  function updateGridView(viewId: string) {
    if (!selectedBuildTable) {
      return
    }

    setLocalGridViews((current) =>
      current.map((view) =>
        view.id === viewId
          ? {
              ...view,
              tableId: selectedBuildTable.id,
              filter: gridFilter,
              sortFieldId: gridSortFieldId,
              groupFieldId: gridGroupFieldId,
              visibleFieldIds,
            }
          : view,
      ),
    )
    setActiveGridViewId(viewId)
  }

  function duplicateGridView(view: LocalGridView) {
    const copyCount = localGridViews.filter((gridView) => gridView.name.startsWith(`${view.name} copy`)).length + 1
    const copy: LocalGridView = {
      ...view,
      id: `${view.id}_copy_${Date.now()}`,
      name: `${view.name} copy ${copyCount}`,
      visibleFieldIds: [...view.visibleFieldIds],
    }

    setLocalGridViews((current) => [copy, ...current])
    setViewRenameDrafts((current) => ({ ...current, [copy.id]: copy.name }))
    applyGridView(copy)
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
  }

  function deleteGridView(viewId: string) {
    setLocalGridViews((current) => current.filter((view) => view.id !== viewId))
    if (activeGridViewId === viewId) {
      setActiveGridViewId('')
    }
    setViewRenameDrafts((current) => {
      const nextDrafts = { ...current }
      delete nextDrafts[viewId]

      return nextDrafts
    })
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
      id: `${tableId}_${Date.now()}`,
      tableId,
      values: { ...recordDraft },
    }

    setBase((current) => ({
      ...current,
      records: [...current.records, record],
    }))
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
    setBase((current) => ({
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
    }))
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
            <button type="button" onClick={() => toggleVisibleField(field.id)}>Hide field</button>
            <button type="button" onClick={() => openFieldSettings(field)}>Field settings</button>
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
    if (field.type === 'lookup') {
      return String(getLookupPreview(base, record.id, field.id) || 'Empty')
    }

    if (field.type === 'count') {
      const count = getMaterializedLinks(base).filter(
        (link) => link.toRecordId === record.id && link.fromFieldId === field.sourceLinkedFieldId,
      ).length

      return String(count)
    }

    if (field.type === 'rollup') {
      const values = getMaterializedLinks(base)
        .filter((link) => link.toRecordId === record.id && link.fromFieldId === field.sourceLinkedFieldId)
        .flatMap((link) => {
          const linkedRecord = getRecord(base, link.fromRecordId)
          const value = field.sourceFieldId && linkedRecord ? linkedRecord.values[field.sourceFieldId] : null

          return typeof value === 'string' || typeof value === 'number' ? [String(value)] : []
        })

      return values.length > 0 ? values.join(', ') : 'Empty'
    }

    const value = record.values[field.id]

    if (Array.isArray(value)) {
      if (field.type === 'multiSelect') {
        return value.length > 0 ? value.join(', ') : 'Empty'
      }

      const titles = value.flatMap((recordId) => {
        const linkedRecord = getRecord(base, recordId)

        return linkedRecord ? [getRecordTitle(base, linkedRecord)] : []
      })

      return titles.length > 0 ? titles.join(', ') : 'Empty'
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }

    if (value === null || value === '') {
      return 'Empty'
    }

    if (field.type === 'currency' && typeof value === 'number') {
      return `$${value.toLocaleString()}`
    }

    return String(value)
  }

  function renderRecordInput(
    field: FieldDefinition,
    value: RecordValue,
    onChange: (fieldId: string, value: RecordValue) => void,
  ) {
    const linkedRecords = field.linkedTableId ? getRecordsForTable(base, field.linkedTableId) : []
    const selectedLinkedIds = Array.isArray(value) ? value : []

    if (field.type === 'linkedRecord') {
      return (
        <label className="full-row" key={field.id}>
          <span>{field.label}</span>
          <div className="linked-choice-grid">
            {linkedRecords.length === 0 && <small>No records in linked table.</small>}
            {linkedRecords.map((record) => {
              const isSelected = selectedLinkedIds.includes(record.id)

              return (
                <button
                  className={isSelected ? 'selected' : ''}
                  key={record.id}
                  type="button"
                  onClick={() => onChange(field.id, toggleListValue(selectedLinkedIds, record.id, field.allowMultiple))}
                >
                  <strong>{getRecordTitle(base, record)}</strong>
                  <small>{getRecordContext(record)}</small>
                </button>
              )
            })}
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

  function renderRecordModal() {
    if (buildModal !== 'record') {
      return null
    }

    return (
      <div className="modal-backdrop" role="presentation">
        <section className="build-modal record-modal" role="dialog" aria-modal="true" aria-label="Record">
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

        <section className="privacy-card">
          <span>Privacy boundary</span>
          <strong>Track status. Not files.</strong>
          <p>Upload sensitive information at your own risk. Sundesk is built for metadata, not files.</p>
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

        <section className="today-lane-grid" aria-label="Today lanes">
          {todayLanes.map((lane) => (
            <article className={`today-lane ${lane.id}`} key={lane.id}>
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
              <button className="ghost">Adjust rules</button>
            </div>

            <div className="priority-list">
              {priorityItems.map((item, index) => (
                <article className={`priority-card ${item.priority}`} key={item.id}>
                  <div className="priority-rank">{index + 1}</div>
                  <div className="priority-main">
                    <div className="priority-top">
                      <strong>{item.title}</strong>
                      <span className={`pill ${item.priority}`}>{priorityLabel(item.priority)}</span>
                    </div>
                    <p>{item.summary}</p>
                    <div className="reason-chain">
                      {item.reasons.map((reason, reasonIndex) => (
                        <span key={reason}>
                          {reasonIndex > 0 && <i aria-hidden="true" />}
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button>Open</button>
                </article>
              ))}
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
              <button className="primary">New task</button>
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
                  <strong>{dependency.direction === 'outgoing' ? 'Depends on' : 'Blocked by'} {dependency.record.title}</strong>
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
                <button className="primary">New follow-up</button>
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
                <span className="metric-pill">{meetingRecords.length} records</span>
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

        <section className="record-drawer" id="record">
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
              <div className="drawer-grid">
                {fieldsForSelectedTable.map((field) => (
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
              </div>

              <div className="linked-layout">
                <section id="followups">
                  <div className="mini-title">
                    <strong>Linked records</strong>
                  </div>
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

                <section className="why-card">
                  <div className="mini-title">
                    <strong>Dependencies</strong>
                  </div>
                  {drawerDependencies.length > 0 ? (
                    <ol>
                      {drawerDependencies.map((dependency) => (
                        <li key={dependency.id}>
                          <button
                            className="dependency-record-link"
                            type="button"
                            onClick={() => openBuildRecord(dependency.record.tableId, dependency.record.id)}
                          >
                            {dependency.direction === 'outgoing' ? 'Depends on' : 'Blocked by'} {dependency.record.title}.
                          </button>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="empty-note">No dependency links for this record.</p>
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
        <section className="mode-grid" id="timeline">
          <article className="mode-card">
            <div className="mode-head">
              <span>Kanban</span>
                <strong>Move work across statuses.</strong>
            </div>
            <div className="kanban-preview">
              <div><b>Waiting</b><p>{waitingTaskRecords.length + waitingFollowupRecords.length} records</p></div>
              <div><b>Blocked</b><p>{blockedTaskRecords.length} records</p></div>
              <div><b>In progress</b><p>{openTaskRecords.filter((record) => getStringValue(record, 'status') === 'In progress').length} records</p></div>
            </div>
          </article>

          <article className="mode-card">
            <div className="mode-head">
              <span>Calendar</span>
                <strong>See meetings and deadlines by date.</strong>
            </div>
            <div className="calendar-preview">
              {dailyTimelineRecords.slice(0, 4).map((record) => (
                <div key={record.id}>
                  {getFirstDateValue(record).slice(8, 10) || 'Now'}
                  <span>{getRecordTitle(base, record)}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="mode-card wide">
            <div className="mode-head">
              <span>Gantt</span>
              <strong>See what blocks what.</strong>
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
        <section className="build-zone build-reset" id="build">
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
              </div>
            </div>
            <div className="table-tabs" aria-label="Tables">
              {buildTableRows.map((table) => (
                <button
                  className={table.id === selectedBuildTable?.id ? 'selected' : ''}
                  key={table.id}
                  type="button"
                  onClick={() => selectBuildTable(table.id)}
                >
                  <strong>{table.label}</strong>
                  <span>{table.recordCount}</span>
                </button>
              ))}
            </div>
            <div className="grid-toolbar">
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
                <select value={gridSortFieldId} onChange={(event) => setGridSortFieldId(event.target.value)}>
                  <option value="">Manual</option>
                  {fieldsForSelectedTable.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
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
              <strong>Current grid state lives in React state. Saved views reset on refresh.</strong>
            </div>
            {groupedRecords.map((group) => (
              <section className="record-grid-group" key={group.label || 'all-records'}>
                {groupField && (
                  <div className="group-header">
                    <strong>{group.label}</strong>
                    <span>{group.records.length} records</span>
                  </div>
                )}
                <div className="record-table-wrap">
                  <table className="record-table">
                    <thead>
                      <tr>
                        {visibleFieldsForGrid.map((field) => (
                          <th key={field.id} style={{ width: columnWidths[field.id] || 180, minWidth: columnWidths[field.id] || 180 }}>
                            {renderGridHeader(field, `${group.label || 'all'}:${field.id}`)}
                          </th>
                        ))}
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
                            <td key={field.id} style={{ width: columnWidths[field.id] || 180, minWidth: columnWidths[field.id] || 180 }}>
                              {renderSavedGridCell(record, field)}
                            </td>
                          ))}
                          <td className="row-action-cell">
                            <button type="button" onClick={() => openEditRecordModal(record.id)}>Edit</button>
                          </td>
                        </tr>
                      ))}
                      <tr className="add-record-row">
                        <td colSpan={visibleFieldsForGrid.length + 1}>
                          <button type="button" onClick={openCreateRecordModal}>+ Add record</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
            {sortedAndFilteredRecords.length === 0 && <p className="empty-note">No records match this filter.</p>}
          </article>

          <article className="automation-panel build-sidecar">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Views</span>
                <h2>Saved ways to work.</h2>
              </div>
              <span className="metric-pill">{localGridViews.length} local</span>
            </div>
            <p className="panel-copy">Saved views keep table context. Pinning comes later.</p>
            {localGridViews.length > 0 && (
              <div className="view-list">
                {localGridViews.map((view) => (
                  <article className={`local-view-row ${view.id === activeGridViewId ? 'active-row' : ''}`} key={view.id}>
                    <div className="view-row-top">
                      <span>{base.tables.find((table) => table.id === view.tableId)?.label || view.tableId}</span>
                      {view.id === activeGridViewId && (
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
                      Filter: {view.filter || 'none'}. Sort: {view.sortFieldId || 'manual'}. Group: {view.groupFieldId || 'none'}.
                    </p>
                    <div className="view-actions">
                      <button onClick={() => applyGridView(view)}>Apply</button>
                      <button onClick={() => updateGridView(view.id)}>Update</button>
                      <button onClick={() => duplicateGridView(view)}>Copy</button>
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

          <article className="automation-panel build-sidecar">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Rules</span>
                <h2>When this happens, do this.</h2>
              </div>
              <button className="primary">New rule</button>
            </div>
            <div className="rules">
              {automationRules.map((rule) => (
                <p key={rule.id}>
                  <span>When</span> {rule.when}. <span>Do</span> {rule.then}.
                </p>
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
        <section className="settings-zone" id="settings">
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
