import { useState } from 'react'
import type { PointerEvent } from 'react'
import type { FieldDefinition, FieldType } from '../data/workbase'

type GridSortDirection = 'asc' | 'desc'

type FieldTypeOption = {
  label: string
  value: FieldType
}

type BuildGridHeaderProps = {
  field: FieldDefinition
  fieldTypeOptions: readonly FieldTypeOption[]
  menuKey: string
  isPrimaryField: boolean
  optionFieldTypes: readonly FieldType[]
  openFieldMenuId: string
  onOpenFieldMenuIdChange: (menuId: string) => void
  onToggleVisibleField: (fieldId: string) => void
  onSortGridByField: (fieldId: string, direction: GridSortDirection) => void
  onGroupGridByField: (fieldId: string) => void
  onDuplicateField: (field: FieldDefinition) => void
  onRequestDeleteField: (field: FieldDefinition) => void
  onResizeColumn: (fieldId: string, event: PointerEvent<HTMLButtonElement>) => void
  onUpdateField: (fieldId: string, updates: Partial<FieldDefinition>) => void
  parseOptions: (value: string) => string[]
}

export function BuildGridHeader({
  field,
  fieldTypeOptions,
  menuKey,
  isPrimaryField,
  optionFieldTypes,
  openFieldMenuId,
  onOpenFieldMenuIdChange,
  onToggleVisibleField,
  onSortGridByField,
  onGroupGridByField,
  onDuplicateField,
  onRequestDeleteField,
  onResizeColumn,
  onUpdateField,
  parseOptions,
}: BuildGridHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const menuId = `grid-field-menu-${field.tableId}-${field.id}-${menuKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`
  const optionText = (field.options || []).join(', ')

  function openSettings() {
    setIsSettingsOpen(true)
  }

  return (
    <div className="grid-header-cell">
      <button
        aria-controls={openFieldMenuId === menuKey ? menuId : undefined}
        aria-expanded={openFieldMenuId === menuKey}
        aria-haspopup="menu"
        className="grid-field-menu-trigger"
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setIsSettingsOpen(false)
          onOpenFieldMenuIdChange(openFieldMenuId === menuKey ? '' : menuKey)
        }}
      >
        <span>{field.label}</span>
        {isPrimaryField && <small>Name column</small>}
        <strong>⌄</strong>
      </button>
      {openFieldMenuId === menuKey && (
        <div className="grid-field-menu" id={menuId} role="menu" aria-label={`${field.label} column actions`}>
          {isSettingsOpen ? (
            <form
              className="column-settings-menu"
              data-testid="build-column-settings-menu"
              aria-label="Column settings"
              onSubmit={(event) => {
                event.preventDefault()
                setIsSettingsOpen(false)
                onOpenFieldMenuIdChange('')
              }}
            >
              <label>
                <span>Column name</span>
                <input
                  aria-label="Column name"
                  value={field.label}
                  onChange={(event) => onUpdateField(field.id, { label: event.target.value })}
                />
              </label>
              <label>
                <span>Type</span>
                <select
                  aria-label="Type"
                  value={field.type}
                  onChange={(event) => onUpdateField(field.id, { type: event.target.value as FieldType })}
                >
                  {fieldTypeOptions.map((fieldType) => (
                    <option key={fieldType.value} value={fieldType.value}>
                      {fieldType.label}
                    </option>
                  ))}
                </select>
              </label>
              {optionFieldTypes.includes(field.type) && (
                <label>
                  <span>Options</span>
                  <textarea
                    aria-label="Options"
                    rows={2}
                    value={optionText}
                    onChange={(event) => onUpdateField(field.id, { options: parseOptions(event.target.value) })}
                  />
                </label>
              )}
              <div className="add-field-menu-actions">
                <button type="button" onClick={() => setIsSettingsOpen(false)}>Back</button>
                <button className="primary" type="submit">Done</button>
              </div>
            </form>
          ) : (
            <>
              <button role="menuitem" type="button" onClick={openSettings}>Edit column</button>
              <button role="menuitem" type="button" onClick={openSettings}>Rename</button>
              <button role="menuitem" type="button" onClick={openSettings}>Change behavior</button>
              <button role="menuitem" type="button" onClick={() => onToggleVisibleField(field.id)}>Hide from scan</button>
              <button role="menuitem" type="button" onClick={() => onSortGridByField(field.id, 'asc')}>Sort ascending</button>
              <button role="menuitem" type="button" onClick={() => onSortGridByField(field.id, 'desc')}>Sort descending</button>
              <button role="menuitem" type="button" onClick={() => onGroupGridByField(field.id)}>Group by this column</button>
              <button role="menuitem" type="button" onClick={() => onDuplicateField(field)}>Duplicate column</button>
              <button
                className="danger menu-danger"
                disabled={isPrimaryField}
                role="menuitem"
                type="button"
                onClick={() => onRequestDeleteField(field)}
              >
                Delete column
              </button>
            </>
          )}
        </div>
      )}
      <button
        aria-label={`Resize ${field.label}`}
        className="column-resizer"
        type="button"
        onPointerDown={(event) => onResizeColumn(field.id, event)}
      />
    </div>
  )
}
