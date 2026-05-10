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
export const localBackupRehearsalStorageKey = 'sundesk-local-backup-rehearsal-v1'
export const sundeskLocalBackupAppName = 'Sundesk'
export const sundeskLocalBackupVersion = 1

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

export type SundeskLocalBackup = {
  appName: typeof sundeskLocalBackupAppName
  version: typeof sundeskLocalBackupVersion
  createdAt: string
  metadata: {
    schemaVersion: typeof sundeskLocalBackupVersion
    appName: typeof sundeskLocalBackupAppName
    backupVersion: typeof sundeskLocalBackupVersion
  }
  workbase: Workbase
  rules: LocalRule[]
  buildViewState: StoredBuildViewState
}

export type SundeskLocalBackupInput = {
  workbase: Workbase
  rules: LocalRule[]
  buildViewState: StoredBuildViewState
  createdAt?: string
}

export type NormalizedSundeskLocalBackupImport = {
  ok: true
  backup: SundeskLocalBackup
  workbase: Workbase
  rules: LocalRule[]
  buildViewState: StoredBuildViewState
  usedFallbacks: {
    workbase: boolean
    rules: boolean
    buildViewState: boolean
  }
} | {
  ok: false
  reason: string
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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
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

function cloneLocalGridView(view: LocalGridView): LocalGridView {
  return {
    ...view,
    visibleFieldIds: [...view.visibleFieldIds],
  }
}

function cloneStringArrayRecord(value: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, [...item]]))
}

function cloneBuildViewState(state: StoredBuildViewState): StoredBuildViewState {
  return {
    ...state,
    visibleFieldIdsByTable: cloneStringArrayRecord(state.visibleFieldIdsByTable),
    localGridViews: state.localGridViews.map(cloneLocalGridView),
    viewRenameDrafts: { ...state.viewRenameDrafts },
    columnWidths: { ...state.columnWidths },
  }
}

function getDefaultBuildViewState(): StoredBuildViewState {
  return {
    version: 1,
    selectedBuildTableId: 'risks',
    visibleFieldIdsByTable: cloneStringArrayRecord(defaultVisibleFieldIdsByTable),
    gridFilter: '',
    gridSortFieldId: 'title',
    gridSortDirection: 'asc',
    gridGroupFieldId: 'level',
    gridColorFieldId: '',
    gridDensity: 'comfortable',
    localGridViews: [],
    viewRenameDrafts: {},
    activeGridViewId: '',
    columnWidths: {},
  }
}

function normalizeStringArrayRecord(value: unknown): Record<string, string[]> {
  if (!isObjectRecord(value)) {
    return {}
  }

  const normalized: Record<string, string[]> = {}

  Object.entries(value).forEach(([key, item]) => {
    if (Array.isArray(item) && item.every((child) => typeof child === 'string')) {
      normalized[key] = item
    }
  })

  return normalized
}

function normalizeStringRecord(value: unknown): Record<string, string> {
  if (!isObjectRecord(value)) {
    return {}
  }

  const normalized: Record<string, string> = {}

  Object.entries(value).forEach(([key, item]) => {
    if (typeof item === 'string') {
      normalized[key] = item
    }
  })

  return normalized
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  if (!isObjectRecord(value)) {
    return {}
  }

  const normalized: Record<string, number> = {}

  Object.entries(value).forEach(([key, item]) => {
    if (typeof item === 'number') {
      normalized[key] = item
    }
  })

  return normalized
}

function normalizeStoredRules(value: unknown) {
  if (!Array.isArray(value)) {
    return { rules: getDefaultLocalRules(), reset: true }
  }

  const validRules = value.filter(isLocalRule)

  return {
    rules: validRules.length > 0 ? mergeDefaultLocalRules(validRules) : getDefaultLocalRules(),
    reset: validRules.length !== value.length || validRules.length === 0,
  }
}

function normalizeStoredBuildViewState(value: unknown): { buildViewState: StoredBuildViewState, reset: boolean } {
  if (!isObjectRecord(value) || value.version !== 1) {
    return { buildViewState: getDefaultBuildViewState(), reset: true }
  }

  const buildViewState: StoredBuildViewState = {
    version: 1,
    selectedBuildTableId: typeof value.selectedBuildTableId === 'string' ? value.selectedBuildTableId : 'risks',
    visibleFieldIdsByTable: normalizeStringArrayRecord(value.visibleFieldIdsByTable),
    gridFilter: typeof value.gridFilter === 'string' ? value.gridFilter : '',
    gridSortFieldId: typeof value.gridSortFieldId === 'string' ? value.gridSortFieldId : 'title',
    gridSortDirection: value.gridSortDirection === 'desc' ? 'desc' : 'asc',
    gridGroupFieldId: typeof value.gridGroupFieldId === 'string' ? value.gridGroupFieldId : 'level',
    gridColorFieldId: typeof value.gridColorFieldId === 'string' ? value.gridColorFieldId : '',
    gridDensity: value.gridDensity === 'compact' || value.gridDensity === 'expanded' ? value.gridDensity : 'comfortable',
    localGridViews: Array.isArray(value.localGridViews) ? value.localGridViews.filter(isLocalGridView) : [],
    viewRenameDrafts: normalizeStringRecord(value.viewRenameDrafts),
    activeGridViewId: typeof value.activeGridViewId === 'string' ? value.activeGridViewId : '',
    columnWidths: normalizeNumberRecord(value.columnWidths),
  }

  return {
    buildViewState,
    reset: false,
  }
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

export function createSundeskLocalBackup(state: SundeskLocalBackupInput): SundeskLocalBackup {
  const createdAt = state.createdAt || new Date().toISOString()

  return {
    appName: sundeskLocalBackupAppName,
    version: sundeskLocalBackupVersion,
    createdAt,
    metadata: {
      schemaVersion: sundeskLocalBackupVersion,
      appName: sundeskLocalBackupAppName,
      backupVersion: sundeskLocalBackupVersion,
    },
    workbase: cloneWorkbase(state.workbase),
    rules: state.rules.map((rule) => ({ ...rule })),
    buildViewState: cloneBuildViewState(state.buildViewState),
  }
}

export function normalizeSundeskLocalBackupImport(value: unknown): NormalizedSundeskLocalBackupImport {
  if (!isObjectRecord(value)) {
    return {
      ok: false,
      reason: 'Unsupported Sundesk backup.',
    }
  }

  const metadata = isObjectRecord(value.metadata) ? value.metadata : {}
  const isSupportedBackup = value.appName === sundeskLocalBackupAppName &&
    value.version === sundeskLocalBackupVersion &&
    metadata.appName === sundeskLocalBackupAppName &&
    metadata.schemaVersion === sundeskLocalBackupVersion &&
    metadata.backupVersion === sundeskLocalBackupVersion

  if (!isSupportedBackup) {
    return {
      ok: false,
      reason: 'Unsupported Sundesk backup.',
    }
  }

  const workbaseCandidate = { version: 1, base: value.workbase }
  const normalizedWorkbase = isStoredWorkbaseState(workbaseCandidate)
    ? normalizeStoredWorkbase(workbaseCandidate.base)
    : { base: cloneWorkbase(workbase), reset: true }
  const normalizedRules = normalizeStoredRules(value.rules)
  const normalizedBuildViewState = normalizeStoredBuildViewState(value.buildViewState)
  const createdAt = typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString()
  const backup = createSundeskLocalBackup({
    workbase: normalizedWorkbase.base,
    rules: normalizedRules.rules,
    buildViewState: normalizedBuildViewState.buildViewState,
    createdAt,
  })

  return {
    ok: true,
    backup,
    workbase: backup.workbase,
    rules: backup.rules,
    buildViewState: backup.buildViewState,
    usedFallbacks: {
      workbase: normalizedWorkbase.reset,
      rules: normalizedRules.reset,
      buildViewState: normalizedBuildViewState.reset,
    },
  }
}

export function readLocalBackupRehearsed(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(localBackupRehearsalStorageKey) === 'true'
  } catch {
    return false
  }
}

export function markLocalBackupRehearsed(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(localBackupRehearsalStorageKey, 'true')
  } catch {
    return
  }
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

    const state = JSON.parse(rawState) as unknown

    if (!isObjectRecord(state) || state.version !== 1) {
      storedMigrationReport.buildViewReset = true
      return {}
    }

    return normalizeStoredBuildViewState(state).buildViewState
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

    const normalizedRules = normalizeStoredRules(rules)
    storedMigrationReport.rulesReset = normalizedRules.reset

    return normalizedRules.rules
  } catch {
    storedMigrationReport.rulesReset = true
    return getDefaultLocalRules()
  }
}
