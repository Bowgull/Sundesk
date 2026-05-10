import type { Dispatch, SetStateAction } from 'react'
import { type StoredWorkbaseState } from '../data/localStorage'
import { getNumberValue, getStringValue } from '../data/rules'
import { type BaseRecord, type FieldDefinition, type RecordValue, getRecordTitle } from '../data/workbase'

type CommunitiesScreenProps = {
  addCommunityLink: () => void
  atRiskCommunityRecords: BaseRecord[]
  base: StoredWorkbaseState['base']
  communityDetailBlockers: BaseRecord[]
  communityDetailMeetings: BaseRecord[]
  communityDetailNextAction: BaseRecord | undefined
  communityDetailRecord: BaseRecord | undefined
  communityDetailRecords: BaseRecord[]
  communityDetailWaiting: BaseRecord[]
  communityLinkableRecords: BaseRecord[]
  communityLinkRecordId: string
  communityNewLinkDate: string
  communityNewLinkDateField: FieldDefinition | null | undefined
  communityNewLinkExtraFields: FieldDefinition[]
  communityNewLinkExtraValues: Record<string, string>
  communityNewLinkStatus: string
  communityNewLinkStatusField: FieldDefinition | null | undefined
  communityNewLinkTableId: string
  communityNewLinkTitle: string
  communityRecords: BaseRecord[]
  createCommunityLinkedRecord: () => void
  getCommunityLinkField: (record: BaseRecord) => FieldDefinition | undefined
  getCommunityLinkedRowExtraSummary: (record: BaseRecord) => string
  getPickerRecordMeta: (record: BaseRecord) => string
  onOpenCommunitySourceRoute: (communityRecord: BaseRecord, tableId: string, label: string) => void
  onOpenDailyRecord: (record: BaseRecord) => void
  onSelectCommunityDetail: (recordId: string) => void
  onUpdateRecordField: (recordId: string, fieldId: string, value: RecordValue) => void
  removeCommunityLink: (record: BaseRecord) => void
  setCommunityLinkRecordId: (recordId: string) => void
  setCommunityNewLinkDate: (date: string) => void
  setCommunityNewLinkExtraValues: Dispatch<SetStateAction<Record<string, string>>>
  setCommunityNewLinkStatus: (status: string) => void
  setCommunityNewLinkTableId: (tableId: string) => void
  setCommunityNewLinkTitle: (title: string) => void
  timelineSourceRecords: BaseRecord[]
}

export function CommunitiesScreen({
  addCommunityLink,
  atRiskCommunityRecords,
  base,
  communityDetailBlockers,
  communityDetailMeetings,
  communityDetailNextAction,
  communityDetailRecord,
  communityDetailRecords,
  communityDetailWaiting,
  communityLinkableRecords,
  communityLinkRecordId,
  communityNewLinkDate,
  communityNewLinkDateField,
  communityNewLinkExtraFields,
  communityNewLinkExtraValues,
  communityNewLinkStatus,
  communityNewLinkStatusField,
  communityNewLinkTableId,
  communityNewLinkTitle,
  communityRecords,
  createCommunityLinkedRecord,
  getCommunityLinkField,
  getCommunityLinkedRowExtraSummary,
  getPickerRecordMeta,
  onOpenCommunitySourceRoute,
  onOpenDailyRecord,
  onSelectCommunityDetail,
  onUpdateRecordField,
  removeCommunityLink,
  setCommunityLinkRecordId,
  setCommunityNewLinkDate,
  setCommunityNewLinkExtraValues,
  setCommunityNewLinkStatus,
  setCommunityNewLinkTableId,
  setCommunityNewLinkTitle,
  timelineSourceRecords,
}: CommunitiesScreenProps) {
  return (
    <section className="screen-grid" id="communities">
      <article className="screen-panel wide">
        <div className="panel-title compact">
          <div>
            <span className="eyebrow">Communities</span>
            <h2>Communities are the command center.</h2>
          </div>
          <span className="metric-pill">{communityRecords.length} records</span>
        </div>
        <p className="panel-lede">Each place gathers pasted rows, readiness fields, missing info, waiting items, meeting prep, and date pressure.</p>
        <div className="community-command-grid">
          {communityRecords.map((record) => {
            const readiness = getNumberValue(record, 'readiness')
            const status = getStringValue(record, 'status')
            const linkedRecords = timelineSourceRecords.filter((sourceRecord) =>
              sourceRecord.id !== record.id && base.fields.some((field) => {
                const value = sourceRecord.values[field.id]

                return field.type === 'linkedRecord' && Array.isArray(value) && value.includes(record.id)
              }),
            )
            const blockerCount = linkedRecords.filter((linkedRecord) =>
              ['Blocked', 'High'].includes(getStringValue(linkedRecord, 'status') || getStringValue(linkedRecord, 'level')),
            ).length
            const waitingCount = linkedRecords.filter((linkedRecord) =>
              getStringValue(linkedRecord, 'status') === 'Waiting' || linkedRecord.tableId === 'followups',
            ).length
            const meetingCount = linkedRecords.filter((linkedRecord) => linkedRecord.tableId === 'meetings').length
            const nextAction = linkedRecords.find((linkedRecord) =>
              getStringValue(linkedRecord, 'status') === 'Blocked' || getStringValue(linkedRecord, 'level') === 'High',
            ) || linkedRecords[0]

            return (
              <button
                className={`work-record-card community-command-card ${communityDetailRecord?.id === record.id ? 'selected-community-card' : ''}`}
                key={record.id}
                type="button"
                onClick={() => onSelectCommunityDetail(record.id)}
              >
                <span>{status || 'No status'} · {getStringValue(record, 'eventDate') || 'No date set'}</span>
                <strong>{getRecordTitle(base, record)}</strong>
                <i aria-hidden="true"><b style={{ width: `${Math.max(8, readiness)}%` }} /></i>
                <div className="community-command-card-metrics">
                  <small><b>{readiness}%</b> ready</small>
                  <small><b>{blockerCount}</b> blockers</small>
                  <small><b>{waitingCount}</b> waiting</small>
                  <small><b>{meetingCount}</b> meetings</small>
                </div>
                <em>{nextAction ? `Next action. ${getRecordTitle(base, nextAction)}.` : 'Next action. Add the first linked row.'}</em>
              </button>
            )
          })}
        </div>
        {communityDetailRecord && (
          <section className="community-place-detail" data-testid="community-place-detail">
            <div className="community-place-head">
              <div>
                <span className="eyebrow">Place detail</span>
                <h3>{getRecordTitle(base, communityDetailRecord)}</h3>
                <p>{getStringValue(communityDetailRecord, 'status') || 'No status'}. Event date {getStringValue(communityDetailRecord, 'eventDate') || 'not set'}.</p>
              </div>
              <button type="button" onClick={() => onOpenDailyRecord(communityDetailRecord)}>Open record</button>
            </div>
            <div className="community-place-edit" aria-label="Place quick edit">
              <label>
                <span>Status</span>
                <select
                  value={getStringValue(communityDetailRecord, 'status')}
                  onChange={(event) => onUpdateRecordField(communityDetailRecord.id, 'status', event.target.value)}
                >
                  <option value="">No status</option>
                  <option value="On track">On track</option>
                  <option value="At risk">At risk</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Prep">Prep</option>
                </select>
              </label>
              <label>
                <span>Event date</span>
                <input
                  type="date"
                  value={getStringValue(communityDetailRecord, 'eventDate')}
                  onChange={(event) => onUpdateRecordField(communityDetailRecord.id, 'eventDate', event.target.value)}
                />
              </label>
              <label>
                <span>Readiness</span>
                <input
                  max="100"
                  min="0"
                  type="number"
                  value={getNumberValue(communityDetailRecord, 'readiness')}
                  onChange={(event) => onUpdateRecordField(communityDetailRecord.id, 'readiness', Number(event.target.value))}
                />
              </label>
            </div>
            <div className="community-place-metrics">
              <article>
                <span>Readiness</span>
                <strong>{getNumberValue(communityDetailRecord, 'readiness')}%</strong>
              </article>
              <article>
                <span>Blockers</span>
                <strong>{communityDetailBlockers.length}</strong>
              </article>
              <article>
                <span>Waiting</span>
                <strong>{communityDetailWaiting.length}</strong>
              </article>
              <article>
                <span>Meetings</span>
                <strong>{communityDetailMeetings.length}</strong>
              </article>
            </div>
            <div className="community-route-strip" aria-label="Community routes">
              <span>Routes</span>
              <div>
                <button type="button" onClick={() => onOpenCommunitySourceRoute(communityDetailRecord, 'tasks', 'Work')}>
                  Work
                </button>
                <button type="button" onClick={() => onOpenCommunitySourceRoute(communityDetailRecord, 'followups', 'Waiting')}>
                  Waiting
                </button>
                <button type="button" onClick={() => onOpenCommunitySourceRoute(communityDetailRecord, 'meetings', 'Meetings')}>
                  Meetings
                </button>
              </div>
            </div>
            <div className="community-place-work">
              <article>
                <span>Next action</span>
                {communityDetailNextAction ? (
                  <button type="button" onClick={() => onOpenDailyRecord(communityDetailNextAction)}>
                    <strong>{getRecordTitle(base, communityDetailNextAction)}</strong>
                    <small>{getPickerRecordMeta(communityDetailNextAction)}</small>
                  </button>
                ) : (
                  <p className="empty-line">Add linked work, waiting, risk, or meeting rows.</p>
                )}
              </article>
              <article>
                <span>Linked rows</span>
                <div className="community-link-row-actions">
                  <label>
                    <span>Add linked row</span>
                    <select value={communityLinkRecordId} onChange={(event) => setCommunityLinkRecordId(event.target.value)}>
                      <option value="">Choose row</option>
                      {communityLinkableRecords.map((record) => (
                        <option key={record.id} value={record.id}>
                          {getRecordTitle(base, record)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button disabled={!communityLinkRecordId} type="button" onClick={addCommunityLink}>Add</button>
                </div>
                <div className="community-link-row-actions">
                  <label>
                    <span>New linked row</span>
                    <select
                      value={communityNewLinkTableId}
                      onChange={(event) => {
                        setCommunityNewLinkTableId(event.target.value)
                        setCommunityNewLinkStatus('')
                        setCommunityNewLinkDate('')
                        setCommunityNewLinkExtraValues({})
                      }}
                    >
                      {base.tables
                        .filter((table) => table.id !== 'communities' && base.fields.some((field) => field.tableId === table.id && field.type === 'linkedRecord' && field.linkedTableId === 'communities'))
                        .map((table) => (
                          <option key={table.id} value={table.id}>{table.label}</option>
                        ))}
                    </select>
                  </label>
                  <label>
                    <span>Title</span>
                    <input
                      value={communityNewLinkTitle}
                      onChange={(event) => setCommunityNewLinkTitle(event.target.value)}
                      placeholder="Name the row"
                    />
                  </label>
                  {communityNewLinkStatusField?.options && (
                    <label>
                      <span>{communityNewLinkStatusField.label}</span>
                      <select value={communityNewLinkStatus} onChange={(event) => setCommunityNewLinkStatus(event.target.value)}>
                        <option value="">Default</option>
                        {communityNewLinkStatusField.options.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  {communityNewLinkDateField && (
                    <label>
                      <span>{communityNewLinkDateField.label}</span>
                      <input type="date" value={communityNewLinkDate} onChange={(event) => setCommunityNewLinkDate(event.target.value)} />
                    </label>
                  )}
                  {communityNewLinkExtraFields.map((field) => (
                    <label key={field.id}>
                      <span>{field.label}</span>
                      {field.type === 'singleSelect' && field.options ? (
                        <select
                          value={communityNewLinkExtraValues[field.id] || ''}
                          onChange={(event) => setCommunityNewLinkExtraValues((current) => ({ ...current, [field.id]: event.target.value }))}
                        >
                          <option value="">Default</option>
                          {field.options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={['number', 'currency', 'percent', 'rating'].includes(field.type) ? 'number' : 'text'}
                          value={communityNewLinkExtraValues[field.id] || ''}
                          onChange={(event) => setCommunityNewLinkExtraValues((current) => ({ ...current, [field.id]: event.target.value }))}
                          placeholder={field.type === 'multiSelect' ? 'Comma separated' : field.label}
                        />
                      )}
                    </label>
                  ))}
                  <button disabled={!communityNewLinkTitle.trim()} type="button" onClick={createCommunityLinkedRecord}>Create</button>
                </div>
                <div>
                  {communityDetailRecords.slice(0, 5).map((linkedRecord) => {
                    const editableStatusField = base.fields.find((field) =>
                      field.tableId === linkedRecord.tableId &&
                      ['status', 'level'].includes(field.id) &&
                      (field.type === 'singleSelect' || field.type === 'status'),
                    )

                    return (
                      <div className="community-linked-row" key={linkedRecord.id}>
                        <button type="button" onClick={() => onOpenDailyRecord(linkedRecord)}>
                          <strong>{getRecordTitle(base, linkedRecord)}</strong>
                          <small>{getPickerRecordMeta(linkedRecord)}</small>
                          {getCommunityLinkedRowExtraSummary(linkedRecord) && (
                            <small>{getCommunityLinkedRowExtraSummary(linkedRecord)}</small>
                          )}
                        </button>
                        {editableStatusField?.options && (
                          <label>
                            <span>{editableStatusField.label}</span>
                            <select
                              value={getStringValue(linkedRecord, editableStatusField.id)}
                              onChange={(event) => onUpdateRecordField(linkedRecord.id, editableStatusField.id, event.target.value)}
                            >
                              <option value="">None</option>
                              {editableStatusField.options.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </label>
                        )}
                        {getCommunityLinkField(linkedRecord) && (
                          <button className="ghost" type="button" onClick={() => removeCommunityLink(linkedRecord)}>
                            Remove
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {communityDetailRecords.length === 0 && <p className="empty-line">No linked rows yet.</p>}
                </div>
              </article>
            </div>
          </section>
        )}
      </article>

      <article className="screen-panel">
        <div className="panel-title compact">
          <div>
            <span className="eyebrow">At risk</span>
            <h2>Watch these first.</h2>
          </div>
          <span className="metric-pill">{atRiskCommunityRecords.length}</span>
        </div>
        <div className="record-list">
          {atRiskCommunityRecords.map((record) => (
            <article key={record.id}>
              <span>{getStringValue(record, 'status') || 'No status'}</span>
              <strong>{getRecordTitle(base, record)}</strong>
              <small>{getNumberValue(record, 'readiness')}% ready.</small>
            </article>
          ))}
        </div>
      </article>
    </section>
  )
}
