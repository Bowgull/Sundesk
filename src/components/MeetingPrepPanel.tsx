import { getFirstDateValue, getStringValue } from '../data/rules'
import {
  type BaseRecord,
  type RecordValue,
  type Workbase,
  getRecord,
  getRecordTitle,
} from '../data/workbase'
import {
  type MeetingPrep,
  getMeetingDigestPreview,
  getMeetingWeeklyNoteText,
} from '../data/views'

type WeeklyNoteSectionRoute = {
  section: string
  reason: string
}

type MeetingPrepPanelProps = {
  activeDigestPreviewMeetingId: string
  base: Workbase
  prep: MeetingPrep
  appendWeeklyNoteSectionLine: (note: string, heading: string, record: BaseRecord) => string
  getPickerRecordMeta: (record: BaseRecord) => string
  getWeeklyNoteSection: (note: string, heading: string) => string
  getWeeklyNoteSectionRoute: (record: BaseRecord) => WeeklyNoteSectionRoute
  onCopyMeetingAgenda: (prep: MeetingPrep) => void | Promise<void>
  onCopyMeetingNote: (prep: MeetingPrep) => void | Promise<void>
  onExportMeetingAgenda: (prep: MeetingPrep) => void
  onExportMeetingNote: (prep: MeetingPrep) => void
  onOpenMeetingSourceRoute: (record: BaseRecord) => void
  onOpenRecord: (tableId: string, recordId: string) => void
  onSetActiveDigestPreviewMeetingId: (updater: (current: string) => string) => void
  onUpdateRecordField: (recordId: string, fieldId: string, value: RecordValue) => void
  updateWeeklyNoteSection: (note: string, heading: string, value: string) => string
}

export function MeetingPrepPanel({
  activeDigestPreviewMeetingId,
  base,
  prep,
  appendWeeklyNoteSectionLine,
  getPickerRecordMeta,
  getWeeklyNoteSection,
  getWeeklyNoteSectionRoute,
  onCopyMeetingAgenda,
  onCopyMeetingNote,
  onExportMeetingAgenda,
  onExportMeetingNote,
  onOpenMeetingSourceRoute,
  onOpenRecord,
  onSetActiveDigestPreviewMeetingId,
  onUpdateRecordField,
  updateWeeklyNoteSection,
}: MeetingPrepPanelProps) {
  const weeklyNoteDraft = getStringValue(prep.meeting, 'weeklyNote') || getMeetingWeeklyNoteText(base, prep)
  const hasSavedWeeklyNote = Boolean(getStringValue(prep.meeting, 'weeklyNote'))
  const decisionDraft = getWeeklyNoteSection(weeklyNoteDraft, 'Decisions')
  const riskDraft = getWeeklyNoteSection(weeklyNoteDraft, 'Risks')
  const nextStepDraft = getWeeklyNoteSection(weeklyNoteDraft, 'Next steps')
  const sectionInsertRecords = [...prep.communities, ...prep.linkedTasks, ...prep.overdueFollowups, ...prep.unresolvedApprovals, ...prep.risks].slice(0, 6)

  return (
    <div className="meeting-prep" data-testid="meeting-prep">
      <div className="meeting-prep-head">
        <div>
          <span className="eyebrow">Computed prep</span>
          <strong>{getRecordTitle(base, prep.meeting)}</strong>
        </div>
        <span>Not saved. Rebuilt from source records.</span>
      </div>
      <div className="meeting-prep-stats">
        <span>{prep.communities.length} communities</span>
        <span>{prep.linkedTasks.length} work items</span>
        <span>{prep.overdueFollowups.length} waiting items</span>
        <span>{prep.unresolvedApprovals.length} open approvals</span>
        <span>{prep.risks.length} risks</span>
      </div>
      <div className="meeting-note-shell" data-testid="meeting-weekly-note">
        <div className="meeting-note-paper">
          <div className="meeting-note-title">
            <span>Generated weekly note</span>
            <strong>{getRecordTitle(base, prep.meeting)}</strong>
            <small>Edit this note here. It stays local to this screen until copied or exported.</small>
            <div className="meeting-note-actions" aria-label="Weekly note actions">
              <button type="button" onClick={() => void onCopyMeetingNote(prep)}>Copy note</button>
              <button type="button" onClick={() => onExportMeetingNote(prep)}>Export PDF</button>
            </div>
          </div>
          <div className="meeting-note-summary">
            <p><strong>Focus.</strong> {prep.agenda[0]?.detail || 'No agenda items surfaced yet.'}</p>
            <p><strong>Next steps.</strong> {prep.nextSteps.length} records need a next move.</p>
          </div>
          <div className="meeting-note-fields" aria-label="Weekly note fields">
            <article>
              <span>Meeting date</span>
              <strong>{getStringValue(prep.meeting, 'date') || getFirstDateValue(prep.meeting) || 'No date'}</strong>
            </article>
            <article>
              <span>Communities</span>
              <strong>{prep.communities.length}</strong>
            </article>
            <article>
              <span>Work</span>
              <strong>{prep.linkedTasks.length}</strong>
            </article>
            <article>
              <span>Waiting</span>
              <strong>{prep.overdueFollowups.length}</strong>
            </article>
            <article>
              <span>Approvals</span>
              <strong>{prep.unresolvedApprovals.length}</strong>
            </article>
            <article>
              <span>Risks</span>
              <strong>{prep.risks.length}</strong>
            </article>
            <article>
              <span>Note state</span>
              <strong>{hasSavedWeeklyNote ? 'Saved draft' : 'Generated'}</strong>
            </article>
          </div>
          <div className="meeting-note-sections" aria-label="Weekly note sections">
            {[
              { heading: 'Decisions', value: decisionDraft },
              { heading: 'Risks', value: riskDraft },
              { heading: 'Next steps', value: nextStepDraft },
            ].map((section) => (
              <div className="meeting-note-section-card" key={section.heading}>
                <label>
                  <span>{section.heading}</span>
                  <textarea
                    value={section.value}
                    rows={3}
                    onChange={(event) => onUpdateRecordField(prep.meeting.id, 'weeklyNote', updateWeeklyNoteSection(weeklyNoteDraft, section.heading, event.target.value))}
                  />
                </label>
              </div>
            ))}
            <div className="meeting-note-routed-sources" aria-label="Routed source inserts">
              <span>Source inserts</span>
              {sectionInsertRecords.map((record) => {
                const route = getWeeklyNoteSectionRoute(record)

                return (
                  <div className="meeting-source-row" key={record.id}>
                    <button
                      type="button"
                      onClick={() => onUpdateRecordField(prep.meeting.id, 'weeklyNote', appendWeeklyNoteSectionLine(weeklyNoteDraft, route.section, record))}
                    >
                      <strong>{getRecordTitle(base, record)}</strong>
                      <small>{route.section}</small>
                      <small className="route-reason">{route.reason}</small>
                    </button>
                    <button
                      aria-label={`Open source record ${getRecordTitle(base, record)}`}
                      type="button"
                      onClick={() => onOpenMeetingSourceRoute(record)}
                    >
                      Open
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          <label className="meeting-note-editor">
            <span>Weekly note draft</span>
            <textarea
              value={weeklyNoteDraft}
              rows={10}
              onChange={(event) => onUpdateRecordField(prep.meeting.id, 'weeklyNote', event.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="meeting-prep-workspace">
        <div className="meeting-agenda" data-testid="meeting-agenda">
          <div className="meeting-agenda-head">
            <div className="mini-title">
              <strong>Generated agenda</strong>
              <span className="metric-pill">{prep.agenda.length}</span>
            </div>
            <div className="agenda-actions" aria-label="Computed agenda actions">
              <button type="button" onClick={() => void onCopyMeetingAgenda(prep)}>Copy agenda</button>
              <button type="button" onClick={() => onExportMeetingAgenda(prep)}>Export agenda PDF</button>
              <button
                aria-expanded={activeDigestPreviewMeetingId === prep.meeting.id}
                type="button"
                onClick={() => onSetActiveDigestPreviewMeetingId((current) => current === prep.meeting.id ? '' : prep.meeting.id)}
              >
                Preview summary
              </button>
            </div>
          </div>
          {activeDigestPreviewMeetingId === prep.meeting.id && (
            <div className="agenda-digest-preview" data-testid="agenda-digest-preview">
              <strong>Command send preview</strong>
              <pre>{getMeetingDigestPreview(base, prep)}</pre>
            </div>
          )}
          <ol>
            {prep.agenda.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
                {item.recordIds.length > 0 && (
                  <div className="meeting-agenda-records">
                    {item.recordIds.map((recordId) => {
                      const record = getRecord(base, recordId)

                      return record ? (
                        <button key={record.id} type="button" onClick={() => onOpenRecord(record.tableId, record.id)}>
                          {getRecordTitle(base, record)}
                        </button>
                      ) : null
                    })}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
        <div className="meeting-source-receipts" aria-label="Meeting prep source records">
          <strong>Source records</strong>
          {[...prep.communities, ...prep.linkedTasks].length === 0 ? (
            <p className="empty-line">Link a community or work item to compute prep.</p>
          ) : (
            <div>
              {[...prep.communities, ...prep.linkedTasks].map((record) => (
                <button key={record.id} type="button" onClick={() => onOpenRecord(record.tableId, record.id)}>
                  {getRecordTitle(base, record)}
                  <small>{getPickerRecordMeta(record)}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="meeting-prep-sections">
        {prep.sections.map((section) => (
          <section key={section.id}>
            <div className="mini-title">
              <strong>{section.label}</strong>
              <span className="metric-pill">{section.records.length}</span>
            </div>
            {section.records.length === 0 ? (
              <p className="empty-line">No records surfaced.</p>
            ) : (
              <div className="meeting-prep-list">
                {section.records.slice(0, 4).map((record) => (
                  <button key={record.id} type="button" onClick={() => onOpenRecord(record.tableId, record.id)}>
                    <strong>{getRecordTitle(base, record)}</strong>
                    <small>{getPickerRecordMeta(record)}</small>
                  </button>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
