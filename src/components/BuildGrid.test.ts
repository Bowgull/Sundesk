import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BuildGrid, getBuildGridColumnStyle, shouldHandleBuildGridPaste } from './BuildGrid'
import type { BaseRecord, FieldDefinition } from '../data/workbase'

const fields: FieldDefinition[] = [
  { id: 'title', tableId: 'tasks', label: 'Title', type: 'text' },
  { id: 'status', tableId: 'tasks', label: 'Status', type: 'singleSelect', options: ['Open'] },
]

const records: BaseRecord[] = [
  { id: 'task_one', tableId: 'tasks', values: { title: 'One', status: 'Open' } },
]

describe('BuildGrid', () => {
  it('keeps column widths anchored through a table column group', () => {
    const html = renderToStaticMarkup(
      createElement(BuildGrid, {
        columnWidths: { title: 244 },
        getGridRowColorClass: () => '',
        groupField: undefined,
        groupedRecords: [{ label: '', records }],
        gridDensity: 'compact',
        isGridCellSelected: () => false,
        onAddField: () => undefined,
        onCreateRecord: () => undefined,
        onDeleteRecord: () => undefined,
        onPaste: () => undefined,
        onSelectRecord: () => undefined,
        renderEditableGridCell: (record: BaseRecord, field: FieldDefinition) => String(record.values[field.id] || ''),
        renderGridHeader: (field: FieldDefinition) => field.label,
        rupaulMode: false,
        selectedRecordId: undefined,
        sortedAndFilteredRecordCount: records.length,
        visibleFieldsForGrid: fields,
      }),
    )

    expect(html).toContain('<colgroup>')
    expect(html).toContain('width:244px')
    expect(html).toContain('width:180px')
    expect(html).toContain('width:118px')
  })

  it('keeps routine row work inside the grid without a separate edit column', () => {
    const html = renderToStaticMarkup(
      createElement(BuildGrid, {
        columnWidths: { title: 244 },
        getGridRowColorClass: () => '',
        groupField: undefined,
        groupedRecords: [{ label: '', records }],
        gridDensity: 'compact',
        isGridCellSelected: () => false,
        onAddField: () => undefined,
        onCreateRecord: () => undefined,
        onDeleteRecord: () => undefined,
        onPaste: () => undefined,
        onSelectRecord: () => undefined,
        renderEditableGridCell: (record: BaseRecord, field: FieldDefinition) => String(record.values[field.id] || ''),
        renderGridHeader: (field: FieldDefinition) => field.label,
        rupaulMode: false,
        selectedRecordId: undefined,
        sortedAndFilteredRecordCount: records.length,
        visibleFieldsForGrid: fields,
      }),
    )

    expect(html).toContain('aria-label="Add row"')
    expect(html).toContain('aria-label="Add column"')
    expect(html).not.toContain('row-action-column')
    expect(html).not.toContain('row-action-cell')
    expect(html).not.toContain('>Edit</button>')
    expect(html).not.toContain('>Saved</th>')
  })

  it('uses the same guarded column width style for headers and cells', () => {
    expect(getBuildGridColumnStyle(96)).toEqual({ width: 120, minWidth: 120 })
    expect(getBuildGridColumnStyle(501)).toEqual({ width: 420, minWidth: 420 })
    expect(getBuildGridColumnStyle(undefined)).toEqual({ width: 180, minWidth: 180 })
  })

  it('does not treat paste inside active editors as grid paste', () => {
    const inputTarget = {
      closest: (selector: string) => selector.includes('input') ? inputTarget : null,
    } as unknown as EventTarget
    const gridTarget = {
      closest: () => null,
    } as unknown as EventTarget

    expect(shouldHandleBuildGridPaste(inputTarget)).toBe(false)
    expect(shouldHandleBuildGridPaste(gridTarget)).toBe(true)
  })
})
