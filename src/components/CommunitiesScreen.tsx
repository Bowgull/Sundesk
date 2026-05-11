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
  base,
  communityDetailRecord,
  communityRecords,
  onOpenCommunitySourceRoute,
  onOpenDailyRecord,
  onSelectCommunityDetail,
  timelineSourceRecords,
}: CommunitiesScreenProps) {
  const getReadinessBand = (readiness: number) => {
    if (readiness < 65) return 'Stalled'
    if (readiness < 75) return 'Waiting'
    if (readiness < 86) return 'Moving'

    return 'Ready check'
  }

  const getReadinessReason = (status: string, primaryIssue: string) => {
    if (status === 'At risk' || status === 'Blocked') return `${primaryIssue} is holding readiness.`
    if (status === 'Waiting') return 'Waiting on reply before readiness can move.'
    if (status === 'Prep') return `${primaryIssue} is ready for meeting prep.`
    if (status === 'On track') return `${primaryIssue} is in hand.`

    return `${primaryIssue} is the current read.`
  }

  const getVelocityLabel = (status: string) => {
    if (status === 'At risk' || status === 'Blocked') return 'No movement'
    if (status === 'Waiting') return 'Waiting on reply'
    if (status === 'Prep') return 'Moving into prep'
    if (status === 'On track') return 'Holding'

    return 'Needs read'
  }

  const getSelectedSummary = (
    readiness: number,
    blockerCount: number,
    waitingCount: number,
    meetingCount: number,
  ) => {
    const parts = [`${readiness}% ready`]

    if (blockerCount > 0) parts.push(`${blockerCount} blocker${blockerCount === 1 ? '' : 's'}`)
    if (waitingCount > 0) parts.push(`${waitingCount} waiting`)
    if (meetingCount > 0) parts.push(`${meetingCount} meeting note${meetingCount === 1 ? '' : 's'}`)
    if (parts.length === 1) parts.push('No fire items')

    return parts.join('. ')
  }

  const getCommunityLinkedRecords = (record: BaseRecord) =>
    timelineSourceRecords.filter((sourceRecord) =>
      sourceRecord.id !== record.id && base.fields.some((field) => {
        const value = sourceRecord.values[field.id]

        return field.type === 'linkedRecord' && Array.isArray(value) && value.includes(record.id)
      }),
    )

  const getCommunityTone = (record: BaseRecord) => {
    const status = getStringValue(record, 'status').toLowerCase()

    if (status.includes('risk') || status.includes('blocked')) return 'risk'
    if (status.includes('waiting')) return 'waiting'
    if (status.includes('prep')) return 'prep'
    if (status.includes('track')) return 'track'

    return 'neutral'
  }

  const getPrimaryIssue = (record: BaseRecord, linkedRecords: BaseRecord[]) => {
    const status = getStringValue(record, 'status')
    const missingApproval = linkedRecords.find((linkedRecord) =>
      linkedRecord.tableId === 'approvals' && getStringValue(linkedRecord, 'status') === 'Missing',
    )
    const blocker = linkedRecords.find((linkedRecord) =>
      ['Missing', 'Blocked', 'High'].includes(getStringValue(linkedRecord, 'status') || getStringValue(linkedRecord, 'level')),
    )
    const waiting = linkedRecords.find((linkedRecord) =>
      getStringValue(linkedRecord, 'status') === 'Waiting' || linkedRecord.tableId === 'followups',
    )
    const meeting = linkedRecords.find((linkedRecord) => linkedRecord.tableId === 'meetings')
    const received = linkedRecords.find((linkedRecord) => getStringValue(linkedRecord, 'status') === 'Received')

    if (status === 'Prep' && meeting) return 'Agenda ready'
    if (status === 'On track' && received) return getRecordTitle(base, received)

    return getRecordTitle(base, missingApproval || blocker || waiting || linkedRecords[0] || record)
  }

  const selectedCommunityRecord = communityDetailRecord || communityRecords[0]

  return (
    <section className="communities-deck-screen" id="communities">
      <article className="communities-deck-board">
        <div className="communities-deck-header">
          <div>
            <span>Communities · Fyre Festival GTA</span>
            <h2>Communities are the command center.</h2>
            <p>Scan every place. Open the one that needs attention. The selected card shows what is stuck, waiting, or ready for prep.</p>
          </div>
        </div>

        <div className="community-command-grid" data-testid="community-command-board">
          {communityRecords.map((record) => {
            const readiness = getNumberValue(record, 'readiness')
            const status = getStringValue(record, 'status')
            const linkedRecords = getCommunityLinkedRecords(record)
            const blockerCount = linkedRecords.filter((linkedRecord) =>
              ['Blocked', 'Missing', 'High'].includes(getStringValue(linkedRecord, 'status') || getStringValue(linkedRecord, 'level')),
            ).length
            const waitingCount = linkedRecords.filter((linkedRecord) =>
              getStringValue(linkedRecord, 'status') === 'Waiting' || linkedRecord.tableId === 'followups',
            ).length
            const meetingCount = linkedRecords.filter((linkedRecord) => linkedRecord.tableId === 'meetings').length
            const nextAction = linkedRecords.find((linkedRecord) =>
              getStringValue(linkedRecord, 'status') === 'Blocked' || getStringValue(linkedRecord, 'level') === 'High',
            ) || linkedRecords[0]
            const tone = getCommunityTone(record)
            const isSelected = selectedCommunityRecord?.id === record.id
            const primaryIssue = getPrimaryIssue(record, linkedRecords)
            const readinessBand = getReadinessBand(readiness)
            const velocityLabel = getVelocityLabel(status)
            const readinessReason = getReadinessReason(status, primaryIssue)
            const selectedSummary = getSelectedSummary(readiness, blockerCount, waitingCount, meetingCount)

            return (
              <article
                className={`community-command-card community-tone-${tone} ${isSelected ? 'selected-community-card' : ''}`}
                key={record.id}
              >
                <button className="community-card-select" type="button" onClick={() => onSelectCommunityDetail(record.id)}>
                  <span className="community-chip-row">
                    <span>{readiness}% ready</span>
                    <span>
                      {blockerCount > 0 ? `${blockerCount} blockers` : waitingCount > 0 ? `${waitingCount} waiting` : meetingCount > 0 ? 'meeting prep' : status || 'on track'}
                    </span>
                  </span>
                  <strong className="community-card-title">{getRecordTitle(base, record)}</strong>
                  <span className="community-readiness-meter" aria-label={`${getRecordTitle(base, record)} readiness ${readiness}%`}>
                    <span className="community-readiness-meta">
                      <strong>{readinessBand}</strong>
                      <small>{velocityLabel}</small>
                    </span>
                    <i aria-hidden="true" className="community-readiness-bar">
                      <b style={{ width: `${Math.max(8, readiness)}%` }} />
                      <em style={{ left: '50%' }} />
                      <em style={{ left: '75%' }} />
                      <em style={{ left: '90%' }} />
                    </i>
                    <span className="community-readiness-scale" aria-hidden="true">
                      <small>50</small>
                      <small>75</small>
                      <small>90</small>
                    </span>
                  </span>
                  <span className="community-local-block">
                    <strong>{primaryIssue}</strong>
                    <small>{status === 'On track' ? 'No fire items' : status === 'Prep' ? `${meetingCount || 1} action items` : status === 'Waiting' ? 'Vendor replies pending' : 'Venue readiness waiting'}</small>
                  </span>
                  <span className="community-next-block">
                    <strong>Next chase</strong>
                    <small>{nextAction ? getRecordTitle(base, nextAction) : 'Add related work.'}</small>
                  </span>
                  {isSelected && (
                    <span className="community-selected-state" data-testid="community-place-detail">
                      <span>What needs attention</span>
                      <strong>{getRecordTitle(base, record)}</strong>
                      <small>{selectedSummary}.</small>
                      <small>{readinessReason}</small>
                      <small>{linkedRecords.slice(0, 2).map((linkedRecord) => getRecordTitle(base, linkedRecord)).join(' · ') || 'No linked rows yet.'}</small>
                    </span>
                  )}
                </button>
                {isSelected && (
                  <div className="community-card-actions" aria-label="Community routes">
                    <button type="button" onClick={() => onOpenDailyRecord(record)}>Open community</button>
                    <button type="button" onClick={() => onOpenCommunitySourceRoute(record, 'followups', 'Waiting')}>See waiting</button>
                    <button type="button" onClick={() => onOpenCommunitySourceRoute(record, 'meetings', 'Meetings')}>Prep meeting</button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </article>
    </section>
  )
}
