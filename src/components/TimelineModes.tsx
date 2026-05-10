import type { TimelineView } from '../appConfig'
import type { LocalRule } from '../data/rules'
import type { BaseRecord, RecordValue, Workbase } from '../data/workbase'
import type { RuleMatch } from '../data/views'

type DependencySummaryItem = {
  id: string
  label: string
  title: string
}

export type TimelineModesProps = {
  base: Workbase
  communityRecords: readonly BaseRecord[]
  timelineCalendarDate: string
  timelineGraphCommunityId: string
  timelineReadinessCommunityId: string
  timelineRecords: readonly BaseRecord[]
  timelineView: TimelineView
  getDependencySummary: (recordId: string) => readonly DependencySummaryItem[]
  getFirstDateValue: (record: BaseRecord) => string
  getNumberValue: (record: BaseRecord, fieldId: string) => number
  getRecordContext: (record: BaseRecord) => string
  getRecordTitle: (record: BaseRecord) => string
  getRulePreview: (rule: LocalRule) => string
  getSemanticChipClass: (value: string) => string
  getStringValue: (record: BaseRecord, fieldId: string) => string
  getTimelineRuleMatchesForRecord: (recordId: string) => readonly RuleMatch[]
  onOpenDailyRecord: (record: BaseRecord) => void
  onSetTimelineCalendarDate: (value: string) => void
  onSetTimelineGraphCommunityId: (value: string) => void
  onSetTimelineReadinessCommunityId: (value: string) => void
  onShowToast: (message: string) => void
  onUpdateRecordField: (recordId: string, fieldId: string, value: RecordValue) => void
}

export function TimelineModes({
  base,
  communityRecords,
  timelineCalendarDate,
  timelineGraphCommunityId,
  timelineReadinessCommunityId,
  timelineRecords,
  timelineView,
  getDependencySummary,
  getFirstDateValue,
  getNumberValue,
  getRecordContext,
  getRecordTitle,
  getRulePreview,
  getSemanticChipClass,
  getStringValue,
  getTimelineRuleMatchesForRecord,
  onOpenDailyRecord,
  onSetTimelineCalendarDate,
  onSetTimelineGraphCommunityId,
  onSetTimelineReadinessCommunityId,
  onShowToast,
  onUpdateRecordField,
}: TimelineModesProps) {
  if (timelineView === 'kanban') {
    const groups = ['Blocked', 'Waiting', 'In progress', 'Done']
    const nextStatusByGroup: Record<string, string> = {
      Blocked: 'Waiting',
      Waiting: 'In progress',
      'In progress': 'Done',
    }

    return (
      <div className="timeline-kanban" data-testid="timeline-kanban">
        {groups.map((status) => {
          const records = timelineRecords.filter((record) => {
            const recordStatus = getStringValue(record, 'status') || getStringValue(record, 'level') || getStringValue(record, 'priority')

            return status === 'Done' ? recordStatus === 'Done' || recordStatus === 'Received' : recordStatus === status
          })

          return (
            <section aria-label={`${status} lane`} className="kanban-column" key={status}>
              <div>
                <strong>{status}</strong>
                <span>{records.length}</span>
              </div>
              {records.map((record) => {
                const nextStatus = nextStatusByGroup[status]
                const statusField = base.fields.find((field) =>
                  field.tableId === record.tableId &&
                  field.id === 'status' &&
                  (field.type === 'status' || field.type === 'singleSelect') &&
                  field.options?.includes(nextStatus),
                )

                return (
                  <article className="kanban-card" key={record.id}>
                    <button type="button" onClick={() => onOpenDailyRecord(record)}>
                      <strong>{getRecordTitle(record)}</strong>
                      <small>{getRecordContext(record)}</small>
                      <span>{getFirstDateValue(record) || 'No date'}</span>
                    </button>
                    {statusField && nextStatus && (
                      <button
                        className="kanban-card-action"
                        type="button"
                        onClick={() => {
                          onUpdateRecordField(record.id, statusField.id, nextStatus)
                          onShowToast(`${getRecordTitle(record)} moved to ${nextStatus}.`)
                        }}
                      >
                        Move to {nextStatus}
                      </button>
                    )}
                  </article>
                )
              })}
            </section>
          )
        })}
      </div>
    )
  }

  if (timelineView === 'calendar') {
    const datedRecords = timelineRecords.filter((record) => getFirstDateValue(record))
    const dateGroups = Array.from(
      datedRecords.reduce((groups, record) => {
        const date = getFirstDateValue(record)

        if (!date) {
          return groups
        }

        groups.set(date, [...(groups.get(date) || []), record])

        return groups
      }, new Map<string, BaseRecord[]>()),
    ).sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
    const selectedDate = dateGroups.some(([date]) => date === timelineCalendarDate)
      ? timelineCalendarDate
      : dateGroups[0]?.[0] || ''
    const selectedDateRecords = dateGroups.find(([date]) => date === selectedDate)?.[1] || []

    return (
      <div className="calendar-mode" data-testid="timeline-calendar">
        <div className="calendar-date-strip" aria-label="Calendar date focus">
          <span>Date focus</span>
          <div>
            {dateGroups.slice(0, 10).map(([date, records]) => (
              <button
                className={date === selectedDate ? 'selected' : ''}
                key={date}
                type="button"
                onClick={() => onSetTimelineCalendarDate(date)}
              >
                <strong>{date}</strong>
                <small>{records.length}</small>
              </button>
            ))}
          </div>
        </div>
        {selectedDate && (
          <section className="calendar-day-detail" aria-label="Calendar day detail">
            <div>
              <span>Selected day</span>
              <strong>{selectedDate}</strong>
            </div>
            <div>
              {selectedDateRecords.map((record) => (
                <button key={record.id} type="button" onClick={() => onOpenDailyRecord(record)}>
                  <strong>{getRecordTitle(record)}</strong>
                  <small>{getRecordContext(record)}</small>
                </button>
              ))}
            </div>
          </section>
        )}
        <div className="calendar-board">
          {datedRecords.slice(0, 14).map((record) => (
            <button key={record.id} type="button" onClick={() => onOpenDailyRecord(record)}>
              <span>{getFirstDateValue(record)}</span>
              <strong>{getRecordTitle(record)}</strong>
              <small>{getRecordContext(record)}</small>
            </button>
          ))}
          {datedRecords.length === 0 && <p className="empty-note">No dated records match. Clear the filters.</p>}
        </div>
      </div>
    )
  }

  if (timelineView === 'timeline') {
    const selectedCommunity = communityRecords.find((community) => community.id === timelineReadinessCommunityId) || communityRecords[0]
    const selectedCommunityRecords = selectedCommunity
      ? timelineRecords.filter((record) =>
          base.fields.some((field) => {
            const value = record.values[field.id]

            return field.type === 'linkedRecord' && Array.isArray(value) && value.includes(selectedCommunity.id)
          }),
        )
      : []

    return (
      <div className="readiness-timeline" data-testid="timeline-readiness">
        {selectedCommunity && (
          <section className="readiness-focus-panel" aria-label="Readiness place focus">
            <div>
              <span>Place focus</span>
              <strong>{getRecordTitle(selectedCommunity)}</strong>
              <small>{getNumberValue(selectedCommunity, 'readiness')}% ready</small>
            </div>
            <div className="readiness-focus-options">
              {communityRecords.map((community) => (
                <button
                  className={community.id === selectedCommunity.id ? 'selected' : ''}
                  key={community.id}
                  type="button"
                  onClick={() => onSetTimelineReadinessCommunityId(community.id)}
                >
                  {getRecordTitle(community)}
                </button>
              ))}
            </div>
            <div className="readiness-focus-records" aria-label="Focused readiness rows">
              {selectedCommunityRecords.slice(0, 5).map((record) => (
                <button key={record.id} type="button" onClick={() => onOpenDailyRecord(record)}>
                  <strong>{getRecordTitle(record)}</strong>
                  <small>{getRecordContext(record)}</small>
                </button>
              ))}
              {selectedCommunityRecords.length === 0 && <p className="empty-note">No linked rows match the current filters.</p>}
            </div>
          </section>
        )}
        {communityRecords.map((community) => {
          const communityTitle = getRecordTitle(community)
          const linkedRecords = timelineRecords.filter((record) =>
            base.fields.some((field) => {
              const value = record.values[field.id]

              return field.type === 'linkedRecord' && Array.isArray(value) && value.includes(community.id)
            }),
          )

          return (
            <section key={community.id}>
              <div>
                <strong>{communityTitle}</strong>
                <span>{getNumberValue(community, 'readiness')}% ready</span>
              </div>
              <div className="readiness-track">
                {linkedRecords.slice(0, 5).map((record) => (
                  <button key={record.id} type="button" onClick={() => onOpenDailyRecord(record)}>
                    <span>{getRecordTitle(record)}</span>
                  </button>
                ))}
                <i>Event</i>
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  if (timelineView === 'graph') {
    const selectedCommunity = communityRecords.find((community) => community.id === timelineGraphCommunityId) || communityRecords[0]
    const relatedRecords = selectedCommunity
      ? timelineRecords.filter((record) =>
          base.fields.some((field) => {
            const value = record.values[field.id]

            return field.type === 'linkedRecord' && Array.isArray(value) && value.includes(selectedCommunity.id)
          }),
        )
      : []

    return (
      <div className="risk-graph-shell" data-testid="timeline-graph">
        {selectedCommunity ? (
          <>
            <div className="graph-focus-strip" aria-label="Graph place focus">
              <span>Place focus</span>
              <div>
                {communityRecords.map((community) => (
                  <button
                    className={community.id === selectedCommunity.id ? 'selected' : ''}
                    key={community.id}
                    type="button"
                    onClick={() => onSetTimelineGraphCommunityId(community.id)}
                  >
                    {getRecordTitle(community)}
                  </button>
                ))}
              </div>
            </div>
            <div className="risk-graph">
              <button className="graph-node center" type="button" onClick={() => onOpenDailyRecord(selectedCommunity)}>
                <strong>{getRecordTitle(selectedCommunity)}</strong>
                <span>{getNumberValue(selectedCommunity, 'readiness')}% ready</span>
              </button>
              <div className="graph-spokes">
                {relatedRecords.slice(0, 5).map((record) => (
                  <button className={`graph-node ${getSemanticChipClass(getRecordContext(record))}`} key={record.id} type="button" onClick={() => onOpenDailyRecord(record)}>
                    <strong>{getRecordTitle(record)}</strong>
                    <span>{getRecordContext(record)}</span>
                  </button>
                ))}
                {relatedRecords.length === 0 && <p className="empty-note">No linked records match the current filters.</p>}
              </div>
            </div>
          </>
        ) : (
          <p className="empty-note">No community records are available.</p>
        )}
      </div>
    )
  }

  return (
    <div className="timeline-list" data-testid="timeline-list">
      {timelineRecords.map((record) => {
        const table = base.tables.find((tableItem) => tableItem.id === record.tableId)
        const recordStatus = getStringValue(record, 'status') || getStringValue(record, 'level') || getStringValue(record, 'priority') || 'No status'
        const recordDate = getFirstDateValue(record)
        const dependencySummary = getDependencySummary(record.id)
        const ruleSummary = getTimelineRuleMatchesForRecord(record.id)

        return (
          <button className="timeline-record-row" data-testid={`timeline-row-${record.id}`} key={record.id} type="button" onClick={() => onOpenDailyRecord(record)}>
            <span>{recordDate || 'No date'}</span>
            <strong>{getRecordTitle(record)}</strong>
            <small>{table?.label || record.tableId}. {recordStatus}. {getRecordContext(record)}</small>
            <span className="timeline-dependency-summary">
              {dependencySummary.length === 0 ? (
                <small>No dependencies</small>
              ) : (
                dependencySummary.slice(0, 2).map((dependency) => (
                  <i key={dependency.id}>{dependency.label}: {dependency.title}</i>
                ))
              )}
              {dependencySummary.length > 2 && <small>+{dependencySummary.length - 2} more</small>}
            </span>
            {ruleSummary.length > 0 && (
              <span className="timeline-rule-summary">
                {ruleSummary.slice(0, 2).map((match) => (
                  <i key={match.rule.id}>Rule: {getRulePreview(match.rule)}</i>
                ))}
              </span>
            )}
          </button>
        )
      })}
      {timelineRecords.length === 0 && <p className="empty-note">No records match. Clear the timeline filters.</p>}
    </div>
  )
}
