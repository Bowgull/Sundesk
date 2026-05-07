import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cloneWorkbase,
  getEmptyFieldValue,
  getEmptyRecordValues,
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

  it('repairs malformed stored Rules while preserving starter defaults', () => {
    stubLocalStorage({
      [rulesStorageKey]: JSON.stringify([{ id: 'bad-rule' }]),
    })

    const rules = readStoredRules()

    expect(rules.map((rule) => rule.id)).toContain('rule-blocked-status')
    expect(storedMigrationReport.rulesReset).toBe(true)
  })
})
