import type { LocalGridView } from '../data/localStorage'
import type { TableDefinition } from '../data/workbase'

type BuildViewsPanelProps = {
  activeGridViewChanged: boolean
  activeGridViewId: string
  localGridViews: readonly LocalGridView[]
  pinnedGridViewCount: number
  tables: readonly TableDefinition[]
  viewRenameDrafts: Record<string, string>
  onApplyGridView: (view: LocalGridView) => void
  onDeleteGridView: (viewId: string) => void
  onDuplicateGridView: (view: LocalGridView) => void
  onRenameDraftChange: (viewId: string, value: string) => void
  onRenameGridView: (viewId: string) => void
  onResetActiveGridView: () => void
  onTogglePinnedGridView: (viewId: string) => void
  onUpdateGridView: (viewId: string) => void
}

export function BuildViewsPanel({
  activeGridViewChanged,
  activeGridViewId,
  localGridViews,
  pinnedGridViewCount,
  tables,
  viewRenameDrafts,
  onApplyGridView,
  onDeleteGridView,
  onDuplicateGridView,
  onRenameDraftChange,
  onRenameGridView,
  onResetActiveGridView,
  onTogglePinnedGridView,
  onUpdateGridView,
}: BuildViewsPanelProps) {
  function getTableLabel(tableId: string) {
    return tables.find((table) => table.id === tableId)?.label || tableId
  }

  return (
    <article className="automation-panel build-sidecar" data-testid="build-views-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Saved scans</span>
          <h2>Saved ways to work.</h2>
        </div>
        <span className="metric-pill">{pinnedGridViewCount} pinned</span>
      </div>
      <p className="panel-copy">Saved scans keep the area, sort, filters, and pinning.</p>
      {localGridViews.length > 0 ? (
        <div className="view-list">
          {localGridViews.map((view) => (
            <article className={`local-view-row ${view.id === activeGridViewId ? 'active-row' : ''}`} data-testid="local-view-row" key={view.id}>
              <div className="view-row-top">
                <span>{getTableLabel(view.tableId)}</span>
                {view.pinned ? (
                  <strong>Pinned</strong>
                ) : view.id === activeGridViewId && (
                  <strong>{activeGridViewChanged ? 'Changed' : 'Active'}</strong>
                )}
              </div>
              <label>
                <span>Scan name</span>
                <input
                  value={viewRenameDrafts[view.id] ?? view.name}
                  onChange={(event) => onRenameDraftChange(view.id, event.target.value)}
                />
              </label>
              <p>
                Filter: {view.filter || 'none'}. Sort: {view.sortFieldId || 'manual'} {view.sortDirection || 'asc'}. Group: {view.groupFieldId || 'none'}.
              </p>
              <div className="view-actions">
                <button type="button" onClick={() => onApplyGridView(view)}>Apply</button>
                <button type="button" onClick={() => onUpdateGridView(view.id)}>Update</button>
                <button type="button" onClick={() => onDuplicateGridView(view)}>Copy</button>
                <button type="button" onClick={() => onTogglePinnedGridView(view.id)}>{view.pinned ? 'Unpin' : 'Pin'}</button>
                {view.id === activeGridViewId && activeGridViewChanged && (
                  <button type="button" onClick={onResetActiveGridView}>Reset</button>
                )}
                <button type="button" onClick={() => onRenameGridView(view.id)}>Rename</button>
                <button className="danger" type="button" onClick={() => onDeleteGridView(view.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="panel-copy">Saved scans appear after she saves one.</p>
      )}
    </article>
  )
}
