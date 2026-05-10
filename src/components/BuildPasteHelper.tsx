import type { FieldDefinition } from '../data/workbase'

type BuildPasteAction = {
  fieldId: string
  label: string
  updates: Partial<FieldDefinition>
  migrateValues?: boolean
}

type BuildPasteSummary = {
  created: number
  updated: number
  columns: readonly string[]
  skippedColumns: readonly string[]
  suggestions: readonly string[]
  actions: readonly BuildPasteAction[]
}

type GridCell = {
  fieldId: string
  recordId: string
}

type VisibleField = {
  id: string
  label: string
}

type BuildPasteHelperProps = {
  buildPasteReceipt: string
  buildPasteCellCount: number
  selectedGridCell: GridCell | null
  visibleFieldsForGrid: readonly VisibleField[]
  buildPasteSummary: BuildPasteSummary | null
  applyPasteAction: (action: BuildPasteAction) => void
}

function getSelectedFieldLabel(selectedGridCell: GridCell | null, visibleFieldsForGrid: readonly VisibleField[]) {
  if (!selectedGridCell) {
    return null
  }

  return visibleFieldsForGrid.find((field) => field.id === selectedGridCell.fieldId)?.label || 'field'
}

function getPasteExplanation(buildPasteSummary: BuildPasteSummary) {
  if (buildPasteSummary.suggestions.length > 0) {
    return buildPasteSummary.suggestions.slice(0, 2).join(' ')
  }

  if (buildPasteSummary.skippedColumns.length > 0) {
    return `Computed fields skipped: ${buildPasteSummary.skippedColumns.join(', ')}.`
  }

  return 'Check field types, links, and tags.'
}

export function BuildPasteHelper({
  applyPasteAction,
  buildPasteCellCount,
  buildPasteReceipt,
  buildPasteSummary,
  selectedGridCell,
  visibleFieldsForGrid,
}: BuildPasteHelperProps) {
  const selectedFieldLabel = getSelectedFieldLabel(selectedGridCell, visibleFieldsForGrid)

  return (
    <>
      <div className="local-state-strip build-helper-strip">
        <span>{buildPasteReceipt ? 'Paste received' : 'Paste first'}</span>
        <strong>{buildPasteReceipt || 'Click a cell. Paste rows. Shape fields after.'}</strong>
        <div className="paste-helper-steps" aria-label="Paste helper state">
          <small className={selectedGridCell ? 'done' : ''}>
            {selectedFieldLabel ? `Target: ${selectedFieldLabel}` : 'Choose cell'}
          </small>
          <small className={buildPasteReceipt ? 'done' : ''}>{buildPasteReceipt ? `${buildPasteCellCount} cells` : 'Paste rows'}</small>
          <small>Explain after</small>
        </div>
      </div>
      {buildPasteSummary && (
        <div className="paste-result-grid" aria-label="Post-paste helpers">
          <article>
            <span>Rows</span>
            <strong>
              {buildPasteSummary.created} new. {buildPasteSummary.updated} updated.
            </strong>
          </article>
          <article>
            <span>Columns</span>
            <strong>{buildPasteSummary.columns.length > 0 ? buildPasteSummary.columns.join(', ') : 'No editable columns touched.'}</strong>
          </article>
          <article>
            <span>Explain</span>
            <strong>{getPasteExplanation(buildPasteSummary)}</strong>
            {buildPasteSummary.actions.length > 0 && (
              <div className="paste-action-row" aria-label="Paste apply controls">
                {buildPasteSummary.actions.slice(0, 2).map((action) => (
                  <button
                    key={`${action.fieldId}-${action.label}`}
                    type="button"
                    onClick={() => applyPasteAction(action)}
                  >
                    Use {action.label}
                  </button>
                ))}
              </div>
            )}
          </article>
        </div>
      )}
    </>
  )
}
