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
        <strong>Meetings generate the weekly notes.</strong>
        <p>Sundesk fills the operational fields from linked rows so the user edits the notes, not the memory.</p>
        <button disabled={!nextMeetingRecord} type="button" onClick={() => nextMeetingRecord && onOpenRecord(nextMeetingRecord)}>
          Open next meeting
        </button>
      </article>

      <article className="screen-panel wide">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Meeting records</span>
            <h2>Weekly prep.</h2>
          </div>
          <div className="drawer-actions">
            <span className="metric-pill">{meetingRecords.length} records</span>
            <button className="primary" type="button" onClick={onCreateMeeting}>New meeting</button>
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
        {nextMeetingRecord && (
          <div className="local-state-strip">
            <span>Next prep</span>
            <strong>{getRecordTitle(base, nextMeetingRecord)} reads {nextMeetingLinkedTasks.length} linked work items.</strong>
          </div>
        )}
        {nextMeetingPrep && renderMeetingPrep(nextMeetingPrep)}
      </article>
    </section>
  )
}
