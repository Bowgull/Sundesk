import type { ReactNode } from 'react'
import { timelineViewOptions, type TimelineView } from '../appConfig'
import type { BaseRecord, Workbase } from '../data/workbase'
import { getRecordContext, getRecordTitle } from '../data/workbase'

type TimelineScreenProps = {
  base: Workbase
  dailyTimelineRecords: BaseRecord[]
  renderTimelineView: () => ReactNode
  timelineDatedRecordCount: number
  timelineDependencyRecordCount: number
  timelineFilter: string
  timelineRecords: BaseRecord[]
  timelineRuleReadCount: number
  timelineStatus: string
  timelineStatusOptions: string[]
  timelineTableId: string
  timelineTagRouteOptions: [string, BaseRecord][]
  timelineView: TimelineView
  timelineViewQuestion: string
  getChipColorClass: (value: string) => string
  onTimelineFilterChange: (value: string) => void
  onTimelineStatusChange: (value: string) => void
  onTimelineTableChange: (value: string) => void
  onTimelineViewChange: (value: TimelineView) => void
  onWorkflowTagRouteOpen: (record: BaseRecord, tag: string) => void
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
  return (
    <section className="screen-grid" data-testid="timeline-screen" id="timeline">
      <article className="screen-panel wide">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Views · Timeline</span>
            <h2>Timeline has 5 ways to look.</h2>
          </div>
          <span className="metric-pill">{timelineRecords.length} shown</span>
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
            <strong>{timelineRecords.length}</strong>
            <small>{timelineTableId === 'all' ? 'All source tables.' : `${base.tables.find((table) => table.id === timelineTableId)?.label || timelineTableId}.`}</small>
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
            <h2>{timelineViewOptions.find((option) => option.value === timelineView)?.label} answers one question.</h2>
          </div>
        </div>
        <div className="view-helper-list">
          <button type="button" onClick={() => onTimelineViewChange('grid')}><strong>Grid</strong><span>Clean or edit rows.</span></button>
          <button type="button" onClick={() => onTimelineViewChange('kanban')}><strong>Kanban</strong><span>Move work by state.</span></button>
          <button type="button" onClick={() => onTimelineViewChange('calendar')}><strong>Calendar</strong><span>See date pressure.</span></button>
          <button type="button" onClick={() => onTimelineViewChange('timeline')}><strong>Timeline</strong><span>Read readiness before event day.</span></button>
          <button type="button" onClick={() => onTimelineViewChange('graph')}><strong>Graph</strong><span>Explain why a place is at risk.</span></button>
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
