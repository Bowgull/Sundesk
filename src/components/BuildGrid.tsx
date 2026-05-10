import type { ClipboardEvent, ReactNode } from 'react'
import type { BaseRecord, FieldDefinition } from '../data/workbase'

type GridCell = {
  recordId: string
  fieldId: string
}

type GridGroup = {
  label: string
  records: BaseRecord[]
}

type BuildGridProps = {
  columnWidths: Record<string, number>
  getGridRowColorClass: (record: BaseRecord) => string
  groupField: FieldDefinition | undefined
  groupedRecords: GridGroup[]
  gridDensity: string
  isGridCellSelected: (cell: GridCell) => boolean
  onAddField: () => void
  onCreateRecord: () => void
  onEditRecord: (recordId: string) => void
  onPaste: (event: ClipboardEvent<HTMLDivElement>) => void
  onSelectRecord: (recordId: string) => void
  renderEditableGridCell: (record: BaseRecord, field: FieldDefinition) => ReactNode
  renderGridHeader: (field: FieldDefinition, menuKey: string) => ReactNode
  selectedRecordId: string | undefined
  sortedAndFilteredRecordCount: number
  visibleFieldsForGrid: FieldDefinition[]
}

export function BuildGrid({
  columnWidths,
  getGridRowColorClass,
  groupField,
  groupedRecords,
  gridDensity,
  isGridCellSelected,
  onAddField,
  onCreateRecord,
  onEditRecord,
  onPaste,
  onSelectRecord,
  renderEditableGridCell,
  renderGridHeader,
  selectedRecordId,
  sortedAndFilteredRecordCount,
  visibleFieldsForGrid,
}: BuildGridProps) {
  return (
    <>
      {groupedRecords.map((group) => (
        <section className="record-grid-group" key={group.label || 'all-records'}>
          {groupField && (
            <div className="group-header">
              <strong>{group.label}</strong>
              <span>{group.records.length} records</span>
            </div>
          )}
          <div className="record-table-wrap" data-testid="record-table-wrap" onPaste={onPaste}>
            <table className={`record-table density-${gridDensity}`}>
              <thead>
                <tr>
                  {visibleFieldsForGrid.map((field) => (
                    <th key={field.id} style={{ width: columnWidths[field.id] || 180, minWidth: columnWidths[field.id] || 180 }}>
                      {renderGridHeader(field, `${group.label || 'all'}:${field.id}`)}
                    </th>
                  ))}
                  <th className="add-field-column">
                    <button aria-label="Add field from grid" data-onboarding-target="build-add-field" type="button" onClick={onAddField}>+ Add field</button>
                  </th>
                  <th className="row-action-column">Saved</th>
                </tr>
              </thead>
              <tbody>
                {group.records.map((record) => (
                  <tr
                    className={`${record.id === selectedRecordId ? 'selected-row' : ''} ${getGridRowColorClass(record)}`.trim()}
                    data-onboarding-target="build-record-row"
                    key={record.id}
                    onClick={() => onSelectRecord(record.id)}
                    onDoubleClick={() => onEditRecord(record.id)}
                  >
                    {visibleFieldsForGrid.map((field) => (
                      <td
                        className={isGridCellSelected({ recordId: record.id, fieldId: field.id }) ? 'selected-grid-cell' : ''}
                        key={field.id}
                        style={{ width: columnWidths[field.id] || 180, minWidth: columnWidths[field.id] || 180 }}
                      >
                        {renderEditableGridCell(record, field)}
                      </td>
                    ))}
                    <td className="add-field-cell" />
                    <td className="row-action-cell">
                      <button data-testid={`edit-record-${record.id}`} type="button" onClick={() => onEditRecord(record.id)}>Edit</button>
                    </td>
                  </tr>
                ))}
                <tr className="add-record-row">
                  <td colSpan={visibleFieldsForGrid.length + 2}>
                    <button data-testid="build-add-record" type="button" onClick={onCreateRecord}>+ Add record</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {sortedAndFilteredRecordCount === 0 && <p className="empty-note">No records match. Clear the filter or add a record.</p>}
    </>
  )
}
