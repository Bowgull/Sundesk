import type { PointerEvent } from 'react'
import type { FieldDefinition } from '../data/workbase'

type GridSortDirection = 'asc' | 'desc'

type BuildGridHeaderProps = {
  field: FieldDefinition
  menuKey: string
  isPrimaryField: boolean
  openFieldMenuId: string
  onOpenFieldMenuIdChange: (menuId: string) => void
  onOpenFieldSettings: (field: FieldDefinition) => void
  onToggleVisibleField: (fieldId: string) => void
  onSortGridByField: (fieldId: string, direction: GridSortDirection) => void
  onGroupGridByField: (fieldId: string) => void
  onDuplicateField: (field: FieldDefinition) => void
  onRequestDeleteField: (field: FieldDefinition) => void
  onResizeColumn: (fieldId: string, event: PointerEvent<HTMLButtonElement>) => void
}

export function BuildGridHeader({
  field,
  menuKey,
  isPrimaryField,
  openFieldMenuId,
  onOpenFieldMenuIdChange,
  onOpenFieldSettings,
  onToggleVisibleField,
  onSortGridByField,
  onGroupGridByField,
  onDuplicateField,
  onRequestDeleteField,
  onResizeColumn,
}: BuildGridHeaderProps) {
  const menuId = `grid-field-menu-${field.tableId}-${field.id}-${menuKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`

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
          onOpenFieldMenuIdChange(openFieldMenuId === menuKey ? '' : menuKey)
        }}
      >
        <span>{field.label}</span>
        {isPrimaryField && <small>Name field</small>}
        <strong>⌄</strong>
      </button>
      {openFieldMenuId === menuKey && (
        <div className="grid-field-menu" id={menuId} role="menu" aria-label={`${field.label} field actions`}>
          <button role="menuitem" type="button" onClick={() => onOpenFieldSettings(field)}>Edit field</button>
          <button role="menuitem" type="button" onClick={() => onOpenFieldSettings(field)}>Rename</button>
          <button role="menuitem" type="button" onClick={() => onOpenFieldSettings(field)}>Change type</button>
          <button role="menuitem" type="button" onClick={() => onToggleVisibleField(field.id)}>Hide from view</button>
          <button role="menuitem" type="button" onClick={() => onSortGridByField(field.id, 'asc')}>Sort ascending</button>
          <button role="menuitem" type="button" onClick={() => onSortGridByField(field.id, 'desc')}>Sort descending</button>
          <button role="menuitem" type="button" onClick={() => onGroupGridByField(field.id)}>Group by this field</button>
          <button role="menuitem" type="button" onClick={() => onDuplicateField(field)}>Duplicate field</button>
          <button
            className="danger menu-danger"
            disabled={isPrimaryField}
            role="menuitem"
            type="button"
            onClick={() => onRequestDeleteField(field)}
          >
            Delete field
          </button>
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
