import './App.css'
import { useEffect, useState } from 'react'
import {
  automationRules,
  buildFieldTypes,
  communities,
  priorityItems,
  savedViews,
  type Priority,
} from './data/demoData'
import {
  type BaseRecord,
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

const starterTaskFields = [
  'Title',
  'Table',
  'Community',
  'Status',
  'Due date',
  'Priority',
  'Depends on',
  'Linked records',
]

const selectOptions = ['Missing', 'Requested', 'Received', 'Not needed']

const fieldTypeOptions: { label: string; value: FieldType }[] = [
  { label: 'Text', value: 'text' },
  { label: 'Long text', value: 'longText' },
  { label: 'Status', value: 'status' },
  { label: 'Single select', value: 'singleSelect' },
  { label: 'Multi select', value: 'multiSelect' },
  { label: 'Date', value: 'date' },
  { label: 'Date + time', value: 'dateTime' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Number', value: 'number' },
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

type LocalGridView = {
  id: string
  name: string
  tableId: string
  filter: string
  sortFieldId: string
  groupFieldId: string
  visibleFieldIds: string[]
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
  const [base, setBase] = useState(() => cloneWorkbase(workbase))
  const [selectedBuildTableId, setSelectedBuildTableId] = useState('tasks')
  const [tableDraft, setTableDraft] = useState({
    label: '',
    description: '',
  })
  const [fieldDraft, setFieldDraft] = useState({
    label: '',
    type: 'text' as FieldType,
    options: 'Missing, Requested, Received, Not needed',
    linkedTableId: 'communities',
    sourceLinkedFieldId: '',
    sourceFieldId: '',
  })
  const [recordDraft, setRecordDraft] = useState<Record<string, RecordValue>>(() => getEmptyRecordValues(workbase, 'tasks'))
  const [selectedBuildRecordId, setSelectedBuildRecordId] = useState('task_coi_halifax')
  const [visibleFieldIdsByTable, setVisibleFieldIdsByTable] = useState<Record<string, string[]>>(() => ({
    tasks: ['title', 'status', 'dueDate', 'priority', 'community'],
  }))
  const [gridFilter, setGridFilter] = useState('')
  const [gridSortFieldId, setGridSortFieldId] = useState('dueDate')
  const [gridGroupFieldId, setGridGroupFieldId] = useState('status')
  const [localGridViews, setLocalGridViews] = useState<LocalGridView[]>([])
  const [viewRenameDrafts, setViewRenameDrafts] = useState<Record<string, string>>({})
  const [activeGridViewId, setActiveGridViewId] = useState('')
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
  const selectedBuildTable = base.tables.find((table) => table.id === selectedBuildTableId) || base.tables[0]
  const fieldsForSelectedTable = base.fields.filter((field) => field.tableId === selectedBuildTable?.id)
  const editableFieldsForSelectedTable = fieldsForSelectedTable.filter((field) => !computedFieldTypes.includes(field.type))
  const recordsForSelectedTable = selectedBuildTable ? getRecordsForTable(base, selectedBuildTable.id) : []
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
    const options = optionFieldTypes.includes(fieldDraft.type)
      ? fieldDraft.options
          .split(/[,\n]/)
          .map((option) => option.trim())
          .filter(Boolean)
      : undefined
    const field: FieldDefinition = {
      id,
      tableId,
      label,
      type: fieldDraft.type,
      options,
    }

    if (fieldDraft.type === 'linkedRecord') {
      field.linkedTableId = fieldDraft.linkedTableId
      field.allowMultiple = true
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

    const inputType = field.type === 'date' ? 'date' : field.type === 'dateTime' ? 'datetime-local' : ['number', 'percent', 'rating'].includes(field.type) ? 'number' : field.type === 'url' ? 'url' : 'text'

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

  function renderGridCellInput(record: BaseRecord, field: FieldDefinition) {
    const value = record.values[field.id]

    if (computedFieldTypes.includes(field.type) || field.type === 'linkedRecord') {
      return <span className="grid-cell-readonly">{getFieldDisplayValue(record, field)}</span>
    }

    if (field.type === 'multiSelect' && field.options) {
      const selectedOptions = Array.isArray(value) ? value : []

      return (
        <div className="grid-option-list" aria-label={`${field.label} options`}>
          {field.options.map((option) => {
            const isSelected = selectedOptions.includes(option)

            return (
              <button
                className={isSelected ? 'selected' : ''}
                key={option}
                type="button"
                onClick={() => {
                  setSelectedBuildRecordId(record.id)
                  updateRecordField(record.id, field.id, toggleListValue(selectedOptions, option))
                }}
              >
                {option}
              </button>
            )
          })}
        </div>
      )
    }

    if (field.options) {
      return (
        <select
          aria-label={field.label}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => {
            setSelectedBuildRecordId(record.id)
            updateRecordField(record.id, field.id, event.target.value)
          }}
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

    if (field.type === 'checkbox') {
      return (
        <input
          aria-label={field.label}
          checked={Boolean(value)}
          type="checkbox"
          onChange={(event) => {
            setSelectedBuildRecordId(record.id)
            updateRecordField(record.id, field.id, event.target.checked)
          }}
        />
      )
    }

    if (field.type === 'longText') {
      return (
        <textarea
          aria-label={field.label}
          rows={2}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => {
            setSelectedBuildRecordId(record.id)
            updateRecordField(record.id, field.id, event.target.value)
          }}
        />
      )
    }

    const inputType = field.type === 'date' ? 'date' : field.type === 'dateTime' ? 'datetime-local' : ['number', 'percent', 'rating'].includes(field.type) ? 'number' : field.type === 'url' ? 'url' : 'text'

    return (
      <input
        aria-label={field.label}
        type={inputType}
        value={typeof value === 'string' || typeof value === 'number' ? value : ''}
        onChange={(event) => {
          setSelectedBuildRecordId(record.id)
          updateRecordField(record.id, field.id, inputType === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value)
        }}
      />
    )
  }

  useEffect(() => {
    localStorage.setItem('sundesk-theme', selectedTheme)
  }, [selectedTheme])

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
          <a className="active" href="#today">Today</a>
          <a href="#communities">Communities</a>
          <a href="#followups">Follow-ups</a>
          <a href="#meetings">Meetings</a>
          <a href="#timeline">Timeline</a>
          <span>System</span>
          <a href="#build">Build</a>
          <a href="#settings">Settings</a>
        </nav>

        <section className="privacy-card">
          <span>Privacy boundary</span>
          <strong>Track status. Not files.</strong>
          <p>Upload sensitive information at your own risk. Sundesk is built for metadata, not files.</p>
        </section>
      </aside>

      <section className="desk">
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
            <h1>4 items need attention. 1 is a fire.</h1>
            <p>
              The queue reads due dates, blockers, dependencies, follow-ups, event dates, and saved rules.
            </p>
          </div>
          <article className="digest-card">
            <span>Daily digest</span>
            <strong>7:30 AM</strong>
            <p>Next send goes to lindsaybelldesign@gmail.com.</p>
            <button>Preview digest</button>
          </article>
        </header>

        <section className="command-grid">
          <article className="queue-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Priority queue</span>
                <h2>Start here.</h2>
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

            <article className="community-signal" id="communities">
              <div className="panel-title compact">
                <div>
                  <span className="eyebrow">Communities</span>
                  <h2>Risk map</h2>
                </div>
              </div>
              <div className="signal-grid">
                {communities.map((community) => (
                  <button className={community.status} key={community.id}>
                    {community.name}
                    <span>{community.readiness}%</span>
                  </button>
                ))}
              </div>
            </article>

            <article className="next-meeting" id="meetings">
              <span className="eyebrow">Next meeting</span>
              <strong>Charlottetown. Tomorrow.</strong>
              <p>Agenda can be generated from 2 tasks, 1 risk, and 1 follow-up.</p>
              <button>Generate prep</button>
            </article>
          </aside>
        </section>

        <section className="task-zone" id="tasks">
          <article className="task-creator">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Tasks</span>
                <h2>Create work. Link it to the system.</h2>
              </div>
              <button className="primary">New task</button>
            </div>
            <div className="task-form-preview" aria-label="Task creation fields">
              {starterTaskFields.map((field) => (
                <div key={field}>
                  <span>{field}</span>
                  <strong>{field === 'Depends on' ? 'Pick another record' : 'Ready'}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="dependency-panel">
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
                      <article key={`${backlink.fromRecord.id}-${backlink.fieldId}`}>
                        <span className="pill prep">{backlink.fromRecord.tableLabel}</span>
                        <strong>{backlink.fromRecord.title}</strong>
                        <small>{backlink.fieldLabel}. {backlink.fromRecord.context}</small>
                      </article>
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
                      <article key={`${link.fieldId}-${link.record.id}`}>
                        <span className="pill waiting">{link.record.tableLabel}</span>
                        <strong>{link.record.title}</strong>
                        <small>{link.fieldLabel}. {link.record.context}</small>
                      </article>
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
                          {dependency.direction === 'outgoing' ? 'Depends on' : 'Blocked by'} {dependency.record.title}.
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

        <section className="mode-grid" id="views">
          <article className="mode-card">
            <div className="mode-head">
              <span>Kanban</span>
                <strong>Move work across statuses.</strong>
            </div>
            <div className="kanban-preview">
              <div><b>Waiting</b><p>Permit update</p></div>
              <div><b>Blocked</b><p>COI status</p></div>
              <div><b>In progress</b><p>Meeting prep</p></div>
            </div>
          </article>

          <article className="mode-card">
            <div className="mode-head">
              <span>Calendar</span>
                <strong>See meetings and deadlines by date.</strong>
            </div>
            <div className="calendar-preview">
              <div>12<span>COI</span></div>
              <div>13<span>Permit</span></div>
              <div>14<span>Prep</span></div>
              <div>15<span>Status</span></div>
            </div>
          </article>

          <article className="mode-card wide" id="timeline">
            <div className="mode-head">
              <span>Gantt</span>
              <strong>See what blocks what.</strong>
            </div>
            <div className="gantt-preview">
              <div><span>Halifax</span><i className="bar firebar" /><em>COI blocks venue readiness</em></div>
              <div><span>Moncton</span><i className="bar waitbar" /><em>Permit gates site map review</em></div>
              <div><span>Charlottetown</span><i className="bar prepbar" /><em>Meeting prep feeds action list</em></div>
            </div>
          </article>
        </section>

        <section className="build-zone" id="build">
          <article className="builder-panel wide">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Build</span>
                <h2>Tables Lindsay can create and change.</h2>
              </div>
              <button className="primary" onClick={createTable}>Create table</button>
            </div>
            <p className="panel-copy">Build is where the system changes. Today stays for the work.</p>
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
            <div className="table-list">
              {localTableRows.map((table) => (
                <article
                  className={table.id === selectedBuildTable?.id ? 'selected-row' : ''}
                  key={table.id}
                  onClick={() => selectBuildTable(table.id)}
                >
                  <div>
                    <strong>{table.label}</strong>
                    <p>{table.description}</p>
                  </div>
                  <span>{table.recordCount} records · {table.fieldCount} fields</span>
                </article>
              ))}
            </div>
          </article>

          <article className="builder-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Fields</span>
                <h2>Field types that connect records.</h2>
              </div>
              <button onClick={createField}>Create field</button>
            </div>
            <div className="selected-table-strip">
              <span>Editing</span>
              <strong>{selectedBuildTable?.label}</strong>
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
              {fieldDraft.type === 'linkedRecord' && (
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
            <div className="build-grid field-grid">
              {buildFieldTypes.map((fieldType) => (
                <button key={fieldType}>{fieldType}</button>
              ))}
            </div>
            <div className="field-list">
              {fieldsForSelectedTable.map((field) => (
                <article key={field.id}>
                  <strong>{field.label}</strong>
                  <span>{field.type}</span>
                  {field.linkedTableId && <small>Links to {base.tables.find((table) => table.id === field.linkedTableId)?.label}</small>}
                  {field.options && <small>{field.options.join(', ')}</small>}
                </article>
              ))}
            </div>
            <div className="select-builder">
              <span className="eyebrow">Single select example</span>
              <strong>COI status</strong>
              <div>
                {selectOptions.map((option) => (
                  <small key={option}>{option}</small>
                ))}
              </div>
            </div>
            <div className="select-builder">
              <span className="eyebrow">Linked field example</span>
              <strong>Task → Community</strong>
              <div>
                {selectedTaskLinks.map((link) => (
                  <small key={`${link.fieldId}-${link.record.id}`}>{link.fieldLabel}: {link.record.title}</small>
                ))}
              </div>
            </div>
          </article>

          <article className="builder-panel wide">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Records</span>
                <h2>Create records in {selectedBuildTable?.label}.</h2>
              </div>
              <button className="primary" onClick={createRecord}>Create record</button>
            </div>
            <div className="record-builder-grid">
              <div className="record-form">
                {editableFieldsForSelectedTable.map((field) =>
                  renderRecordInput(field, recordDraft[field.id], updateRecordDraft),
                )}
              </div>
              <div className="record-list">
                {recordsForSelectedTable.map((record) => (
                  <article
                    className={record.id === selectedBuildRecord?.id ? 'selected-row' : ''}
                    key={record.id}
                    onClick={() => setSelectedBuildRecordId(record.id)}
                  >
                    <strong>{getRecordTitle(base, record)}</strong>
                    <span>{selectedBuildTable?.label}</span>
                    <small>{Object.keys(record.values).length} fields set</small>
                  </article>
                ))}
              </div>
            </div>
          </article>

          <article className="builder-panel wide">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Grid</span>
                <h2>{selectedBuildTable?.label} records as a table.</h2>
              </div>
              <div className="drawer-actions">
                <span className="metric-pill">{sortedAndFilteredRecords.length} shown</span>
                {activeGridView && (
                  <span className={`metric-pill ${activeGridViewChanged ? 'changed-view' : 'active-view'}`}>
                    {activeGridViewChanged ? 'View changed' : 'View active'}: {activeGridView.name}
                  </span>
                )}
                <button onClick={saveGridView}>Save view</button>
              </div>
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
                          <th key={field.id}>{field.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.records.map((record) => (
                        <tr
                          className={record.id === selectedBuildRecord?.id ? 'selected-row' : ''}
                          key={record.id}
                          onClick={() => setSelectedBuildRecordId(record.id)}
                        >
                          {visibleFieldsForGrid.map((field) => (
                            <td key={field.id}>{renderGridCellInput(record, field)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
            {sortedAndFilteredRecords.length === 0 && <p className="empty-note">No records match this filter.</p>}
          </article>

          <article className="builder-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Views</span>
                <h2>Saved ways to work.</h2>
              </div>
              <span className="metric-pill">{localGridViews.length} local</span>
            </div>
            <p className="panel-copy">Local views are working copies. Refresh clears them.</p>
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

          <article className="automation-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Automations</span>
                <h2>Plain rules she can edit.</h2>
              </div>
              <button className="primary">New rule</button>
            </div>
            <div className="rules">
              {automationRules.map((rule) => (
                <p key={rule.id}>
                  <span>When</span> {rule.when}. <span>Then</span> {rule.then}.
                </p>
              ))}
            </div>
          </article>

          <article className="onboarding-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Templates</span>
                <h2>Starts she can reuse.</h2>
              </div>
            </div>
            <div className="setup-steps">
              <p><strong>Community setup.</strong> Starter checklist for each location.</p>
              <p><strong>Weekly meeting.</strong> Agenda from open work and risks.</p>
              <p><strong>Approval chase.</strong> Follow-up path for permits and confirmations.</p>
              <p><strong>Event readiness.</strong> Final status check before event week.</p>
            </div>
          </article>

          <article className="onboarding-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Exports</span>
                <h2>Take out the current view.</h2>
              </div>
            </div>
            <div className="setup-steps">
              <p><strong>Current view.</strong> Export the records on screen.</p>
              <p><strong>Meeting prep.</strong> Export agenda text from linked work.</p>
              <p><strong>Digest text.</strong> Export the daily summary before it sends.</p>
            </div>
          </article>
        </section>

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
      </section>
    </main>
  )
}

export default App
