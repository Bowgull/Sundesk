import type { TimelineModel } from '../../data/timelineModel'
import type { BaseRecord } from '../../data/workbase'

type TimelineGridModeProps = {
  model: TimelineModel
  onOpenRecord: (record: BaseRecord) => void
}

export function TimelineGridMode({ model, onOpenRecord }: TimelineGridModeProps) {
  return (
    <section className="timeline-grid-mode" data-testid="timeline-list" aria-label="Timeline grid">
      <div className="timeline-grid-head" aria-hidden="true">
        <span>Place</span>
        <span>Item</span>
        <span>Status</span>
        <span>Due</span>
        <span>Tags</span>
        <span>Blocker</span>
        <span>Next move</span>
      </div>
      <div className="timeline-grid-rows">
        {model.grid.rows.map((row) => (
          <button
            className={`timeline-grid-row tone-${row.tone}`}
            data-testid={`timeline-row-${row.id}`}
            key={row.id}
            type="button"
            onClick={() => onOpenRecord(row.record)}
          >
            <span>{row.place}</span>
            <strong>{row.title}</strong>
            <i>{row.status}</i>
            <span>{row.dueLabel}</span>
            <span className="timeline-chip-list">
              {(row.tags.length > 0 ? row.tags : [row.tableLabel]).slice(0, 3).map((tag) => (
                <em key={tag}>{tag}</em>
              ))}
            </span>
            <span className="timeline-grid-reason">{row.blockers[0] || 'Clear'}</span>
            <span className="timeline-grid-next">{row.nextMove}</span>
          </button>
        ))}
      </div>
      {model.grid.rows.length === 0 && <p className="empty-note">No items match. Clear the filters.</p>}
    </section>
  )
}
