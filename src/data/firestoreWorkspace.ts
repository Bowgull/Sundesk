import { themes, type ThemeId } from '../appConfig'
import {
  normalizeSundeskEducationState,
  type SundeskEducationState,
} from './educationState'
import {
  cloneWorkbase,
  computedFieldTypes,
  defaultVisibleFieldIdsByTable,
  getEmptyFieldValue,
  type LocalGridView,
  type StoredBuildViewState,
} from './localStorage'
import {
  getDefaultLocalRules,
  isLocalRule,
  mergeDefaultLocalRules,
  type LocalRule,
} from './rules'
import {
  workbase,
  type BaseRecord,
  type DependencyLink,
  type FieldDefinition,
  type FieldType,
  type RecordValue,
  type Workbase,
} from './workbase'

export const defaultFirestoreWorkspaceId = 'lindsay-sundesk'
export const firestoreWorkspaceSchemaVersion = 1

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

export type FirestoreWorkspaceMetadata = {
  schemaVersion: 1
  workspaceId: string
  updatedAt: string
  updatedByUid: string
  updatedByEmail?: string
}

export type FirestoreWorkspaceSnapshot = {
  version: 1
  workspaceId: string
  base: Workbase
  rules: LocalRule[]
  buildViewState: StoredBuildViewState
  educationState?: SundeskEducationState
  theme: ThemeId
  metadata: FirestoreWorkspaceMetadata
}

export type FirestoreWorkspaceLocalState = {
  base: Workbase
  rules: LocalRule[]
  buildViewState: StoredBuildViewState
  educationState?: SundeskEducationState
  theme: ThemeId
  workspaceId?: string
  metadata: {
    updatedAt: string
    updatedByUid: string
    updatedByEmail?: string
  }
}

export type NormalizedFirestoreWorkspaceState = Omit<FirestoreWorkspaceSnapshot, 'educationState'> & {
  educationState: SundeskEducationState
  usedFallbacks: {
    base: boolean
    rules: boolean
    buildViewState: boolean
    theme: boolean
    educationState: boolean
  }
}

export type FirestoreWorkspaceWriteGate = {
  enabled: boolean
}

export type FirestoreWorkspaceWriter = {
  setDocument: (path: string, payload: FirestoreWorkspaceSnapshot) => Promise<void>
}

export function getDefaultFirestoreBuildViewState(): StoredBuildViewState {
  return {
    version: 1,
    selectedBuildTableId: 'tasks',
    visibleFieldIdsByTable: defaultVisibleFieldIdsByTable,
    gridFilter: '',
    gridSortFieldId: 'title',
    gridSortDirection: 'asc',
    gridGroupFieldId: '',
    gridColorFieldId: '',
    gridDensity: 'comfortable',
    localGridViews: [],
    viewRenameDrafts: {},
    activeGridViewId: '',
    columnWidths: {},
  }
}

export function getFirestoreWorkspaceDocumentPath(workspaceId = defaultFirestoreWorkspaceId) {
  return `workspaces/${workspaceId}`
}

export function getFirestoreWorkspaceSnapshotPath(workspaceId = defaultFirestoreWorkspaceId) {
  return `${getFirestoreWorkspaceDocumentPath(workspaceId)}/state/current`
}

export function getFirestoreWorkspaceCollectionPath(collectionName: string, workspaceId = defaultFirestoreWorkspaceId) {
  return `${getFirestoreWorkspaceDocumentPath(workspaceId)}/${collectionName}`
}

export function getFirestoreWorkspaceCollectionDocumentPath(
  collectionName: string,
  documentId: string,
  workspaceId = defaultFirestoreWorkspaceId,
) {
  return `${getFirestoreWorkspaceCollectionPath(collectionName, workspaceId)}/${documentId}`
}

export function createFirestoreWorkspaceSnapshot(state: FirestoreWorkspaceLocalState): FirestoreWorkspaceSnapshot {
  const workspaceId = state.workspaceId || defaultFirestoreWorkspaceId

  return {
    version: firestoreWorkspaceSchemaVersion,
    workspaceId,
    base: cloneWorkbase(state.base),
    rules: state.rules.map((rule) => ({ ...rule })),
    buildViewState: cloneBuildViewState(state.buildViewState),
    ...(state.educationState ? { educationState: normalizeSundeskEducationState(state.educationState).educationState } : {}),
    theme: state.theme,
    metadata: {
      schemaVersion: firestoreWorkspaceSchemaVersion,
      workspaceId,
      ...state.metadata,
    },
  }
}

export function normalizeFirestoreWorkspaceSnapshot(value: unknown): NormalizedFirestoreWorkspaceState {
  const snapshot = isRecord(value) ? value : {}
  const workspaceId = typeof snapshot.workspaceId === 'string' ? snapshot.workspaceId : defaultFirestoreWorkspaceId
  const normalizedBase = normalizeFirestoreWorkbase(snapshot.base)
  const normalizedRules = normalizeFirestoreRules(snapshot.rules)
  const normalizedBuildViewState = normalizeFirestoreBuildViewState(snapshot.buildViewState)
  const normalizedTheme = normalizeFirestoreTheme(snapshot.theme)
  const normalizedEducationState = normalizeSundeskEducationState(snapshot.educationState)
  const metadata = normalizeFirestoreMetadata(snapshot.metadata, workspaceId)

  return {
    version: firestoreWorkspaceSchemaVersion,
    workspaceId,
    base: normalizedBase.base,
    rules: normalizedRules.rules,
    buildViewState: normalizedBuildViewState.buildViewState,
    educationState: normalizedEducationState.educationState,
    theme: normalizedTheme.theme,
    metadata,
    usedFallbacks: {
      base: normalizedBase.usedFallback,
      rules: normalizedRules.usedFallback,
      buildViewState: normalizedBuildViewState.usedFallback,
      theme: normalizedTheme.usedFallback,
      educationState: normalizedEducationState.usedFallback,
    },
  }
}

export async function writeFirestoreWorkspaceSnapshot(
  writer: FirestoreWorkspaceWriter,
  snapshot: FirestoreWorkspaceSnapshot,
  gate: FirestoreWorkspaceWriteGate,
) {
  assertFirestoreWorkspaceWritesEnabled(gate)
  await writer.setDocument(getFirestoreWorkspaceSnapshotPath(snapshot.workspaceId), snapshot)
}

export function assertFirestoreWorkspaceWritesEnabled(gate: FirestoreWorkspaceWriteGate) {
  if (!gate.enabled) {
    throw new Error('Firestore workspace writes are disabled.')
  }
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

function cloneLocalGridView(view: LocalGridView): LocalGridView {
  return {
    ...view,
    visibleFieldIds: [...view.visibleFieldIds],
  }
}

function cloneStringArrayRecord(value: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, [...item]]))
}

function normalizeFirestoreMetadata(value: unknown, workspaceId: string): FirestoreWorkspaceMetadata {
  const metadata = isRecord(value) ? value : {}

  return {
    schemaVersion: firestoreWorkspaceSchemaVersion,
    workspaceId,
    updatedAt: typeof metadata.updatedAt === 'string' ? metadata.updatedAt : '',
    updatedByUid: typeof metadata.updatedByUid === 'string' ? metadata.updatedByUid : '',
    updatedByEmail: typeof metadata.updatedByEmail === 'string' ? metadata.updatedByEmail : undefined,
  }
}

function normalizeFirestoreTheme(value: unknown): { theme: ThemeId, usedFallback: boolean } {
  const theme = themes.find((option) => option.value === value)?.value

  return {
    theme: theme || 'command-center',
    usedFallback: !theme,
  }
}

function normalizeFirestoreRules(value: unknown): { rules: LocalRule[], usedFallback: boolean } {
  if (!Array.isArray(value)) {
    return { rules: getDefaultLocalRules(), usedFallback: true }
  }

  const rules = value.filter(isLocalRule)

  return {
    rules: rules.length > 0 ? mergeDefaultLocalRules(rules) : getDefaultLocalRules(),
    usedFallback: rules.length !== value.length || rules.length === 0,
  }
}

function normalizeFirestoreBuildViewState(value: unknown): { buildViewState: StoredBuildViewState, usedFallback: boolean } {
  if (!isRecord(value) || value.version !== 1) {
    return { buildViewState: getDefaultFirestoreBuildViewState(), usedFallback: true }
  }

  return {
    buildViewState: {
      version: 1,
      selectedBuildTableId: typeof value.selectedBuildTableId === 'string' ? value.selectedBuildTableId : 'tasks',
      visibleFieldIdsByTable: normalizeStringArrayRecord(value.visibleFieldIdsByTable),
      gridFilter: typeof value.gridFilter === 'string' ? value.gridFilter : '',
      gridSortFieldId: typeof value.gridSortFieldId === 'string' ? value.gridSortFieldId : 'title',
      gridSortDirection: value.gridSortDirection === 'desc' ? 'desc' : 'asc',
      gridGroupFieldId: typeof value.gridGroupFieldId === 'string' ? value.gridGroupFieldId : '',
      gridColorFieldId: typeof value.gridColorFieldId === 'string' ? value.gridColorFieldId : '',
      gridDensity: value.gridDensity === 'compact' || value.gridDensity === 'expanded' ? value.gridDensity : 'comfortable',
      localGridViews: Array.isArray(value.localGridViews) ? value.localGridViews.filter(isLocalGridView).map(cloneLocalGridView) : [],
      viewRenameDrafts: normalizeStringRecord(value.viewRenameDrafts),
      activeGridViewId: typeof value.activeGridViewId === 'string' ? value.activeGridViewId : '',
      columnWidths: normalizeNumberRecord(value.columnWidths),
    },
    usedFallback: false,
  }
}

function normalizeFirestoreWorkbase(value: unknown): { base: Workbase, usedFallback: boolean } {
  if (!isRecord(value) || !Array.isArray(value.tables) || !Array.isArray(value.fields) || !Array.isArray(value.records) || !Array.isArray(value.dependencies)) {
    return { base: cloneWorkbase(workbase), usedFallback: true }
  }

  const tables = value.tables.filter(isTableDefinition)
  const tableIds = new Set(tables.map((table) => table.id))
  const fields = value.fields.filter((field) => isFieldDefinition(field) && tableIds.has(field.tableId))
  const fieldKeys = new Set(fields.map((field) => `${field.tableId}:${field.id}`))
  const records = value.records
    .filter((record) => isBaseRecord(record) && tableIds.has(record.tableId))
    .map((record) => {
      const values = Object.fromEntries(
        Object.entries(record.values).filter(([fieldId, recordValue]) => fieldKeys.has(`${record.tableId}:${fieldId}`) && isRecordValue(recordValue)),
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
  const dependencies = value.dependencies.filter(
    (dependency) =>
      isDependencyLink(dependency) &&
      recordIds.has(dependency.fromRecordId) &&
      recordIds.has(dependency.toRecordId) &&
      dependency.fromRecordId !== dependency.toRecordId,
  )

  if (tables.length === 0 || fields.length === 0) {
    return { base: cloneWorkbase(workbase), usedFallback: true }
  }

  return {
    base: {
      tables,
      fields,
      records,
      dependencies,
    },
    usedFallback: false,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isRecordValue(value: unknown): value is RecordValue {
  return value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    (Array.isArray(value) && value.every((item) => typeof item === 'string'))
}

function isTableDefinition(value: unknown): value is Workbase['tables'][number] {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.description === 'string' &&
    typeof value.primaryFieldId === 'string'
}

function isFieldDefinition(value: unknown): value is FieldDefinition {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.id === 'string' &&
    typeof value.tableId === 'string' &&
    typeof value.label === 'string' &&
    fieldTypeValues.some((fieldType) => fieldType === value.type)
}

function isBaseRecord(value: unknown): value is BaseRecord {
  if (!isRecord(value) || !isRecord(value.values)) {
    return false
  }

  return typeof value.id === 'string' &&
    typeof value.tableId === 'string'
}

function isDependencyLink(value: unknown): value is DependencyLink {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.id === 'string' &&
    typeof value.fromRecordId === 'string' &&
    typeof value.toRecordId === 'string' &&
    (value.relationship === 'dependsOn' || value.relationship === 'blocks') &&
    typeof value.reason === 'string'
}

function isLocalGridView(value: unknown): value is LocalGridView {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.tableId === 'string' &&
    typeof value.filter === 'string' &&
    typeof value.sortFieldId === 'string' &&
    (!value.sortDirection || value.sortDirection === 'asc' || value.sortDirection === 'desc') &&
    typeof value.groupFieldId === 'string' &&
    (!value.colorFieldId || typeof value.colorFieldId === 'string') &&
    (!value.density || value.density === 'compact' || value.density === 'comfortable' || value.density === 'expanded') &&
    Array.isArray(value.visibleFieldIds) &&
    value.visibleFieldIds.every((fieldId) => typeof fieldId === 'string')
}

function normalizeStringArrayRecord(value: unknown): Record<string, string[]> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.entries(value).reduce<Record<string, string[]>>((record, [key, item]) => {
    if (typeof key === 'string' && Array.isArray(item) && item.every((child) => typeof child === 'string')) {
      record[key] = item
    }

    return record
  }, {})
}

function normalizeStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.entries(value).reduce<Record<string, string>>((record, [key, item]) => {
    if (typeof key === 'string' && typeof item === 'string') {
      record[key] = item
    }

    return record
  }, {})
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.entries(value).reduce<Record<string, number>>((record, [key, item]) => {
    if (typeof key === 'string' && typeof item === 'number') {
      record[key] = item
    }

    return record
  }, {})
}
