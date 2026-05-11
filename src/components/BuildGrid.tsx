import { useState, type ClipboardEvent, type CSSProperties, type ReactNode } from 'react'
import { getCopyModeText } from '../data/copyMode'
import type { BaseRecord, FieldDefinition } from '../data/workbase'

const DEFAULT_COLUMN_WIDTH = 180
const MIN_COLUMN_WIDTH = 120
const MAX_COLUMN_WIDTH = 420
const ADD_FIELD_COLUMN_WIDTH = 118

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
  addFieldMenu?: ReactNode
  onAddField: () => void
  onCreateRecord: () => void
  onDeleteRecord: (recordId: string) => void
  onPaste: (event: ClipboardEvent<HTMLDivElement>) => void
  onSelectRecord: (recordId: string) => void
  renderEditableGridCell: (record: BaseRecord, field: FieldDefinition) => ReactNode
  renderGridHeader: (field: FieldDefinition, menuKey: string) => ReactNode
  rupaulMode: boolean
  selectedRecordId: string | undefined
  sortedAndFilteredRecordCount: number
  visibleFieldsForGrid: FieldDefinition[]
}

// eslint-disable-next-line react-refresh/only-export-components
export function getBuildGridColumnStyle(width: number | undefined): CSSProperties {
  const nextWidth = Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, width || DEFAULT_COLUMN_WIDTH))

  return { width: nextWidth, minWidth: nextWidth }
}

function getFixedColumnStyle(width: number): CSSProperties {
  return { width, minWidth: width }
}

// eslint-disable-next-line react-refresh/only-export-components
export function shouldHandleBuildGridPaste(target: EventTarget | null) {
  const targetElement = target as {
    closest?: (selector: string) => unknown
    isContentEditable?: boolean
  } | null

  if (!targetElement) {
    return true
  }

  if (targetElement.isContentEditable) {
    return false
  }

  return !targetElement.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"]')
}

export function BuildGrid({
  columnWidths,
  getGridRowColorClass,
  groupField,
  groupedRecords,
  gridDensity,
  isGridCellSelected,
  addFieldMenu,
  onAddField,
  onCreateRecord,
  onDeleteRecord,
  onPaste,
  onSelectRecord,
  renderEditableGridCell,
  renderGridHeader,
  rupaulMode,
  selectedRecordId,
  sortedAndFilteredRecordCount,
  visibleFieldsForGrid,
}: BuildGridProps) {
  const [openRowMenuId, setOpenRowMenuId] = useState('')

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    if (!shouldHandleBuildGridPaste(event.target)) {
      return
    }

    onPaste(event)
  }

  return (
    <>
      {groupedRecords.map((group) => (
        <section className="record-grid-group" key={group.label || 'all-records'}>
          {groupField && (
            <div className="group-header">
              <strong>{group.label}</strong>
              <span>{group.records.length} rows</span>
            </div>
          )}
          <div className="record-table-wrap" data-testid="record-table-wrap" onPaste={handlePaste}>
            <table className={`record-table density-${gridDensity}`}>
              <colgroup>
                {visibleFieldsForGrid.map((field) => (
                  <col key={field.id} style={getBuildGridColumnStyle(columnWidths[field.id])} />
                ))}
                <col style={getFixedColumnStyle(ADD_FIELD_COLUMN_WIDTH)} />
              </colgroup>
              <thead>
                <tr>
                  {visibleFieldsForGrid.map((field) => (
                    <th key={field.id} style={getBuildGridColumnStyle(columnWidths[field.id])}>
                      {renderGridHeader(field, `${group.label || 'all'}:${field.id}`)}
                    </th>
                  ))}
                  <th className="add-field-column add-field-header-cell" style={getFixedColumnStyle(ADD_FIELD_COLUMN_WIDTH)}>
                    <button
                      aria-label="Add column"
                      data-copy-plain="Add column"
                      data-onboarding-target="build-add-field"
                      title="Add column"
                      type="button"
                      onClick={onAddField}
                    >
                      {getCopyModeText('button.addField', rupaulMode)}
                    </button>
                    {addFieldMenu}
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.records.map((record) => (
                  <tr
                    className={`${record.id === selectedRecordId ? 'selected-row' : ''} ${getGridRowColorClass(record)}`.trim()}
                    data-onboarding-target="build-record-row"
                    key={record.id}
                    onClick={() => onSelectRecord(record.id)}
                  >
                    {visibleFieldsForGrid.map((field, fieldIndex) => (
                      <td
                        className={isGridCellSelected({ recordId: record.id, fieldId: field.id }) ? 'selected-grid-cell' : ''}
                        key={field.id}
                        style={getBuildGridColumnStyle(columnWidths[field.id])}
                      >
                        {fieldIndex === 0 && (
                          <span className="grid-row-menu-wrap">
                            <button
                              aria-controls={openRowMenuId === record.id ? `grid-row-menu-${record.id}` : undefined}
                              aria-expanded={openRowMenuId === record.id}
                              aria-haspopup="menu"
                              aria-label="Row actions"
                              className="grid-row-menu-trigger"
                              data-testid={`build-row-menu-${record.id}`}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                setOpenRowMenuId(openRowMenuId === record.id ? '' : record.id)
                              }}
                            >
                              ⋯
                            </button>
                            {openRowMenuId === record.id && (
                              <span
                                className="grid-field-menu grid-row-menu"
                                id={`grid-row-menu-${record.id}`}
                                role="menu"
                                aria-label="Row actions"
                              >
                                <button
                                  className="danger menu-danger"
                                  role="menuitem"
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setOpenRowMenuId('')
                                    onDeleteRecord(record.id)
                                  }}
                                >
                                  Delete row
                                </button>
                              </span>
                            )}
                          </span>
                        )}
                        {renderEditableGridCell(record, field)}
                      </td>
                    ))}
                    <td className="add-field-cell" style={getFixedColumnStyle(ADD_FIELD_COLUMN_WIDTH)} />
                  </tr>
                ))}
                <tr className="add-record-row">
                  <td colSpan={visibleFieldsForGrid.length + 1}>
                    <button
                      aria-label="Add row"
                      data-copy-plain="Add row"
                      data-testid="build-add-record"
                      title="Add row"
                      type="button"
                      onClick={onCreateRecord}
                    >
                      {getCopyModeText('button.addRecord', rupaulMode)}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {sortedAndFilteredRecordCount === 0 && <p className="empty-note">No rows match. Clear the filter or add a row.</p>}
    </>
  )
}
