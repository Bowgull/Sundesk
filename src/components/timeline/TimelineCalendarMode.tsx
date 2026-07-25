import { getDateKey, formatTimelineDate, type TimelineModel } from '../../data/timelineModel'
import type { BaseRecord } from '../../data/workbase'

type TimelineCalendarModeProps = {
  model: TimelineModel
  selectedDate: string
  onOpenRecord: (record: BaseRecord) => void
  onSelectDate: (date: string) => void
}

export function TimelineCalendarMode({
  model,
  selectedDate,
  onOpenRecord,
  onSelectDate,
}: TimelineCalendarModeProps) {
  const windowStart = getPressureWindowStart(model.calendar.pressureDays[0]?.date || selectedDate || model.calendar.anchorDate)
  const days = Array.from({ length: 21 }, (_, index) => {
    const date = new Date(`${windowStart}T12:00:00`)

    date.setDate(date.getDate() + index)

    return date.toISOString().slice(0, 10)
  })
  const selectedDay = model.calendar.selectedDay

  return (
    <section className="calendar-mode" data-testid="timeline-calendar" aria-label="Timeline calendar">
      <div className="calendar-pressure-strip">
        <div>
          <span>Date pressure</span>
          <strong>{model.calendar.pressureDays.length} active dates</strong>
        </div>
        <div>
          {model.calendar.pressureDays.slice(0, 6).map((day) => (
            <button
              className={day.date === selectedDay?.date ? 'selected' : ''}
              key={day.date}
              type="button"
              onClick={() => onSelectDate(day.date)}
            >
              <span>{day.label}</span>
              <strong>{day.count}</strong>
            </button>
          ))}
        </div>
      </div>
      <div className="calendar-month-shell" aria-label="Calendar date focus">
        <div className="calendar-month-head">
          <span>3 week scan</span>
          <strong>{formatTimelineDate(windowStart, { month: 'long', year: 'numeric' })}</strong>
        </div>
        <div className="calendar-weekdays" aria-hidden="true">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar-month">
          {days.map((date) => {
            const day = model.calendar.pressureDays.find((pressureDay) => pressureDay.date === date)
            const parsed = new Date(`${date}T12:00:00`)

            return (
              <button
                className={`${date === selectedDay?.date ? 'selected' : ''} ${day ? 'has-pressure' : ''}`}
                key={date}
                type="button"
                onClick={() => onSelectDate(date)}
              >
                <strong>{parsed.getDate()}</strong>
                <span>{formatTimelineDate(date)}</span>
                {day && <i>{day.count}</i>}
                {day?.items.slice(0, 3).map((item) => (
                  <em className={`tone-${item.tone}`} key={item.id}>
                    {getCalendarLabel(item.record.tableId)}. {item.title}
                  </em>
                ))}
              </button>
            )
          })}
        </div>
      </div>
      {selectedDay && (
        <section className="calendar-day-detail" aria-label="Calendar day detail">
          <div>
            <span>Selected day</span>
            <strong>{selectedDay.label}</strong>
            <small>{selectedDay.count} items</small>
          </div>
          <div>
            <strong>{selectedDay.nextAction}</strong>
            <div className="calendar-day-list">
              {selectedDay.items.map((item) => (
                <button className={`tone-${item.tone}`} key={item.id} type="button" onClick={() => onOpenRecord(item.record)}>
                  <span>{item.place}</span>
                  <strong>{item.title}</strong>
                  <small>{item.status}. {item.nextMove}</small>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
      {model.calendar.pressureDays.length === 0 && <p className="empty-note">No dated items match. Clear the filters.</p>}
    </section>
  )
}

function getPressureWindowStart(date: string) {
  const dateKey = getDateKey(date) || new Date().toISOString().slice(0, 10)
  const parsed = new Date(`${dateKey}T12:00:00`)

  parsed.setDate(parsed.getDate() - parsed.getDay())

  return parsed.toISOString().slice(0, 10)
}

function getCalendarLabel(tableId: string) {
  if (tableId === 'meetings') {
    return 'Meeting'
  }

  if (tableId === 'communities') {
    return 'Event'
  }

  if (tableId === 'followups') {
    return 'Waiting'
  }

  return 'Deadline'
}
