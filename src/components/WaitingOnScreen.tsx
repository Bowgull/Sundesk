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
  onOpenBuild,
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
    <section className="screen-grid" id="followups">
      <article className="screen-panel wide">
        <div className="panel-title compact">
          <div>
            <span className="eyebrow">Waiting On</span>
            <h2>Who owes the next move.</h2>
          </div>
          <span className="metric-pill">{waitingRows.length} waiting</span>
          <button className="primary" type="button" onClick={onCreateFollowup}>Log next touch</button>
        </div>
        <p className="panel-lede">Operational answer first. Open the row when the receipt matters.</p>
        <div className="waiting-table">
          <div className="waiting-row waiting-head">
            <span>Community</span>
            <span>Waiting on</span>
            <span>Item</span>
            <span>Age</span>
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

      <article className="screen-panel">
        <div className="panel-title compact">
          <div>
            <span className="eyebrow">Receipts</span>
            <h2>Manual logic.</h2>
          </div>
          <button type="button" onClick={onOpenBuild}>Adjust rule</button>
        </div>
        <div className="rules">
          <p><span>Read</span> Community, owner, item, date. <span>Then</span> pick the next touch.</p>
          <p><span>When</span> a row is waiting. <span>Do</span> show who owes the next move.</p>
          <p><span>When</span> waiting blocks readiness. <span>Do</span> surface it in Today.</p>
        </div>
      </article>
    </section>
  )
}
