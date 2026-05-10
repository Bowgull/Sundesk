import type { LocalRule } from '../data/rules'
import type { BaseRecord } from '../data/workbase'
import type { RuleMatch } from '../data/views'

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

type ScreenStat = {
  label: string
  value: string | number
  detail: string
}

type TodayScreenProps = {
  followupRecords: readonly BaseRecord[]
  getChipColorClass: (value: string) => string
  getCommandReason: (rule: LocalRule) => string
  getCommandTableLabel: (tableId: string) => string
  getDependencySummary: (recordId: string) => readonly DependencySummaryItem[]
  getRecordContext: (record: BaseRecord) => string
  getRecordTitle: (record: BaseRecord) => string
  getRecordWorkflowTags: (record: BaseRecord) => readonly string[]
  getTodayRuleMatchesForRecord: (recordId: string) => readonly RuleMatch[]
  isCommandSendPreviewOpen: boolean
  nextMeetingLinkedTasks: readonly unknown[]
  nextMeetingRecord: BaseRecord | undefined
  onOpenBuild: () => void
  onOpenDailyRecord: (record: BaseRecord) => void
  onOpenWorkflowTagRoute: (record: BaseRecord, tag: string) => void
  onToggleCommandSendPreview: () => void
  screenStats: readonly ScreenStat[]
  todayChangedRecord: BaseRecord | undefined
  todayChangedRecords: readonly BaseRecord[]
  todayCommandPreview: string
  todayFocusRecord: BaseRecord | undefined
  todayLanes: readonly TodayLane[]
  todayNextLane: TodayLane | undefined
  todayNowLane: TodayLane | undefined
  todayRuleMatches: readonly RuleMatch[]
  todaySlipRecord: BaseRecord | undefined
  todayWaitingLane: TodayLane | undefined
}

export function TodayScreen({
  followupRecords,
  getChipColorClass,
  getCommandReason,
  getCommandTableLabel,
  getDependencySummary,
  getRecordContext,
  getRecordTitle,
  getRecordWorkflowTags,
  getTodayRuleMatchesForRecord,
  isCommandSendPreviewOpen,
  nextMeetingLinkedTasks,
  nextMeetingRecord,
  onOpenBuild,
  onOpenDailyRecord,
  onOpenWorkflowTagRoute,
  onToggleCommandSendPreview,
  screenStats,
  todayChangedRecord,
  todayChangedRecords,
  todayCommandPreview,
  todayFocusRecord,
  todayLanes,
  todayNextLane,
  todayNowLane,
  todayRuleMatches,
  todaySlipRecord,
  todayWaitingLane,
}: TodayScreenProps) {
  const focusRuleMatch = todayFocusRecord ? getTodayRuleMatchesForRecord(todayFocusRecord.id)[0] : undefined
  const focusDependency = todayFocusRecord ? getDependencySummary(todayFocusRecord.id)[0] : undefined

  return (
    <>
      <section className="onboarding-callout today-path-strip" aria-label="Onboarding status">
        <div>
          <span className="eyebrow">Command path</span>
          <strong>Paste rows. Run the work.</strong>
          <p>Build holds the source tables. Today shows what needs a decision.</p>
        </div>
        <button type="button" onClick={onOpenBuild}>Open Build</button>
      </section>

      <header className="hero" id="today">
        <div>
          <span className="eyebrow">Today</span>
          <h1>Start with what can slip.</h1>
          <p>
            Dates, blockers, waiting items, and meeting prep collapse into one working view.
          </p>
        </div>
        <article className="digest-card">
          <span>Command send</span>
          <strong>7:30 AM</strong>
          <p>Recipient and timezone stay visible before anything leaves the browser.</p>
          <button
            aria-controls="today-command-send-preview"
            aria-expanded={isCommandSendPreviewOpen}
            type="button"
            onClick={onToggleCommandSendPreview}
          >
            Preview summary
          </button>
          {isCommandSendPreviewOpen && (
            <div className="command-send-preview" data-testid="today-command-send-preview" id="today-command-send-preview">
              <strong>Command send preview.</strong>
              <pre>{todayCommandPreview}</pre>
            </div>
          )}
        </article>
      </header>

      <section className="today-first-read" aria-label="Today first read" data-testid="today-first-read">
        <article className="primary">
          <span>Now</span>
          <strong>{todayNowLane?.records.length || 0}</strong>
          <small>{todayNowLane?.records[0] ? getRecordTitle(todayNowLane.records[0]) : 'No immediate moves.'}</small>
        </article>
        <article>
          <span>Waiting</span>
          <strong>{todayWaitingLane?.records.length || 0}</strong>
          <small>{todayWaitingLane?.records[0] ? getRecordTitle(todayWaitingLane.records[0]) : 'No open loops.'}</small>
        </article>
        <article>
          <span>Next</span>
          <strong>{todayNextLane?.records.length || 0}</strong>
          <small>{todayNextLane?.records[0] ? getRecordTitle(todayNextLane.records[0]) : 'No next record.'}</small>
        </article>
        <article>
          <span>Changed</span>
          <strong>{todayChangedRecords.length}</strong>
          <small>{todayChangedRecord ? getRecordTitle(todayChangedRecord) : 'No new rule reads.'}</small>
        </article>
        <article>
          <span>Can slip</span>
          <strong>{todaySlipRecord ? getCommandTableLabel(todaySlipRecord.tableId) : 'Clear'}</strong>
          <small>{todaySlipRecord ? getRecordContext(todaySlipRecord) : 'No blocker surfaced.'}</small>
        </article>
      </section>

      {todayFocusRecord && (
        <section className="today-focus-band" aria-label="Today focus" data-testid="today-focus">
          <div>
            <span>Touch first</span>
            <strong>{getRecordTitle(todayFocusRecord)}</strong>
            <small>{getCommandTableLabel(todayFocusRecord.tableId)} · {getRecordContext(todayFocusRecord)}</small>
          </div>
          <div>
            <span>Why this matters</span>
            <strong>{focusRuleMatch ? getCommandReason(focusRuleMatch.rule) : focusDependency?.label || 'Highest visible lane.'}</strong>
            <small>{focusDependency ? `${focusDependency.label}: ${focusDependency.title}` : 'No dependency receipt on this row.'}</small>
          </div>
          <div>
            <span>Opens next</span>
            <strong>Record detail.</strong>
            <small>Review fields, linked records, and the Build route from one place.</small>
          </div>
          <button type="button" onClick={() => onOpenDailyRecord(todayFocusRecord)}>Open focus</button>
        </section>
      )}

      <details className="today-counts-disclosure" aria-label="Command summary" data-testid="today-counts">
        <summary>Show count summary</summary>
        <section className="today-command-strip">
          <article>
            <span>Slipping</span>
            <strong>{todayNowLane?.records.length || 0}</strong>
            <small>Blocked or at-risk rows.</small>
          </article>
          <article>
            <span>Waiting</span>
            <strong>{followupRecords.length}</strong>
            <small>People who owe the next move.</small>
          </article>
          <article>
            <span>Meeting</span>
            <strong>{nextMeetingLinkedTasks.length}</strong>
            <small>Linked rows for the next agenda.</small>
          </article>
        </section>
      </details>

      <section className="today-lane-grid" aria-label="Today lanes" data-testid="today-lanes">
        {todayLanes.map((lane) => (
          <article className={`today-lane ${lane.id}`} data-testid={`today-lane-${lane.id}`} key={lane.id}>
            <div className="lane-head">
              <span>{lane.label}</span>
              <strong>{lane.records.length}</strong>
            </div>
            <h2>{lane.title}</h2>
            <p className="lane-intent">Open the row that should move next. Tags route straight into Build.</p>
            <ol>
              {lane.records.map((record) => {
                const recordTitle = getRecordTitle(record)
                const workflowTags = getRecordWorkflowTags(record)
                const ruleMatches = getTodayRuleMatchesForRecord(record.id)
                const firstRuleMatch = ruleMatches[0]
                const dependencies = getDependencySummary(record.id)
                const nextOpen = workflowTags[0] ? `Build filtered to ${workflowTags[0]}.` : `${getCommandTableLabel(record.tableId)} record.`

                return (
                  <li key={record.id}>
                    <button className="lane-record-link" type="button" onClick={() => onOpenDailyRecord(record)}>
                      <strong>{recordTitle}</strong>
                    </button>
                    <span>{getRecordContext(record)}</span>
                    <div className="lane-next-step">
                      <span>Opens next</span>
                      <small>{nextOpen}</small>
                    </div>
                    {workflowTags.length > 0 && (
                      <div className="workflow-tag-route-list" aria-label={`${recordTitle} workflow tags`}>
                        {workflowTags.map((tag) => (
                          <button
                            className={`select-tag ${getChipColorClass(tag)}`}
                            key={tag}
                            type="button"
                            onClick={() => onOpenWorkflowTagRoute(record, tag)}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                    {firstRuleMatch && (
                      <div className="lane-rule-list">
                        <details>
                          <summary>Rule receipt</summary>
                          {ruleMatches.map((match) => (
                            <small key={match.rule.id}>{getCommandReason(match.rule)}</small>
                          ))}
                        </details>
                      </div>
                    )}
                    {dependencies.length > 0 && (
                      <div className="lane-dependency-list">
                        {dependencies.slice(0, 2).map((dependency) => (
                          <small key={dependency.id}>{dependency.label}: {dependency.title}</small>
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </article>
        ))}
      </section>

      <section className="command-grid">
        <article className="queue-panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">What changed</span>
              <h2>System read.</h2>
            </div>
            <span className="metric-pill">{todayRuleMatches.length} reads</span>
          </div>
          <p className="panel-lede">The first read stays plain. Open the receipts only when you need to see why a row landed here.</p>

          <details className="command-details">
            <summary>Show why items surfaced</summary>
            <div className="priority-list" data-testid="today-rule-receipts">
              {todayRuleMatches.slice(0, 4).map((match, index) => (
                <article className="priority-card prep" key={`${match.rule.id}-${match.record.id}`}>
                  <div className="priority-rank">{index + 1}</div>
                  <div className="priority-main">
                    <div className="priority-top">
                      <strong>{getRecordTitle(match.record)}</strong>
                      <span className="pill prep">{getCommandTableLabel(match.record.tableId)}</span>
                    </div>
                    <p>{getCommandReason(match.rule)}</p>
                    <div className="reason-chain">
                      <span>Rule matched</span>
                      <span><i aria-hidden="true" />Destination: Today</span>
                      <span><i aria-hidden="true" />No send happened</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => onOpenDailyRecord(match.record)}>Open</button>
                </article>
              ))}
              {todayRuleMatches.length === 0 && <p className="empty-note">No Today rules match. Open Build to adjust rules.</p>}
            </div>
            <button className="ghost" type="button" onClick={onOpenBuild}>Open Build</button>
          </details>
        </article>

        <aside className="focus-stack">
          <article className="insight-card">
            <span>System read</span>
            <strong>Toronto moved to blocked.</strong>
            <p>Fire marshal permit still missing. Event is 7 days out.</p>
          </article>

          <article className="next-meeting" id="meetings">
            <span className="eyebrow">Next meeting</span>
            <strong>Charlottetown. Tomorrow.</strong>
            <p>Agenda can be generated from 2 work items, 1 risk, and 1 waiting item.</p>
            <button disabled={!nextMeetingRecord} type="button" onClick={() => nextMeetingRecord && onOpenDailyRecord(nextMeetingRecord)}>
              Open next meeting
            </button>
          </article>
        </aside>
      </section>

      <section className="data-summary-grid" aria-label="Workbase status">
        {screenStats.map((stat) => (
          <article key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.detail}</small>
          </article>
        ))}
      </section>
    </>
  )
}
