import { describe, expect, it } from 'vitest'
import { exportTableCsv } from './tableExport'
import {
  type BaseRecord,
  type FieldDefinition,
  type Workbase,
  getField,
  getRecord,
  workbase,
} from './workbase'

describe('table export', () => {
  it('exports field labels and display-formatted values', () => {
    const fields = [
      getField(workbase, 'tasks', 'title'),
      getField(workbase, 'tasks', 'status'),
      getField(workbase, 'tasks', 'community'),
      getField(workbase, 'tasks', 'tags'),
      getField(workbase, 'tasks', 'communityEventDate'),
    ].filter((field): field is FieldDefinition => Boolean(field))
    const record = getRecord(workbase, 'task_coi_halifax')

    expect(record).toBeDefined()
    expect(exportTableCsv(workbase, fields, [record!])).toBe([
      'Title,Status,Community,Tags,Community event date',
      'Confirm COI status.,Blocked,Halifax,"COI, Blocked",2026-05-22',
    ].join('\n'))
  })

  it('escapes commas, quotes, and newlines', () => {
    const base: Workbase = {
      tables: [{ id: 'tasks', label: 'Work', description: '', primaryFieldId: 'title' }],
      fields: [
        { id: 'title', tableId: 'tasks', label: 'Title', type: 'text' },
        { id: 'note', tableId: 'tasks', label: 'Note', type: 'longText' },
      ],
      records: [
        {
          id: 'task_export',
          tableId: 'tasks',
          values: {
            title: 'Venue, map',
            note: 'Ask "lead"\nThen file',
          },
        },
      ],
      dependencies: [],
    }

    expect(exportTableCsv(base, base.fields, base.records)).toBe([
      'Title,Note',
      '"Venue, map","Ask ""lead""\nThen file"',
    ].join('\n'))
  })

  it('uses computed count and rollup display values', () => {
    const fields = [
      getField(workbase, 'communities', 'name'),
      getField(workbase, 'communities', 'openTaskCount'),
      getField(workbase, 'communities', 'approvalStatusRollup'),
    ].filter((field): field is FieldDefinition => Boolean(field))
    const record = getRecord(workbase, 'community_halifax')

    expect(record).toBeDefined()
    expect(exportTableCsv(workbase, fields, [record!])).toBe([
      'Name,Open work,Approval status',
      'Halifax,4,"Blocked, Missing, Waiting"',
    ].join('\n'))
  })

  it('formats booleans and empty arrays through existing display rules', () => {
    const base: Workbase = {
      tables: [{ id: 'tasks', label: 'Work', description: '', primaryFieldId: 'title' }],
      fields: [
        { id: 'title', tableId: 'tasks', label: 'Title', type: 'text' },
        { id: 'done', tableId: 'tasks', label: 'Done', type: 'checkbox' },
        { id: 'tags', tableId: 'tasks', label: 'Tags', type: 'multiSelect' },
      ],
      records: [
        {
          id: 'task_export',
          tableId: 'tasks',
          values: {
            title: 'Close packet',
            done: true,
            tags: [],
          },
        },
      ],
      dependencies: [],
    }

    expect(exportTableCsv(base, base.fields, base.records as BaseRecord[])).toBe([
      'Title,Done,Tags',
      'Close packet,Yes,Empty',
    ].join('\n'))
  })
})
