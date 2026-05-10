import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cloneWorkbase,
  buildViewStateStorageKey,
  getEmptyFieldValue,
  getEmptyRecordValues,
  readStoredBuildViewState,
  readStoredRules,
  readStoredWorkbase,
  rulesStorageKey,
  storedMigrationReport,
  workbaseStorageKey,
} from './localStorage'
import {
  workbase,
} from './workbase'

function stubLocalStorage(initialValues: Record<string, string>) {
  const values = new Map(Object.entries(initialValues))

  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  })
}

function resetMigrationReport() {
  storedMigrationReport.workbaseReset = false
  storedMigrationReport.rulesReset = false
  storedMigrationReport.buildViewReset = false
}

describe('local storage helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    resetMigrationReport()
  })

  it('creates empty values by field type', () => {
    expect(getEmptyFieldValue('checkbox')).toBe(false)
    expect(getEmptyFieldValue('linkedRecord')).toEqual([])
    expect(getEmptyFieldValue('multiSelect')).toEqual([])
    expect(getEmptyFieldValue('text')).toBe('')
  })

  it('creates empty editable record values without computed fields', () => {
    expect(getEmptyRecordValues(workbase, 'tasks')).toEqual({
      title: '',
      status: '',
      dueDate: '',
      priority: '',
      tags: [],
      community: [],
      approval: [],
      owner: [],
    })
  })

  it('clones the workbase without sharing nested arrays or values', () => {
    const clonedBase = cloneWorkbase(workbase)

    clonedBase.fields[1].options?.push('Paused')
    clonedBase.records[0].values.name = 'Changed'

    expect(workbase.fields[1].options).not.toContain('Paused')
    expect(workbase.records[0].values.name).toBe('Halifax')
  })

  it('repairs malformed stored workbase state', () => {
    stubLocalStorage({
      [workbaseStorageKey]: JSON.stringify({ version: 1, base: { tables: [], fields: [], records: [], dependencies: [] } }),
    })

    expect(readStoredWorkbase().tables.length).toBe(workbase.tables.length)
    expect(storedMigrationReport.workbaseReset).toBe(true)
  })

  it('repairs malformed linked values and dependency links in stored workbase state', () => {
    const storedBase = cloneWorkbase(workbase)
    const task = storedBase.records.find((record) => record.id === 'task_coi_halifax')

    if (task) {
      task.values.community = ['community_halifax', 7] as unknown as string[]
    }

    storedBase.dependencies = [
      storedBase.dependencies[0],
      {
        id: 'dependency_missing',
        fromRecordId: 'task_coi_halifax',
        toRecordId: 'missing_record',
        relationship: 'dependsOn',
        reason: 'Missing target.',
      },
      {
        id: 'dependency_self',
        fromRecordId: 'task_coi_halifax',
        toRecordId: 'task_coi_halifax',
        relationship: 'dependsOn',
        reason: 'Self link.',
      },
    ]
    stubLocalStorage({
      [workbaseStorageKey]: JSON.stringify({ version: 1, base: storedBase }),
    })

    const repairedBase = readStoredWorkbase()
    const repairedTask = repairedBase.records.find((record) => record.id === 'task_coi_halifax')

    expect(repairedTask?.values.community).toEqual([])
    expect(repairedBase.dependencies.map((dependency) => dependency.id)).toEqual(['dependency_coi_halifax'])
    expect(storedMigrationReport.workbaseReset).toBe(false)
  })

  it('repairs malformed field definitions and restores missing editable values', () => {
    const storedBase = cloneWorkbase(workbase)
    const task = storedBase.records.find((record) => record.id === 'task_coi_halifax')

    storedBase.fields.push(
      { id: 'orphan', tableId: 'missing_table', label: 'Orphan', type: 'text' },
      { id: 'bad_type', tableId: 'tasks', label: 'Bad type', type: 'bad' as never },
    )
    if (task) {
      delete task.values.status
    }
    stubLocalStorage({
      [workbaseStorageKey]: JSON.stringify({ version: 1, base: storedBase }),
    })

    const repairedBase = readStoredWorkbase()
    const repairedTask = repairedBase.records.find((record) => record.id === 'task_coi_halifax')

    expect(repairedBase.fields.map((field) => field.id)).not.toContain('orphan')
    expect(repairedBase.fields.map((field) => field.id)).not.toContain('bad_type')
    expect(repairedTask?.values.status).toBe('')
    expect(storedMigrationReport.workbaseReset).toBe(false)
  })

  it('repairs malformed stored Rules while preserving starter defaults', () => {
    stubLocalStorage({
      [rulesStorageKey]: JSON.stringify([{ id: 'bad-rule' }]),
    })

    const rules = readStoredRules()

    expect(rules.map((rule) => rule.id)).toContain('rule-blocked-status')
    expect(storedMigrationReport.rulesReset).toBe(true)
  })

  it('repairs malformed Build view state without losing valid saved views', () => {
    stubLocalStorage({
      [buildViewStateStorageKey]: JSON.stringify({
        version: 1,
        selectedBuildTableId: 'tasks',
        visibleFieldIdsByTable: {
          tasks: ['title', 'status'],
          bad: [false],
        },
        gridFilter: 'permit',
        gridSortFieldId: 'dueDate',
        gridSortDirection: 'desc',
        gridGroupFieldId: 'status',
        localGridViews: [
          {
            id: 'tasks_view_1',
            name: 'Tasks view 1',
            tableId: 'tasks',
            filter: 'permit',
            sortFieldId: 'dueDate',
            sortDirection: 'desc',
            groupFieldId: 'status',
            visibleFieldIds: ['title', 'status'],
            pinned: true,
          },
          { id: 'bad-view' },
        ],
        viewRenameDrafts: {
          tasks_view_1: 'Tasks view 1',
          bad: false,
        },
        activeGridViewId: 'tasks_view_1',
        columnWidths: {
          title: 220,
          bad: 'wide',
        },
      }),
    })

    const state = readStoredBuildViewState()

    expect(state.selectedBuildTableId).toBe('tasks')
    expect(state.visibleFieldIdsByTable).toEqual({ tasks: ['title', 'status'] })
    expect(state.gridSortDirection).toBe('desc')
    expect(state.localGridViews).toEqual([
      {
        id: 'tasks_view_1',
        name: 'Tasks view 1',
        tableId: 'tasks',
        filter: 'permit',
        sortFieldId: 'dueDate',
        sortDirection: 'desc',
        groupFieldId: 'status',
        visibleFieldIds: ['title', 'status'],
        pinned: true,
      },
    ])
    expect(state.viewRenameDrafts).toEqual({ tasks_view_1: 'Tasks view 1' })
    expect(state.columnWidths).toEqual({ title: 220 })
    expect(storedMigrationReport.buildViewReset).toBe(false)
  })
})
