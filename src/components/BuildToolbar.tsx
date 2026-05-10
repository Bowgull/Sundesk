import type { LocalGridView } from '../data/localStorage'
import type { FieldDefinition } from '../data/workbase'

type GridSortDirection = 'asc' | 'desc'
type GridDensity = 'compact' | 'comfortable' | 'expanded'

type BuildToolbarProps = {
  activeGridViewId: string
  fieldsForSelectedTable: readonly FieldDefinition[]
  gridColorFieldId: string
  gridDensity: GridDensity
  gridFilter: string
  gridGroupFieldId: string
  gridSortDirection: GridSortDirection
  gridSortFieldId: string
  localGridViews: readonly LocalGridView[]
  visibleFieldCount: number
  visibleFieldIds: readonly string[]
  onAddField: () => void
  onApplyGridView: (view: LocalGridView) => void
  onClearActiveGridView: () => void
  onExportCsv: () => void
  onGridColorFieldChange: (fieldId: string) => void
  onGridDensityChange: (density: GridDensity) => void
  onGridFilterChange: (filter: string) => void
  onGridGroupFieldChange: (fieldId: string) => void
  onGridSortDirectionChange: (direction: GridSortDirection) => void
  onGridSortFieldChange: (fieldId: string) => void
  onToggleVisibleField: (fieldId: string) => void
}

export function BuildToolbar({
  activeGridViewId,
  fieldsForSelectedTable,
  gridColorFieldId,
  gridDensity,
  gridFilter,
  gridGroupFieldId,
  gridSortDirection,
  gridSortFieldId,
  localGridViews,
  visibleFieldCount,
  visibleFieldIds,
  onAddField,
  onApplyGridView,
  onClearActiveGridView,
  onExportCsv,
  onGridColorFieldChange,
  onGridDensityChange,
  onGridFilterChange,
  onGridGroupFieldChange,
  onGridSortDirectionChange,
  onGridSortFieldChange,
  onToggleVisibleField,
}: BuildToolbarProps) {
  function applySelectedGridView(viewId: string) {
    const view = localGridViews.find((gridView) => gridView.id === viewId)

    if (view) {
      onApplyGridView(view)
    } else {
      onClearActiveGridView()
    }
  }

  function renderFieldOptions() {
    return fieldsForSelectedTable.map((field) => (
      <option key={field.id} value={field.id}>
        {field.label}
      </option>
    ))
  }

  return (
    <>
      <div className="grid-toolbar build-toolbar">
        <label>
          <span>View</span>
          <select value={activeGridViewId} onChange={(event) => applySelectedGridView(event.target.value)}>
            <option value="">Current view</option>
            {localGridViews.map((view) => (
              <option key={view.id} value={view.id}>
                {view.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Filter</span>
          <input
            value={gridFilter}
            onChange={(event) => onGridFilterChange(event.target.value)}
            placeholder="Find in visible table"
          />
        </label>
        <button className="toolbar-export-button" type="button" onClick={onExportCsv}>
          Export CSV
        </button>
        <details className="grid-shape-controls">
          <summary>Shape grid</summary>
          <div>
            <label>
              <span>Fields</span>
              <button className="toolbar-field-count" type="button" onClick={onAddField}>
                {visibleFieldCount} shown
              </button>
            </label>
            <label>
              <span>Sort</span>
              <select
                value={gridSortFieldId}
                onChange={(event) => {
                  onGridSortFieldChange(event.target.value)
                  onGridSortDirectionChange('asc')
                }}
              >
                <option value="">Manual</option>
                {renderFieldOptions()}
              </select>
            </label>
            <label>
              <span>Direction</span>
              <select
                value={gridSortDirection}
                onChange={(event) => onGridSortDirectionChange(event.target.value as GridSortDirection)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>
            <label>
              <span>Group</span>
              <select value={gridGroupFieldId} onChange={(event) => onGridGroupFieldChange(event.target.value)}>
                <option value="">None</option>
                {renderFieldOptions()}
              </select>
            </label>
            <label>
              <span>Colour</span>
              <select value={gridColorFieldId} onChange={(event) => onGridColorFieldChange(event.target.value)}>
                <option value="">None</option>
                {renderFieldOptions()}
              </select>
            </label>
            <label>
              <span>Density</span>
              <select value={gridDensity} onChange={(event) => onGridDensityChange(event.target.value as GridDensity)}>
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="expanded">Expanded</option>
              </select>
            </label>
          </div>
        </details>
      </div>
      <div className="view-bar">
        <div className="visible-field-list">
          {fieldsForSelectedTable.map((field) => (
            <button
              className={visibleFieldIds.includes(field.id) ? 'selected' : ''}
              key={field.id}
              type="button"
              onClick={() => onToggleVisibleField(field.id)}
            >
              {field.label}
            </button>
          ))}
        </div>
        <div className="view-actions">
          {localGridViews.map((view) => (
            <button
              className={view.id === activeGridViewId ? 'selected' : ''}
              key={view.id}
              type="button"
              onClick={() => onApplyGridView(view)}
            >
              {view.name}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
