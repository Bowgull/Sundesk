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

type BuildPasteHelperProps = {
  buildPasteReceipt: string
  buildPasteSummary: BuildPasteSummary | null
  applyPasteAction: (action: BuildPasteAction) => void
}

function getPasteExplanation(buildPasteSummary: BuildPasteSummary) {
  const skippedCopy = buildPasteSummary.skippedColumns.length > 0
    ? `Skipped: ${buildPasteSummary.skippedColumns.join(', ')}.`
    : ''

  if (buildPasteSummary.suggestions.length > 0) {
    return [buildPasteSummary.suggestions.slice(0, 2).join(' '), skippedCopy].filter(Boolean).join(' ')
  }

  if (buildPasteSummary.skippedColumns.length > 0) {
    return skippedCopy
  }

  return 'Check column behavior, connections, and tags.'
}

function getPasteReceipt(buildPasteReceipt: string, buildPasteSummary: BuildPasteSummary) {
  const rowChangeCopy = `${buildPasteSummary.created} new. ${buildPasteSummary.updated} updated.`

  return buildPasteReceipt ? `${buildPasteReceipt} ${rowChangeCopy}` : rowChangeCopy
}

export function BuildPasteHelper({
  applyPasteAction,
  buildPasteReceipt,
  buildPasteSummary,
}: BuildPasteHelperProps) {
  if (!buildPasteSummary) {
    return null
  }

  return (
    <div className="paste-result-grid" aria-label="Post-paste helpers">
      <article>
        <span>Paste</span>
        <strong>{getPasteReceipt(buildPasteReceipt, buildPasteSummary)}</strong>
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
  )
}
