import type { ReactNode } from 'react'
import { timelineViewOptions, type TimelineView } from '../appConfig'
import type { BaseRecord, Workbase } from '../data/workbase'

type TimelineScreenProps = {
  base: Workbase
  renderTimelineView: () => ReactNode
  timelineDatedRecordCount: number
  timelineDependencyRecordCount: number
  timelineFilter: string
  timelineRecords: readonly BaseRecord[]
  timelineRuleReadCount: number
  timelineStatus: string
  timelineStatusOptions: readonly string[]
  timelineTableId: string
  timelineTagRouteOptions: readonly (readonly [string, BaseRecord])[]
  timelineView: TimelineView
  timelineViewQuestion: string
  getChipColorClass: (value: string) => string
  onTimelineFilterChange: (value: string) => void
  onTimelineStatusChange: (value: string) => void
  onTimelineTableChange: (value: string) => void
  onTimelineViewChange: (value: TimelineView) => void
  onWorkflowTagRouteOpen: (record: BaseRecord, tag: string) => void
}

function getTimelineSourceLabel(base: Workbase, timelineTableId: string) {
  if (timelineTableId === 'all') {
    return 'All areas.'
  }

  return `${base.tables.find((table) => table.id === timelineTableId)?.label || timelineTableId}.`
}

const timelineModeCopy: Record<TimelineView, { kicker: string, title: string, lede: string }> = {
  grid: {
    kicker: 'Grid',
    title: 'Clean read.',
    lede: 'Place, item, status, date, blocker, next move.',
  },
  kanban: {
    kicker: 'Kanban',
    title: 'Move stuck work.',
    lede: 'Cards show blocker, place, date, and the next state.',
  },
  calendar: {
    kicker: 'Calendar',
    title: 'Date pressure.',
    lede: 'Deadlines, waiting loops, meetings, and event days in one scan.',
  },
  timeline: {
    kicker: 'Gantt Timeline',
    title: 'Readiness before event day.',
    lede: 'Community rows show what must land before the marker.',
  },
  graph: {
    kicker: 'Graph',
    title: 'Why this place is at risk.',
    lede: 'Connected blockers, risks, and next move stay visible.',
  },
}

export function TimelineScreen({
  base,
  renderTimelineView,
  timelineDatedRecordCount,
  timelineDependencyRecordCount,
  timelineFilter,
  timelineRecords,
  timelineRuleReadCount,
  timelineStatus,
  timelineStatusOptions,
  timelineTableId,
  timelineTagRouteOptions,
  timelineView,
  timelineViewQuestion,
  getChipColorClass,
  onTimelineFilterChange,
  onTimelineStatusChange,
  onTimelineTableChange,
  onTimelineViewChange,
  onWorkflowTagRouteOpen,
}: TimelineScreenProps) {
  const timelineRecordCount = timelineRecords.length
  const timelineSourceLabel = getTimelineSourceLabel(base, timelineTableId)
  const timelineDetailsLabel = `${timelineRecordCount} shown. ${timelineDatedRecordCount} dated. ${timelineDependencyRecordCount} linked.`
  const modeCopy = timelineModeCopy[timelineView]

  return (
    <section className="timeline-screen-layout" data-testid="timeline-screen" id="timeline">
      <article className="screen-panel wide">
        <div className="timeline-deck-header">
          <div className="timeline-deck-title">
            <span className="eyebrow">Timeline · {modeCopy.kicker}</span>
            <h2>{modeCopy.title}</h2>
            <p>{modeCopy.lede}</p>
          </div>
          <span className="metric-pill">{timelineRecordCount} shown</span>
        </div>
        <div className="timeline-question-strip" aria-label="Current timeline question">
          <span>Current question</span>
          <strong>{timelineViewQuestion}</strong>
        </div>
        <div className="view-mode-tabs timeline-view-chips" role="tablist" aria-label="Timeline ways to look">
          {timelineViewOptions.map((option) => (
            <button
              aria-selected={timelineView === option.value}
              className={timelineView === option.value ? 'selected' : ''}
              key={option.value}
              role="tab"
              type="button"
              onClick={() => onTimelineViewChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="timeline-controls-panel">
          <div className="timeline-mode-receipt" aria-label="Timeline details" data-testid="timeline-mode-receipt">
            <article>
              <span>Shown</span>
              <strong>{timelineRecordCount}</strong>
              <small>{timelineSourceLabel}</small>
            </article>
            <article>
              <span>Dated</span>
              <strong>{timelineDatedRecordCount}</strong>
              <small>Items with a usable date.</small>
            </article>
            <article>
              <span>Linked</span>
              <strong>{timelineDependencyRecordCount}</strong>
              <small>Rows with dependencies.</small>
            </article>
            <article>
              <span>Checks</span>
              <strong>{timelineRuleReadCount}</strong>
              <small>Saved checks matched.</small>
            </article>
          </div>
          {timelineTagRouteOptions.length > 0 && (
            <div className="tag-route-strip timeline-tag-route-strip" aria-label="Timeline tag routes">
              <span>Tags</span>
              <div>
                {timelineTagRouteOptions.map(([tag, record]) => (
                  <button
                    className={`select-tag ${getChipColorClass(tag)}`}
                    key={tag}
                    type="button"
                    onClick={() => onWorkflowTagRouteOpen(record, tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid-toolbar timeline-toolbar" aria-label={timelineDetailsLabel}>
            <label>
              <span>Find</span>
              <input
                value={timelineFilter}
                onChange={(event) => onTimelineFilterChange(event.target.value)}
                placeholder="Find items"
              />
            </label>
            <label>
              <span>Area</span>
              <select value={timelineTableId} onChange={(event) => onTimelineTableChange(event.target.value)}>
                <option value="all">All areas</option>
                {base.tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select value={timelineStatus} onChange={(event) => onTimelineStatusChange(event.target.value)}>
                <option value="all">All statuses</option>
                {timelineStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {renderTimelineView()}
      </article>
    </section>
  )
}
