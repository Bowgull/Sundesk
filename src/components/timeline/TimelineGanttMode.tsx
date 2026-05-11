import { formatTimelineDate, type TimelineModel } from '../../data/timelineModel'
import type { BaseRecord } from '../../data/workbase'

type TimelineGanttModeProps = {
  model: TimelineModel
  selectedCommunityId: string
  onOpenRecord: (record: BaseRecord) => void
  onSelectCommunity: (communityId: string) => void
}

function getVisibleMarkerLeft(left: number) {
  return Math.min(92, Math.max(8, left))
}

function getVisibleBarLeft(left: number) {
  return Math.min(78, Math.max(4, left))
}

export function TimelineGanttMode({
  model,
  selectedCommunityId,
  onOpenRecord,
  onSelectCommunity,
}: TimelineGanttModeProps) {
  const selectedRow = model.gantt.rows.find((row) => row.communityId === selectedCommunityId) || model.gantt.rows[0]

  return (
    <section className="timeline-gantt-mode" data-testid="timeline-readiness" aria-label="Gantt readiness timeline">
      <div className="gantt-focus-panel">
        <div>
          <span>Readiness focus</span>
          <strong>{selectedRow?.community || 'No place'}</strong>
          <small>{selectedRow ? `${selectedRow.readiness}% ready. Event ${selectedRow.eventLabel}.` : 'No timeline rows.'}</small>
        </div>
        <div className="gantt-focus-options">
          {model.gantt.rows.map((row) => (
            <button
              className={row.communityId === selectedRow?.communityId ? 'selected' : ''}
              key={row.communityId}
              type="button"
              onClick={() => onSelectCommunity(row.communityId)}
            >
              {row.community}
            </button>
          ))}
        </div>
      </div>
      <div className="gantt-board">
        <div className="gantt-axis">
          <span>{formatTimelineDate(model.gantt.startDate) || 'Start'}</span>
          <strong>Readiness path</strong>
          <span>{formatTimelineDate(model.gantt.endDate) || 'Event'}</span>
        </div>
        {model.gantt.rows.map((row) => (
          <section className={row.communityId === selectedRow?.communityId ? 'gantt-row selected' : 'gantt-row'} key={row.communityId}>
            <button className="gantt-row-label" type="button" onClick={() => onSelectCommunity(row.communityId)}>
              <strong>{row.community}</strong>
              <span>{row.readiness}% ready</span>
            </button>
            <div className="gantt-track" style={{ minHeight: `${Math.max(104, 72 + row.items.length * 46)}px` }}>
              <i className="gantt-event-line" style={{ left: `${row.eventLeft}%` }} />
              <div className="gantt-lane-list">
                {row.items.map((item) => (
                  <div className="gantt-lane" key={item.id}>
                    <button
                      className={`gantt-bar tone-${item.tone}`}
                      style={{ left: `${getVisibleBarLeft(item.left)}%`, width: `clamp(170px, ${item.width}%, 260px)` }}
                      type="button"
                      onClick={() => onOpenRecord(item.record)}
                    >
                      <span>{item.dueLabel}</span>
                      <strong>{item.title}</strong>
                    </button>
                  </div>
                ))}
              </div>
              <em className="gantt-event-chip" style={{ left: `${getVisibleMarkerLeft(row.eventLeft)}%` }}>
                Event. {row.eventLabel}
              </em>
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
