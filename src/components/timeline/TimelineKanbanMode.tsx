import { useState } from 'react'
import type { TimelineKanbanLane, TimelineModel } from '../../data/timelineModel'
import type { BaseRecord, RecordValue, Workbase } from '../../data/workbase'

type TimelineKanbanModeProps = {
  base: Workbase
  model: TimelineModel
  onOpenRecord: (record: BaseRecord) => void
  onShowToast: (message: string) => void
  onUpdateRecordField: (recordId: string, fieldId: string, value: RecordValue) => void
}

const nextStatusByLane: Partial<Record<TimelineKanbanLane['id'], string>> = {
  blocked: 'Waiting',
  waiting: 'Prep',
  prep: 'Done',
}

export function TimelineKanbanMode({
  base,
  model,
  onOpenRecord,
  onShowToast,
  onUpdateRecordField,
}: TimelineKanbanModeProps) {
  const [draggingRecordId, setDraggingRecordId] = useState('')
  const [dropLaneId, setDropLaneId] = useState('')

  function getStatusField(record: BaseRecord, nextStatus: string) {
    const storedStatus = nextStatus === 'Prep' ? 'In progress' : nextStatus

    return base.fields.find((field) =>
      field.tableId === record.tableId &&
      field.id === 'status' &&
      (field.type === 'status' || field.type === 'singleSelect') &&
      field.options?.includes(storedStatus),
    )
  }

  function moveRecord(record: BaseRecord, nextStatus: string) {
    const statusField = getStatusField(record, nextStatus)
    const storedStatus = nextStatus === 'Prep' ? 'In progress' : nextStatus
    const title = model.grid.rows.find((row) => row.id === record.id)?.title || record.id

    if (!statusField) {
      onShowToast(`${title} cannot move to ${nextStatus}.`)
      return
    }

    onUpdateRecordField(record.id, statusField.id, storedStatus)
    onShowToast(`${title} moved to ${nextStatus}.`)
  }

  return (
    <div className="timeline-kanban" data-testid="timeline-kanban">
      {model.kanban.lanes.map((lane) => {
        const nextStatus = nextStatusByLane[lane.id]

        return (
          <section
            aria-label={`${lane.label} lane`}
            className={`kanban-column lane-${lane.id} ${dropLaneId === lane.id ? 'is-drop-target' : ''}`}
            key={lane.id}
            onDragLeave={() => setDropLaneId('')}
            onDragOver={(event) => {
              event.preventDefault()
              setDropLaneId(lane.id)
            }}
            onDrop={(event) => {
              event.preventDefault()
              const recordId = event.dataTransfer.getData('text/plain')
              const card = lane.cards.find((item) => item.id === recordId) || model.grid.rows.find((item) => item.id === recordId)

              setDraggingRecordId('')
              setDropLaneId('')
              if (card) {
                moveRecord(card.record, lane.label)
              }
            }}
          >
            <div className="kanban-lane-head">
              <strong>{lane.label}</strong>
              <span>{lane.cards.length}</span>
            </div>
            <div className="kanban-card-stack">
              {lane.cards.map((card) => (
                <article
                  className={`kanban-card tone-${card.tone} ${draggingRecordId === card.id ? 'is-dragging' : ''}`}
                  draggable
                  key={card.id}
                  onDragEnd={() => {
                    setDraggingRecordId('')
                    setDropLaneId('')
                  }}
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', card.id)
                    event.dataTransfer.effectAllowed = 'move'
                    setDraggingRecordId(card.id)
                  }}
                >
                  <button type="button" onClick={() => onOpenRecord(card.record)}>
                    <span className="kanban-card-meta">
                      <b>{card.place}</b>
                      <i>{card.dueLabel}</i>
                    </span>
                    <strong>{card.title}</strong>
                    <small>{card.reason}</small>
                    <span className="kanban-card-foot">
                      <i>{card.status}</i>
                      <i>{card.nextMove}</i>
                    </span>
                  </button>
                  {nextStatus && getStatusField(card.record, nextStatus) && (
                    <button className="kanban-card-action" type="button" onClick={() => moveRecord(card.record, nextStatus)}>
                      {card.nextMove}
                    </button>
                  )}
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
