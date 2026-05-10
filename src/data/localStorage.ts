import {
  type BaseRecord,
  type DependencyLink,
  type FieldDefinition,
  type FieldType,
  type RecordValue,
  type Workbase,
  workbase,
} from './workbase'
import {
  getDefaultLocalRules,
  isLocalRule,
  mergeDefaultLocalRules,
  type LocalRule,
} from './rules'

export const workbaseStorageKey = 'sundesk-local-workbase-v1'
export const buildViewStateStorageKey = 'sundesk-build-view-state-v1'
export const rulesStorageKey = 'sundesk-local-rules-v1'

export const computedFieldTypes: FieldType[] = ['lookup', 'rollup', 'count', 'systemFormula', 'createdTime', 'lastUpdatedTime']
export const defaultVisibleFieldIdsByTable: Record<string, string[]> = {
  communities: ['name', 'status', 'eventDate', 'readiness', 'openTaskCount'],
  tasks: ['title', 'status', 'dueDate', 'priority', 'tags', 'community'],
}

const fieldTypeValues: FieldType[] = [
  'text',
  'longText',
  'status',
  'singleSelect',
  'multiSelect',
  'date',
  'dateTime',
  'checkbox',
  'number',
  'currency',
  'percent',
  'rating',
  'phone',
  'url',
  'linkedRecord',
  'lookup',
  'rollup',
  'count',
  'systemFormula',
  'createdTime',
  'lastUpdatedTime',
]

export type LocalGridView = {
  id: string
  name: string
  tableId: string
  filter: string
  sortFieldId: string
  sortDirection?: 'asc' | 'desc'
  groupFieldId: string
  colorFieldId?: string
  density?: 'compact' | 'comfortable' | 'expanded'
  visibleFieldIds: string[]
  pinned?: boolean
}

export type StoredBuildViewState = {
  version: 1
  selectedBuildTableId: string
  visibleFieldIdsByTable: Record<string, string[]>
  gridFilter: string
  gridSortFieldId: string
  gridSortDirection: 'asc' | 'desc'
  gridGroupFieldId: string
  gridColorFieldId: string
  gridDensity: 'compact' | 'comfortable' | 'expanded'
  localGridViews: LocalGridView[]
  viewRenameDrafts: Record<string, string>
  activeGridViewId: string
  columnWidths: Record<string, number>
}

export type StoredWorkbaseState = {
  version: 1
  base: Workbase
}

export type StoredMigrationReport = {
  workbaseReset: boolean
  rulesReset: boolean
  buildViewReset: boolean
}

export const storedMigrationReport: StoredMigrationReport = {
  workbaseReset: false,
  rulesReset: false,
  buildViewReset: false,
}

const canonicalTableLabels: Record<string, Pick<Workbase['tables'][number], 'label' | 'description'>> = {
  tasks: {
    label: 'Work',
    description: 'Work Lindsay can create, link, block, and close.',
  },
  followups: {
    label: 'Waiting On',
    description: 'People, approvals, and updates that owe the next move.',
  },
}

const canonicalFieldLabels: Record<string, string> = {
  'communities:openTaskCount': 'Open work',
  'meetings:tasks': 'Work',
}

export function cloneWorkbase(base: Workbase): Workbase {
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

function isStoredWorkbaseState(value: unknown): value is StoredWorkbaseState {
  if (!value || typeof value !== 'object') {
    return false
  }

  const state = value as Partial<StoredWorkbaseState>
  const base = state.base

  return state.version === 1 &&
    Boolean(base) &&
    Array.isArray(base?.tables) &&
    Array.isArray(base?.fields) &&
    Array.isArray(base?.records) &&
    Array.isArray(base?.dependencies)
}

function isRecordValue(value: unknown): value is RecordValue {
  return value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    (Array.isArray(value) && value.every((item) => typeof item === 'string'))
}

function isFieldDefinition(value: unknown): value is FieldDefinition {
  if (!value || typeof value !== 'object') {
    return false
  }

  const field = value as Partial<FieldDefinition>

  return typeof field.id === 'string' &&
    typeof field.tableId === 'string' &&
    typeof field.label === 'string' &&
    fieldTypeValues.some((fieldType) => fieldType === field.type)
}

function isBaseRecord(value: unknown): value is BaseRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Partial<BaseRecord>

  return typeof record.id === 'string' &&
    typeof record.tableId === 'string' &&
    Boolean(record.values) &&
    typeof record.values === 'object'
}

function isDependencyLink(value: unknown): value is DependencyLink {
  if (!value || typeof value !== 'object') {
    return false
  }

  const dependency = value as Partial<DependencyLink>

  return typeof dependency.id === 'string' &&
    typeof dependency.fromRecordId === 'string' &&
    typeof dependency.toRecordId === 'string' &&
    (dependency.relationship === 'dependsOn' || dependency.relationship === 'blocks') &&
    typeof dependency.reason === 'string'
}

function isLocalGridView(value: unknown): value is LocalGridView {
  if (!value || typeof value !== 'object') {
    return false
  }

  const view = value as Partial<LocalGridView>

  return typeof view.id === 'string' &&
    typeof view.name === 'string' &&
    typeof view.tableId === 'string' &&
    typeof view.filter === 'string' &&
    typeof view.sortFieldId === 'string' &&
    (!view.sortDirection || view.sortDirection === 'asc' || view.sortDirection === 'desc') &&
    typeof view.groupFieldId === 'string' &&
    (!view.colorFieldId || typeof view.colorFieldId === 'string') &&
    (!view.density || view.density === 'compact' || view.density === 'comfortable' || view.density === 'expanded') &&
    Array.isArray(view.visibleFieldIds) &&
    view.visibleFieldIds.every((fieldId) => typeof fieldId === 'string')
}

function normalizeStoredWorkbase(base: Workbase) {
  const defaultBase = cloneWorkbase(workbase)
  const tables = base.tables
    .filter((table) =>
      typeof table.id === 'string' &&
      typeof table.label === 'string' &&
      typeof table.description === 'string' &&
      typeof table.primaryFieldId === 'string',
    )
    .map((table) => ({
      ...table,
      ...canonicalTableLabels[table.id],
    }))
  const tableIds = new Set(tables.map((table) => table.id))
  const fields = base.fields
    .filter((field) => isFieldDefinition(field) && tableIds.has(field.tableId))
    .map((field) => ({
      ...field,
      label: canonicalFieldLabels[`${field.tableId}:${field.id}`] || field.label,
    }))
  const fieldKeys = new Set(fields.map((field) => `${field.tableId}:${field.id}`))
  const records = base.records
    .filter((record) => isBaseRecord(record) && tableIds.has(record.tableId))
    .map((record) => {
      const values = Object.fromEntries(
        Object.entries(record.values).filter(([fieldId, value]) => fieldKeys.has(`${record.tableId}:${fieldId}`) && isRecordValue(value)),
      )

      fields
        .filter((field) => field.tableId === record.tableId && !computedFieldTypes.includes(field.type))
        .forEach((field) => {
          if (!(field.id in values)) {
            values[field.id] = getEmptyFieldValue(field.type)
          }
        })

      return { ...record, values }
    })
  const recordIds = new Set(records.map((record) => record.id))
  const dependencies = base.dependencies.filter(
    (dependency) =>
      isDependencyLink(dependency) &&
      recordIds.has(dependency.fromRecordId) &&
      recordIds.has(dependency.toRecordId) &&
      dependency.fromRecordId !== dependency.toRecordId,
  )

  if (tables.length === 0 || fields.length === 0) {
    return { base: defaultBase, reset: true }
  }

  return {
    base: {
      tables,
      fields,
      records,
      dependencies,
    },
    reset: false,
  }
}

export function getEmptyRecordValues(base: Workbase, tableId: string) {
  const values: Record<string, RecordValue> = {}

  base.fields
    .filter((field) => field.tableId === tableId && !computedFieldTypes.includes(field.type))
    .forEach((field) => {
      values[field.id] = getEmptyFieldValue(field.type)
    })

  return values
}

export function getEmptyFieldValue(fieldType: FieldType): RecordValue {
  if (fieldType === 'checkbox') {
    return false
  }

  if (fieldType === 'linkedRecord' || fieldType === 'multiSelect') {
    return []
  }

  return ''
}

export function getDefaultVisibleFieldIds(fields: FieldDefinition[]) {
  return fields.slice(0, 5).map((field) => field.id)
}

export function readStoredBuildViewState(): Partial<StoredBuildViewState> {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const rawState = window.localStorage.getItem(buildViewStateStorageKey)

    if (!rawState) {
      return {}
    }

    const state = JSON.parse(rawState) as Partial<StoredBuildViewState>

    if (state.version !== 1) {
      storedMigrationReport.buildViewReset = true
      return {}
    }

    const localGridViews = Array.isArray(state.localGridViews)
      ? state.localGridViews.filter(isLocalGridView)
      : []
    const visibleFieldIdsByTable = state.visibleFieldIdsByTable && typeof state.visibleFieldIdsByTable === 'object'
      ? Object.fromEntries(
          Object.entries(state.visibleFieldIdsByTable).filter(
            ([tableId, fieldIds]) =>
              typeof tableId === 'string' &&
              Array.isArray(fieldIds) &&
              fieldIds.every((fieldId) => typeof fieldId === 'string'),
          ),
        )
      : {}
    const viewRenameDrafts = state.viewRenameDrafts && typeof state.viewRenameDrafts === 'object'
      ? Object.fromEntries(
          Object.entries(state.viewRenameDrafts).filter(
            ([viewId, draft]) => typeof viewId === 'string' && typeof draft === 'string',
          ),
        )
      : {}
    const columnWidths = state.columnWidths && typeof state.columnWidths === 'object'
      ? Object.fromEntries(
          Object.entries(state.columnWidths).filter(
            ([fieldId, width]) => typeof fieldId === 'string' && typeof width === 'number',
          ),
        )
      : {}

    return {
      version: 1,
      selectedBuildTableId: typeof state.selectedBuildTableId === 'string' ? state.selectedBuildTableId : 'risks',
      visibleFieldIdsByTable,
      gridFilter: typeof state.gridFilter === 'string' ? state.gridFilter : '',
      gridSortFieldId: typeof state.gridSortFieldId === 'string' ? state.gridSortFieldId : 'title',
      gridSortDirection: state.gridSortDirection === 'desc' ? 'desc' : 'asc',
      gridGroupFieldId: typeof state.gridGroupFieldId === 'string' ? state.gridGroupFieldId : 'level',
      gridColorFieldId: typeof state.gridColorFieldId === 'string' ? state.gridColorFieldId : '',
      gridDensity: state.gridDensity === 'compact' || state.gridDensity === 'expanded' ? state.gridDensity : 'comfortable',
      localGridViews,
      viewRenameDrafts,
      activeGridViewId: typeof state.activeGridViewId === 'string' ? state.activeGridViewId : '',
      columnWidths,
    }
  } catch {
    storedMigrationReport.buildViewReset = true
    return {}
  }
}

export function readStoredWorkbase(): Workbase {
  if (typeof window === 'undefined') {
    return cloneWorkbase(workbase)
  }

  try {
    const rawState = window.localStorage.getItem(workbaseStorageKey)

    if (!rawState) {
      return cloneWorkbase(workbase)
    }

    const state = JSON.parse(rawState) as unknown

    if (!isStoredWorkbaseState(state)) {
      storedMigrationReport.workbaseReset = true
      return cloneWorkbase(workbase)
    }

    const normalizedState = normalizeStoredWorkbase(state.base)
    storedMigrationReport.workbaseReset = normalizedState.reset

    return normalizedState.base
  } catch {
    storedMigrationReport.workbaseReset = true
    return cloneWorkbase(workbase)
  }
}

export function readStoredRules(): LocalRule[] {
  if (typeof window === 'undefined') {
    return getDefaultLocalRules()
  }

  try {
    const rawRules = window.localStorage.getItem(rulesStorageKey)

    if (!rawRules) {
      return getDefaultLocalRules()
    }

    const rules = JSON.parse(rawRules) as unknown

    if (!Array.isArray(rules)) {
      storedMigrationReport.rulesReset = true
      return getDefaultLocalRules()
    }

    const validRules = rules.filter(isLocalRule)

    if (validRules.length !== rules.length) {
      storedMigrationReport.rulesReset = true
    }

    return validRules.length > 0 ? mergeDefaultLocalRules(validRules) : getDefaultLocalRules()
  } catch {
    storedMigrationReport.rulesReset = true
    return getDefaultLocalRules()
  }
}
