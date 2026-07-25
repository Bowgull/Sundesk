import { getFirstDateValue, getStringValue } from '../data/rules'
import type { BaseRecord, FieldDefinition, Workbase } from '../data/workbase'
import { getRecordContext, getRecordTitle } from '../data/workbase'

type WaitingOnScreenProps = {
  base: Workbase
  followupRecords: BaseRecord[]
  followupCommunityField: FieldDefinition | undefined
  getFieldDisplayValue: (record: BaseRecord, field: FieldDefinition) => string
  onCreateFollowup: () => void
  onOpenBuild: () => void
  onOpenRecord: (record: BaseRecord) => void
}

export function WaitingOnScreen({
  base,
  followupCommunityField,
  followupRecords,
  getFieldDisplayValue,
  onCreateFollowup,
  onOpenRecord,
}: WaitingOnScreenProps) {
  const waitingRows = followupRecords.map((record) => {
    const community = followupCommunityField ? getFieldDisplayValue(record, followupCommunityField) : 'No community'
    const owner = getStringValue(record, 'owner') || getStringValue(record, 'source') || 'Owner missing'
    const date = getStringValue(record, 'dueDate') || getFirstDateValue(record) || 'Today'
    const context = getRecordContext(record)

    return {
      community,
      context,
      date,
      owner,
      record,
      title: getRecordTitle(base, record),
    }
  })

  return (
    <section className="screen-grid waiting-on-screen" id="followups">
      <article className="screen-panel wide">
        <div className="panel-title compact">
          <div>
            <span className="eyebrow">Waiting On</span>
            <h2>Waiting On is the chase list.</h2>
          </div>
          <span className="metric-pill">{waitingRows.length} waiting</span>
          <button className="primary" type="button" onClick={onCreateFollowup}>Add waiting item</button>
        </div>
        <p className="panel-lede">Who owes it. How long it has been sitting. Why it blocks the work.</p>
        <div className="waiting-table">
          <div className="waiting-row waiting-head">
            <span>Community</span>
            <span>Who owes it</span>
            <span>Item</span>
            <span>How long</span>
            <span>Why it matters</span>
          </div>
          {waitingRows.map((row) => (
            <button className="waiting-row" key={row.record.id} type="button" onClick={() => onOpenRecord(row.record)}>
              <span>{row.community}</span>
              <span>{row.owner}</span>
              <strong>{row.title}</strong>
              <span>{row.date}</span>
              <small>{row.context}</small>
            </button>
          ))}
        </div>
      </article>
    </section>
  )
}
