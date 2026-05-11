import type { LocalRule } from '../data/rules'
import type { BaseRecord } from '../data/workbase'
import type { RuleMatch } from '../data/views'
import { getCopyModeText } from '../data/copyMode'

type TodayLane = {
  id: string
  label: string
  title: string
  records: readonly BaseRecord[]
}

type DependencySummaryItem = {
  id: string
  label: string
  title: string
}

type TodayScreenProps = {
  getCommandReason: (rule: LocalRule) => string
  getCommandTableLabel: (tableId: string) => string
  getDependencySummary: (recordId: string) => readonly DependencySummaryItem[]
  getRecordContext: (record: BaseRecord) => string
  getRecordTitle: (record: BaseRecord) => string
  getRecordWorkflowTags: (record: BaseRecord) => readonly string[]
  getTodayRuleMatchesForRecord: (recordId: string) => readonly RuleMatch[]
  isCommandSendPreviewOpen: boolean
  onOpenDailyRecord: (record: BaseRecord) => void
  onToggleCommandSendPreview: () => void
  rupaulMode: boolean
  todayCommandPreview: string
  todayFocusRecord: BaseRecord | undefined
  todayLanes: readonly TodayLane[]
  todayRuleMatches: readonly RuleMatch[]
}

export function TodayScreen({
  getCommandReason,
  getCommandTableLabel,
  getDependencySummary,
  getRecordContext,
  getRecordTitle,
  getRecordWorkflowTags,
  getTodayRuleMatchesForRecord,
  isCommandSendPreviewOpen,
  onOpenDailyRecord,
  onToggleCommandSendPreview,
  rupaulMode,
  todayCommandPreview,
  todayFocusRecord,
  todayLanes,
  todayRuleMatches,
}: TodayScreenProps) {
  const focusRuleMatch = todayFocusRecord ? getTodayRuleMatchesForRecord(todayFocusRecord.id)[0] : undefined
  const focusDependency = todayFocusRecord ? getDependencySummary(todayFocusRecord.id)[0] : undefined
  const focusDestination = todayFocusRecord ? getNextOpenLabel(todayFocusRecord) : ''
  const focusReason = focusRuleMatch
    ? getCommandReason(focusRuleMatch.rule)
    : focusDependency
      ? `${focusDependency.label}: ${focusDependency.title}`
      : 'Highest visible lane.'

  function getPrimaryReason(record: BaseRecord) {
    const ruleMatch = getTodayRuleMatchesForRecord(record.id)[0]

    if (ruleMatch) {
      return getCommandReason(ruleMatch.rule)
    }

    const dependency = getDependencySummary(record.id)[0]

    if (dependency) {
      return `${dependency.label}: ${dependency.title}`
    }

    return 'Closest item in this lane.'
  }

  function getNextOpenLabel(record: BaseRecord) {
    const workflowTag = getRecordWorkflowTags(record)[0]

    if (workflowTag) {
      return `Open in Build on ${workflowTag}.`
    }

    return `Open ${getCommandTableLabel(record.tableId)} record.`
  }

  return (
    <>
      <section className="today-brief" aria-label="Today brief" data-testid="today-brief" id="today">
        <div className="today-brief-copy">
          <span>Today</span>
          <h1>What can slip.</h1>
          <p>What is waiting. What moves next.</p>
        </div>

        {todayFocusRecord && (
          <article className="today-focus-card" aria-label="Today focus" data-testid="today-focus">
            <span>Touch first</span>
            <strong>{getRecordTitle(todayFocusRecord)}</strong>
            <small>{getCommandTableLabel(todayFocusRecord.tableId)} · {getRecordContext(todayFocusRecord)}</small>
            <div className="today-focus-reason">
              <span>Why</span>
              <p>{focusReason}</p>
            </div>
            <div className="today-focus-next">
              <span>Opens next</span>
              <p>{focusDestination}</p>
            </div>
            <button type="button" onClick={() => onOpenDailyRecord(todayFocusRecord)}>Open</button>
          </article>
        )}
      </section>

      <section className="today-lane-grid" aria-label="Today lanes" data-testid="today-lanes">
        {todayLanes.map((lane) => (
          <article className={`today-lane ${lane.id}`} data-testid={`today-lane-${lane.id}`} key={lane.id}>
            <div className="lane-head">
              <span>{lane.label}</span>
              <strong>{lane.records.length}</strong>
            </div>
            <h2>{getLaneTitle(lane)}</h2>
            <p className="lane-intent">{getLaneIntent(lane)}</p>
            <ol>
              {lane.records.map((record) => {
                const recordTitle = getRecordTitle(record)

                return (
                  <li key={record.id}>
                    <div className="lane-record-top">
                      <div>
                        <strong>{recordTitle}</strong>
                        <span>{getCommandTableLabel(record.tableId)} · {getRecordContext(record)}</span>
                      </div>
                      <button type="button" onClick={() => onOpenDailyRecord(record)}>Open</button>
                    </div>
                    <p>{getPrimaryReason(record)}</p>
                    <small>{getNextOpenLabel(record)}</small>
                  </li>
                )
              })}
            </ol>
          </article>
        ))}
      </section>

      <section className="today-command-panel" aria-label="Command send">
        <div>
          <span>Command send</span>
          <strong>7:30 AM</strong>
          <p>Local preview only. Recipient and timezone stay visible before anything leaves the browser.</p>
        </div>
        <button
          aria-controls="today-command-send-preview"
          aria-expanded={isCommandSendPreviewOpen}
          aria-label="Preview summary"
          data-copy-plain="Preview summary"
          title="Preview summary"
          type="button"
          onClick={onToggleCommandSendPreview}
        >
          {getCopyModeText('button.previewSummary', rupaulMode)}
        </button>
        {isCommandSendPreviewOpen && (
          <div className="command-send-preview" data-testid="today-command-send-preview" id="today-command-send-preview">
            <strong>Preview.</strong>
            <pre>{todayCommandPreview}</pre>
          </div>
        )}
      </section>

      <details className="today-receipts" data-testid="today-rule-receipts">
        <summary>Show why items surfaced</summary>
        <div>
          {todayRuleMatches.slice(0, 4).map((match) => (
            <article key={`${match.rule.id}-${match.record.id}`}>
              <strong>{getRecordTitle(match.record)}</strong>
              <span>{getCommandTableLabel(match.record.tableId)}</span>
              <p>{getCommandReason(match.rule)}</p>
              <button type="button" onClick={() => onOpenDailyRecord(match.record)}>Open</button>
            </article>
          ))}
          {todayRuleMatches.length === 0 && <p className="empty-note">No Today checks match. Open Build to adjust checks.</p>}
        </div>
      </details>
    </>
  )
}

function getLaneTitle(lane: TodayLane) {
  if (lane.id === 'now') {
    return 'Can slip today.'
  }

  if (lane.id === 'waiting') {
    return 'Waiting on someone else.'
  }

  return 'Move next.'
}

function getLaneIntent(lane: TodayLane) {
  if (lane.id === 'now') {
    return 'Blocked, due, or at risk.'
  }

  if (lane.id === 'waiting') {
    return 'Open loops with an owner outside the screen.'
  }

  return 'Work to pull forward before it gets loud.'
}
