import { getFirstDateValue, getStringValue } from '../data/rules'
import { getCopyModeText } from '../data/copyMode'
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
  rupaulMode: boolean
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
  rupaulMode,
  updateWeeklyNoteSection,
}: MeetingPrepPanelProps) {
  const weeklyNoteDraft = getStringValue(prep.meeting, 'weeklyNote') || getMeetingWeeklyNoteText(base, prep)
  const hasSavedWeeklyNote = Boolean(getStringValue(prep.meeting, 'weeklyNote'))
  const decisionDraft = getWeeklyNoteSection(weeklyNoteDraft, 'Decisions')
  const riskDraft = getWeeklyNoteSection(weeklyNoteDraft, 'Risks')
  const nextStepDraft = getWeeklyNoteSection(weeklyNoteDraft, 'Next steps')
  const sectionInsertRecords = [...prep.communities, ...prep.linkedTasks, ...prep.overdueFollowups, ...prep.unresolvedApprovals, ...prep.risks].slice(0, 6)
  const meetingDateValue = getStringValue(prep.meeting, 'date') || getFirstDateValue(prep.meeting)
  const meetingDateLabel = meetingDateValue
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: meetingDateValue.includes('T') ? 'short' : undefined }).format(new Date(meetingDateValue))
    : 'No date'

  return (
    <div className="meeting-prep" data-testid="meeting-prep">
      <div className="meeting-prep-head">
        <div>
          <span className="eyebrow">Ready to review</span>
          <strong>{getRecordTitle(base, prep.meeting)}</strong>
        </div>
        <span>Built from connected work.</span>
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
            <span>Weekly note</span>
            <strong>{getRecordTitle(base, prep.meeting)}</strong>
            <small>Edit the note before copying or exporting.</small>
            <div className="meeting-note-actions" aria-label="Weekly note actions">
              <button
                aria-label="Copy note"
                data-copy-plain="Copy note"
                title="Copy note"
                type="button"
                onClick={() => void onCopyMeetingNote(prep)}
              >
                {getCopyModeText('button.copyNote', rupaulMode)}
              </button>
              <button
                aria-label="Export PDF"
                data-copy-plain="Export PDF"
                data-onboarding-target="meeting-export-pdf"
                title="Export PDF"
                type="button"
                onClick={() => onExportMeetingNote(prep)}
              >
                {getCopyModeText('button.exportPdf', rupaulMode)}
              </button>
            </div>
          </div>
          <div className="meeting-note-summary">
            <p><strong>Focus.</strong> {prep.agenda[0]?.detail || 'No agenda items surfaced yet.'}</p>
            <p><strong>Next steps.</strong> {prep.nextSteps.length} items need a next move.</p>
          </div>
          <div className="meeting-note-fields" aria-label="Weekly note details">
            <article>
              <span>Meeting date</span>
              <strong>{meetingDateLabel}</strong>
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
              <strong>{hasSavedWeeklyNote ? 'Saved draft' : 'Ready'}</strong>
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
            <div className="meeting-note-routed-sources" aria-label="Add to note">
              <span>Add to note</span>
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
                <strong>Agenda</strong>
              <span className="metric-pill">{prep.agenda.length}</span>
            </div>
            <div className="agenda-actions" aria-label="Agenda actions">
              <button
                aria-label="Copy agenda"
                data-copy-plain="Copy agenda"
                title="Copy agenda"
                type="button"
                onClick={() => void onCopyMeetingAgenda(prep)}
              >
                {getCopyModeText('button.copyAgenda', rupaulMode)}
              </button>
              <button
                aria-label="Export agenda PDF"
                data-copy-plain="Export agenda PDF"
                title="Export agenda PDF"
                type="button"
                onClick={() => onExportMeetingAgenda(prep)}
              >
                {getCopyModeText('button.exportAgendaPdf', rupaulMode)}
              </button>
              <button
                aria-label="Preview summary"
                aria-expanded={activeDigestPreviewMeetingId === prep.meeting.id}
                data-copy-plain="Preview summary"
                title="Preview summary"
                type="button"
                onClick={() => onSetActiveDigestPreviewMeetingId((current) => current === prep.meeting.id ? '' : prep.meeting.id)}
              >
                {getCopyModeText('button.previewSummary', rupaulMode)}
              </button>
            </div>
          </div>
          {activeDigestPreviewMeetingId === prep.meeting.id && (
            <div className="agenda-digest-preview" data-testid="agenda-digest-preview">
              <strong>Preview</strong>
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
        <div className="meeting-source-receipts" aria-label="Built from">
          <strong>Built from</strong>
          {[...prep.communities, ...prep.linkedTasks].length === 0 ? (
            <p className="empty-line">Link a community or work item to prepare the note.</p>
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
              <p className="empty-line">Nothing open here.</p>
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
