import type { ReactNode } from 'react'
import type { BaseRecord, FieldDefinition, Workbase } from '../data/workbase'
import { getRecordContext, getRecordTitle } from '../data/workbase'
import type { MeetingPrep } from '../data/views'

type MeetingsScreenProps = {
  base: Workbase
  getFieldDisplayValue: (record: BaseRecord, field: FieldDefinition) => string
  meetingRecords: BaseRecord[]
  meetingTasksField: FieldDefinition | undefined
  nextMeetingLinkedTasks: readonly unknown[]
  nextMeetingPrep: MeetingPrep | null
  nextMeetingRecord: BaseRecord | undefined
  onCreateMeeting: () => void
  onOpenRecord: (record: BaseRecord) => void
  renderMeetingPrep: (prep: MeetingPrep) => ReactNode
}

export function MeetingsScreen({
  base,
  getFieldDisplayValue,
  meetingRecords,
  meetingTasksField,
  nextMeetingLinkedTasks,
  nextMeetingPrep,
  nextMeetingRecord,
  onCreateMeeting,
  onOpenRecord,
  renderMeetingPrep,
}: MeetingsScreenProps) {
  return (
    <section className="screen-grid meetings-screen" id="meetings">
      <article className="screen-panel meeting-brief">
        <span className="eyebrow">Meetings</span>
        <h2>Meetings generate the weekly notes.</h2>
        <p>The meeting opens with status, approvals, questions, and next steps already shaped.</p>
        <button disabled={!nextMeetingRecord} type="button" onClick={() => nextMeetingRecord && onOpenRecord(nextMeetingRecord)}>
          Open next meeting
        </button>
      </article>

      <article className="screen-panel wide meeting-prep-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Weekly prep</span>
            <h2>Weekly note draft.</h2>
          </div>
          <div className="drawer-actions">
            <span className="metric-pill">{meetingRecords.length} meetings</span>
            <button className="primary" type="button" onClick={onCreateMeeting}>New meeting</button>
          </div>
        </div>
        {nextMeetingRecord && (
          <div className="local-state-strip">
            <span>Next meeting</span>
            <strong>{getRecordTitle(base, nextMeetingRecord)} has {nextMeetingLinkedTasks.length} work items ready.</strong>
          </div>
        )}
        {nextMeetingPrep && renderMeetingPrep(nextMeetingPrep)}
        <div className="meeting-records-drawer">
          <div className="panel-title compact">
            <div>
              <span className="eyebrow">Meetings</span>
              <h3>Open another meeting.</h3>
            </div>
          </div>
          <div className="record-card-grid">
            {meetingRecords.map((record) => (
              <button className="work-record-card" key={record.id} type="button" onClick={() => onOpenRecord(record)}>
                <span>{getRecordContext(record)}</span>
                <strong>{getRecordTitle(base, record)}</strong>
                <small>{meetingTasksField ? getFieldDisplayValue(record, meetingTasksField) : 'No work linked'}</small>
              </button>
            ))}
          </div>
        </div>
      </article>
    </section>
  )
}
