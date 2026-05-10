import type { ReactNode } from 'react'
import { timelineViewOptions, type TimelineView } from '../appConfig'
import type { BaseRecord, Workbase } from '../data/workbase'
import { getRecordContext, getRecordTitle } from '../data/workbase'

type TimelineScreenProps = {
  base: Workbase
  dailyTimelineRecords: readonly BaseRecord[]
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

type TimelineViewHelper = {
  readonly label: string
  readonly description: string
  readonly value: TimelineView
}

const timelineViewHelpers: readonly TimelineViewHelper[] = [
  { value: 'grid', label: 'Grid', description: 'Clean or edit rows.' },
  { value: 'kanban', label: 'Kanban', description: 'Move work by state.' },
  { value: 'calendar', label: 'Calendar', description: 'See date pressure.' },
  { value: 'timeline', label: 'Timeline', description: 'Read readiness before event day.' },
  { value: 'graph', label: 'Graph', description: 'Explain why a place is at risk.' },
]

function getTimelineSourceLabel(base: Workbase, timelineTableId: string) {
  if (timelineTableId === 'all') {
    return 'All source tables.'
  }

  return `${base.tables.find((table) => table.id === timelineTableId)?.label || timelineTableId}.`
}

export function TimelineScreen({
  base,
  dailyTimelineRecords,
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
  const timelineViewLabel = timelineViewOptions.find((option) => option.value === timelineView)?.label

  return (
    <section className="screen-grid" data-testid="timeline-screen" id="timeline">
      <article className="screen-panel wide">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Views · Timeline</span>
            <h2>Timeline has 5 ways to look.</h2>
          </div>
          <span className="metric-pill">{timelineRecordCount} shown</span>
        </div>
        <p className="panel-lede">The main header is the view type. Controls like fields, filter, sort, and group sit underneath.</p>
        <div className="view-mode-tabs" role="tablist" aria-label="Timeline views">
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
        <div className="timeline-mode-receipt" aria-label="Timeline mode receipt" data-testid="timeline-mode-receipt">
          <article>
            <span>Question</span>
            <strong>{timelineViewQuestion}</strong>
          </article>
          <article>
            <span>Records</span>
            <strong>{timelineRecordCount}</strong>
            <small>{timelineSourceLabel}</small>
          </article>
          <article>
            <span>Dates</span>
            <strong>{timelineDatedRecordCount}</strong>
            <small>Rows with a usable date.</small>
          </article>
          <article>
            <span>Links</span>
            <strong>{timelineDependencyRecordCount}</strong>
            <small>Rows with dependencies.</small>
          </article>
          <article>
            <span>Reads</span>
            <strong>{timelineRuleReadCount}</strong>
            <small>Timeline rules matched.</small>
          </article>
        </div>
        {timelineTagRouteOptions.length > 0 && (
          <div className="tag-route-strip timeline-tag-route-strip" aria-label="Timeline tag routes">
            <span>Tag routes</span>
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
        <div className="grid-toolbar timeline-toolbar">
          <label>
            <span>Filter</span>
            <input
              value={timelineFilter}
              onChange={(event) => onTimelineFilterChange(event.target.value)}
              placeholder="Find records"
            />
          </label>
          <label>
            <span>Table</span>
            <select value={timelineTableId} onChange={(event) => onTimelineTableChange(event.target.value)}>
              <option value="all">All tables</option>
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
        {renderTimelineView()}
      </article>

      <article className="screen-panel">
        <div className="panel-title compact">
          <div>
            <span className="eyebrow">Sub controls</span>
            <h2>{timelineViewLabel} answers one question.</h2>
          </div>
        </div>
        <div className="view-helper-list">
          {timelineViewHelpers.map((helper) => (
            <button key={helper.value} type="button" onClick={() => onTimelineViewChange(helper.value)}>
              <strong>{helper.label}</strong>
              <span>{helper.description}</span>
            </button>
          ))}
        </div>

        <div className="panel-title compact timeline-panel-gap">
          <div>
            <span className="eyebrow">Date sample</span>
            <h2>Next records.</h2>
          </div>
        </div>
        <div className="gantt-preview">
          {dailyTimelineRecords.slice(0, 5).map((record, index) => (
            <div key={record.id}>
              <span>{getRecordTitle(base, record)}</span>
              <i className={`bar ${index % 3 === 0 ? 'firebar' : index % 3 === 1 ? 'waitbar' : 'prepbar'}`} />
              <em>{getRecordContext(record)}</em>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
