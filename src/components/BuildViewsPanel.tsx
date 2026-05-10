import type { SavedView } from '../data/demoData'
import type { LocalGridView } from '../data/localStorage'
import type { TableDefinition } from '../data/workbase'

type BuildViewsPanelProps = {
  activeGridViewChanged: boolean
  activeGridViewId: string
  localGridViews: readonly LocalGridView[]
  pinnedGridViewCount: number
  savedViews: readonly SavedView[]
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
  savedViews,
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
          <span className="eyebrow">Views</span>
          <h2>Saved ways to work.</h2>
        </div>
        <span className="metric-pill">{pinnedGridViewCount} pinned</span>
      </div>
      <p className="panel-copy">Saved views keep table context and can be pinned to the sidebar.</p>
      {localGridViews.length > 0 && (
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
                <span>View name</span>
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
      )}
      <div className="view-list">
        {savedViews.map((view) => (
          <article key={view.id}>
            <span>{view.type}</span>
            <strong>{view.name}</strong>
            <p>{view.rule}</p>
          </article>
        ))}
      </div>
    </article>
  )
}
