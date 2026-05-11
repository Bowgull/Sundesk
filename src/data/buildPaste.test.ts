import { describe, expect, it } from 'vitest'
import {
  coerceBuildPasteCellValue,
  getBuildPasteOptionUpdates,
  getBuildPasteOverflowColumns,
  parseBuildPasteRows,
} from './buildPaste'
import type { FieldDefinition } from './workbase'

describe('Build paste helpers', () => {
  it('parses sheet paste while preserving blank cells inside useful rows', () => {
    expect(parseBuildPasteRows('Title\t\t2026-05-12\n\nSecond\tWaiting\t')).toEqual([
      ['Title', '', '2026-05-12'],
      ['Second', 'Waiting', ''],
    ])
  })

  it('reports pasted columns that do not have a visible Build field yet', () => {
    expect(getBuildPasteOverflowColumns([
      ['Name', 'Status', 'Owner', 'Notes'],
      ['Second', 'Waiting', 'Lindsay', 'Call back'],
    ], 1, 3)).toEqual(['Extra column 1', 'Extra column 2'])
  })

  it('coerces tags, checkboxes, numbers, and linked records for Build cells', () => {
    const tagsField: FieldDefinition = { id: 'tags', tableId: 'tasks', label: 'Tags', type: 'multiSelect' }
    const checkboxField: FieldDefinition = { id: 'done', tableId: 'tasks', label: 'Done', type: 'checkbox' }
    const numberField: FieldDefinition = { id: 'budget', tableId: 'tasks', label: 'Budget', type: 'currency' }
    const linkedField: FieldDefinition = { id: 'community', tableId: 'tasks', label: 'Community', type: 'linkedRecord', linkedTableId: 'communities' }

    expect(coerceBuildPasteCellValue(tagsField, 'Permit, Waiting; COI')).toEqual(['Permit', 'Waiting', 'COI'])
    expect(coerceBuildPasteCellValue(checkboxField, 'received')).toBe(true)
    expect(coerceBuildPasteCellValue(numberField, '$1,250.50')).toBe(1250.5)
    expect(coerceBuildPasteCellValue(linkedField, 'Toronto', [
      { id: 'community_toronto', title: 'Toronto' },
    ])).toEqual(['community_toronto'])
  })

  it('learns new select and tag options from pasted values', () => {
    const statusField: FieldDefinition = { id: 'status', tableId: 'tasks', label: 'Status', type: 'singleSelect', options: ['Waiting'] }
    const tagsField: FieldDefinition = { id: 'tags', tableId: 'tasks', label: 'Tags', type: 'multiSelect', options: ['Permit'] }
    const pastedValuesByFieldId = new Map([
      ['status', ['Waiting', 'Blocked']],
      ['tags', ['Permit, Wrap', 'COI; Wrap']],
    ])

    expect(getBuildPasteOptionUpdates([statusField, tagsField], pastedValuesByFieldId)).toEqual({
      status: ['Waiting', 'Blocked'],
      tags: ['Permit', 'Wrap', 'COI'],
    })
  })
})
