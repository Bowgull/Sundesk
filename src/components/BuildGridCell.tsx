import { useState, type KeyboardEvent, type ReactNode } from 'react'
import type { BaseRecord, FieldDefinition, RecordValue } from '../data/workbase'

export type BuildGridCellCoordinates = {
  recordId: string
  fieldId: string
}

type BuildGridCellProps = {
  commitGridCellEdit: () => void
  editDraft: RecordValue
  editingGridCell: BuildGridCellCoordinates | null
  field: FieldDefinition
  getChipColorClass: (value: string) => string
  getFieldDisplayValue: (record: BaseRecord, field: FieldDefinition) => string
  getGridCellKey: (cell: BuildGridCellCoordinates) => string
  getLinkedRecord: (recordId: string) => BaseRecord | undefined
  getLinkedRecordsForTable: (tableId: string) => BaseRecord[]
  getLinkedTableLabel: (tableId: string) => string | undefined
  getPickerRecordLabel: (record: BaseRecord) => string
  getPickerRecordMeta: (record: BaseRecord) => string
  getRecordContext: (record: BaseRecord) => string
  getRecordTitle: (record: BaseRecord) => string
  isComputedField: (field: FieldDefinition) => boolean
  linkedRecordFilters: Record<string, string>
  onEditorKeyDown: (record: BaseRecord, field: FieldDefinition, event: KeyboardEvent<HTMLDivElement>) => void
  onClearValue: (record: BaseRecord, field: FieldDefinition) => void
  onCommitValue: (recordId: string, fieldId: string, value: RecordValue) => void
  onQuickUpdate: (recordId: string, fieldId: string, value: RecordValue) => void
  onSavedKeyDown: (record: BaseRecord, field: FieldDefinition, event: KeyboardEvent<HTMLButtonElement>) => void
  record: BaseRecord
  renderCheckboxIcon: (icon: FieldDefinition['checkboxIcon']) => ReactNode
  selectedGridCell: BuildGridCellCoordinates | null
  selectGridCell: (recordId: string, fieldId: string) => void
  setEditDraft: (value: RecordValue) => void
  setLinkedRecordFilters: (updater: (current: Record<string, string>) => Record<string, string>) => void
  setSelectedBuildRecordId: (recordId: string) => void
  startGridCellEdit: (record: BaseRecord, field: FieldDefinition) => void
}

function isSameGridCell(firstCell: BuildGridCellCoordinates | null, secondCell: BuildGridCellCoordinates | null) {
  return Boolean(firstCell && secondCell && firstCell.recordId === secondCell.recordId && firstCell.fieldId === secondCell.fieldId)
}

function toggleListValue(values: string[], value: string, allowMultiple = true) {
  if (!allowMultiple) {
    return values.includes(value) ? [] : [value]
  }

  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

function getGridInputType(field: FieldDefinition) {
  if (field.type === 'date') {
    return 'date'
  }

  if (field.type === 'dateTime') {
    return 'datetime-local'
  }

  if (['number', 'currency', 'percent', 'rating'].includes(field.type)) {
    return 'number'
  }

  if (field.type === 'url') {
    return 'url'
  }

  return 'text'
}

export function BuildGridCell({
  commitGridCellEdit,
  editDraft,
  editingGridCell,
  field,
  getChipColorClass,
  getFieldDisplayValue,
  getGridCellKey,
  getLinkedRecord,
  getLinkedRecordsForTable,
  getLinkedTableLabel,
  getPickerRecordLabel,
  getPickerRecordMeta,
  getRecordContext,
  getRecordTitle,
  isComputedField,
  linkedRecordFilters,
  onClearValue,
  onEditorKeyDown,
  onCommitValue,
  onQuickUpdate,
  onSavedKeyDown,
  record,
  renderCheckboxIcon,
  selectedGridCell,
  selectGridCell,
  setEditDraft,
  setLinkedRecordFilters,
  setSelectedBuildRecordId,
  startGridCellEdit,
}: BuildGridCellProps) {
  const [activeLinkedOptionIndex, setActiveLinkedOptionIndex] = useState(0)
  const [isCellMenuOpen, setIsCellMenuOpen] = useState(false)
  const cell = { recordId: record.id, fieldId: field.id }
  const isSelected = isSameGridCell(selectedGridCell, cell)
  const isEditing = isSameGridCell(editingGridCell, cell)
  const isReadonly = isComputedField(field)
  const onboardingTarget = field.type === 'multiSelect'
    ? 'field-tags-cell'
    : field.type === 'linkedRecord'
      ? 'linked-record-cell'
      : undefined

  function renderSavedGridCell() {
    const value = record.values[field.id]

    if (field.type === 'checkbox') {
      return (
        <span className={`saved-check check-${field.checkboxColor || 'lime'} ${value ? 'checked' : ''}`}>
          {value ? renderCheckboxIcon(field.checkboxIcon) : 'No'}
        </span>
      )
    }

    if (field.type === 'multiSelect' && Array.isArray(value)) {
      return (
        <span className="saved-pill-list">
          {value.length === 0 && <span className="grid-linked-empty">Empty</span>}
          {value.map((option) => (
            <span className={`select-tag ${getChipColorClass(option)}`} key={option}>{option}</span>
          ))}
        </span>
      )
    }

    if (field.options) {
      const selectedValue = typeof value === 'string' ? value : ''

      return selectedValue ? <span className={`select-tag ${getChipColorClass(selectedValue)}`}>{selectedValue}</span> : <span className="grid-linked-empty">Empty</span>
    }

    if (field.type === 'linkedRecord' && Array.isArray(value)) {
      return (
        <span className="saved-pill-list">
          {value.length === 0 && <span className="grid-linked-empty">Empty</span>}
          {value.map((recordId) => {
            const linkedRecord = getLinkedRecord(recordId)

            return (
              <span className="linked-display-pill" key={recordId}>
                {linkedRecord ? getRecordTitle(linkedRecord) : recordId}
              </span>
            )
          })}
        </span>
      )
    }

    return <span className={isReadonly ? 'grid-cell-readonly' : 'saved-cell-value'}>{getFieldDisplayValue(record, field)}</span>
  }

  function renderGridCellEditor() {
    const value = editDraft

    if (field.type === 'checkbox') {
      return (
        <input
          autoFocus
          aria-label={`${field.label} editor`}
          checked={Boolean(value)}
          type="checkbox"
          onChange={(event) => setEditDraft(event.target.checked)}
        />
      )
    }

    if (field.type === 'multiSelect' && field.options) {
      const selectedOptions = Array.isArray(value) ? value : []

      return (
        <div className="grid-option-list" aria-label={`${field.label} editor`}>
          {field.options.map((option) => (
            <button
              aria-pressed={selectedOptions.includes(option)}
              className={selectedOptions.includes(option) ? 'selected' : ''}
              key={option}
              type="button"
              onClick={() => setEditDraft(toggleListValue(selectedOptions, option))}
            >
              {option}
            </button>
          ))}
        </div>
      )
    }

    if (field.options) {
      return (
        <select
          autoFocus
          aria-label={`${field.label} editor`}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => setEditDraft(event.target.value)}
        >
          <option value="">Choose</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === 'linkedRecord' && field.linkedTableId) {
      const selectedLinkedIds = Array.isArray(value) ? value : []
      const searchKey = `grid:${field.tableId}:${field.id}`
      const searchTerm = linkedRecordFilters[searchKey] || ''
      const normalizedSearchTerm = searchTerm.trim().toLowerCase()
      const linkedRecords = getLinkedRecordsForTable(field.linkedTableId)
      const selectedRecords = selectedLinkedIds.map((recordId) => getLinkedRecord(recordId)).filter(Boolean) as BaseRecord[]
      const filteredLinkedRecords = linkedRecords.filter((linkedRecord) => {
        if (!normalizedSearchTerm) {
          return true
        }

        return [
          getPickerRecordLabel(linkedRecord),
          getRecordContext(linkedRecord),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearchTerm)
      })
      const safeActiveLinkedOptionIndex = Math.max(0, Math.min(activeLinkedOptionIndex, filteredLinkedRecords.length - 1))

      function commitLinkedRecord(linkedRecordId: string) {
        const nextValue = toggleListValue(selectedLinkedIds, linkedRecordId, field.allowMultiple)

        if (field.allowMultiple === false) {
          onCommitValue(record.id, field.id, nextValue)
          return
        }

        setEditDraft(nextValue)
      }

      return (
        <div className="grid-linked-editor" aria-label={`${field.label} editor`}>
          <div className="grid-linked-editor-head">
            <strong>{getLinkedTableLabel(field.linkedTableId) || 'Connected work'}</strong>
            <small>{selectedLinkedIds.length} selected</small>
          </div>
          <input
            autoFocus
            aria-label={`Search ${field.label}`}
            placeholder="Search items"
            type="search"
            value={searchTerm}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                event.stopPropagation()
                setActiveLinkedOptionIndex((current) => Math.min(current + 1, Math.max(0, filteredLinkedRecords.length - 1)))
                return
              }

              if (event.key === 'ArrowUp') {
                event.preventDefault()
                event.stopPropagation()
                setActiveLinkedOptionIndex((current) => Math.max(0, current - 1))
                return
              }

              if (event.key === 'Enter') {
                const linkedRecord = filteredLinkedRecords[safeActiveLinkedOptionIndex]

                if (linkedRecord) {
                  event.preventDefault()
                  event.stopPropagation()
                  commitLinkedRecord(linkedRecord.id)
                }
              }
            }}
            onChange={(event) =>
              setLinkedRecordFilters((current) => ({
                ...current,
                [searchKey]: event.target.value,
              }))
            }
          />
          {selectedRecords.length > 0 && (
            <div className="grid-linked-selected" aria-label={`Selected ${field.label}`}>
              {selectedRecords.map((selectedRecord) => (
                <button
                  key={selectedRecord.id}
                  type="button"
                  onClick={() => setEditDraft(selectedLinkedIds.filter((recordId) => recordId !== selectedRecord.id))}
                >
                  {getPickerRecordLabel(selectedRecord)}
                  <small>Remove</small>
                </button>
              ))}
            </div>
          )}
          <div className="grid-linked-pills" role="listbox" aria-label={`${field.label} choices`}>
            {filteredLinkedRecords.length === 0 && <small>No items match. Change the search.</small>}
            {filteredLinkedRecords.map((linkedRecord, linkedRecordIndex) => {
              const isSelectedLinkedRecord = selectedLinkedIds.includes(linkedRecord.id)
              const isActiveLinkedRecord = linkedRecordIndex === safeActiveLinkedOptionIndex

              return (
                <button
                  className={`${isSelectedLinkedRecord ? 'selected' : ''} ${isActiveLinkedRecord ? 'active' : ''}`.trim()}
                  aria-label={getRecordTitle(linkedRecord)}
                  aria-selected={isSelectedLinkedRecord}
                  key={linkedRecord.id}
                  role="option"
                  type="button"
                  onClick={() => {
                    commitLinkedRecord(linkedRecord.id)
                  }}
                >
                  <span>{getRecordTitle(linkedRecord)}</span>
                  <small>{getPickerRecordMeta(linkedRecord)}</small>
                </button>
              )
            })}
          </div>
          {field.allowMultiple !== false && <button type="button" onClick={commitGridCellEdit}>Done</button>}
        </div>
      )
    }

    if (field.type === 'longText') {
      return (
        <textarea
          autoFocus
          aria-label={`${field.label} editor`}
          rows={2}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => setEditDraft(event.target.value)}
        />
      )
    }

    const inputType = getGridInputType(field)

    return (
      <input
        autoFocus
        aria-label={`${field.label} editor`}
        type={inputType}
        value={typeof value === 'string' || typeof value === 'number' ? value : ''}
        onChange={(event) => setEditDraft(inputType === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value)}
      />
    )
  }

  if (isEditing) {
    return (
      <div
        className={`grid-cell-editor ${field.type === 'linkedRecord' ? 'linked-cell-editor-shell' : ''}`}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => onEditorKeyDown(record, field, event)}
      >
        {renderGridCellEditor()}
      </div>
    )
  }

  function openCellMenu() {
    if (editingGridCell && !isSameGridCell(editingGridCell, cell)) {
      commitGridCellEdit()
    }

    selectGridCell(record.id, field.id)
    setSelectedBuildRecordId(record.id)
    setIsCellMenuOpen(true)
  }

  return (
    <>
      <button
        aria-label={`${getRecordTitle(record)} ${field.label}`}
        aria-haspopup="menu"
        aria-expanded={isCellMenuOpen}
        className={`grid-cell-button ${isSelected ? 'selected-cell' : ''} ${isReadonly ? 'readonly-cell' : ''}`}
        data-grid-cell={getGridCellKey(cell)}
        data-onboarding-target={onboardingTarget}
        data-testid={`grid-cell-${record.id}-${field.id}`}
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setIsCellMenuOpen(false)
          if (editingGridCell && !isSameGridCell(editingGridCell, cell)) {
            commitGridCellEdit()
          }
          selectGridCell(record.id, field.id)
          setSelectedBuildRecordId(record.id)
          if (field.type === 'checkbox' && !isReadonly) {
            onQuickUpdate(record.id, field.id, !record.values[field.id])
          }
        }}
        onContextMenu={(event) => {
          event.preventDefault()
          event.stopPropagation()
          openCellMenu()
        }}
        onDoubleClick={(event) => {
          event.stopPropagation()
          setIsCellMenuOpen(false)
          startGridCellEdit(record, field)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
            event.preventDefault()
            openCellMenu()
            return
          }

          onSavedKeyDown(record, field, event)
        }}
      >
        {renderSavedGridCell()}
      </button>
      {isCellMenuOpen && (
        <span className="grid-field-menu grid-cell-context-menu" role="menu" aria-label="Cell actions">
          <button
            disabled={isReadonly}
            role="menuitem"
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setIsCellMenuOpen(false)
              startGridCellEdit(record, field)
            }}
          >
            Edit cell
          </button>
          <button
            disabled={isReadonly}
            role="menuitem"
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setIsCellMenuOpen(false)
              onClearValue(record, field)
            }}
          >
            Clear cell
          </button>
        </span>
      )}
    </>
  )
}
