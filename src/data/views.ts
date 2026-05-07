import {
  type BaseRecord,
  type Workbase,
  getMaterializedLinks,
  getRecordContext,
  getRecordTitle,
  getRecordsForTable,
} from './workbase'
import {
  type LocalGridView,
} from './localStorage'
import {
  type LocalRule,
  getFirstDateValue,
  getNumberValue,
  getRuleMatchCount,
  getRuleValidationMessages,
  getStringValue,
  ruleDestinationOptions,
  ruleMatchesRecord,
  sortRecordsByDate,
} from './rules'

const buildTableOrder = ['risks', 'tasks', 'followups', 'approvals', 'meetings', 'people']

export type RuleMatch = {
  rule: LocalRule
  record: BaseRecord
}

export function getLocalTableRows(base: Workbase) {
  return base.tables.map((table) => ({
    ...table,
    recordCount: getRecordsForTable(base, table.id).length,
    fieldCount: base.fields.filter((field) => field.tableId === table.id).length,
  }))
}

export function getBuildTableRows(base: Workbase) {
  return getLocalTableRows(base)
    .filter((table) => table.id !== 'communities')
    .sort((firstTable, secondTable) => {
      const firstIndex = buildTableOrder.includes(firstTable.id) ? buildTableOrder.indexOf(firstTable.id) : buildTableOrder.length
      const secondIndex = buildTableOrder.includes(secondTable.id) ? buildTableOrder.indexOf(secondTable.id) : buildTableOrder.length

      return firstIndex - secondIndex
    })
}

export function getWorkRecordGroups(base: Workbase) {
  const taskRecords = getRecordsForTable(base, 'tasks')
  const approvalRecords = getRecordsForTable(base, 'approvals')
  const riskRecords = getRecordsForTable(base, 'risks')
  const followupRecords = getRecordsForTable(base, 'followups')
  const meetingRecords = getRecordsForTable(base, 'meetings')
  const communityRecords = getRecordsForTable(base, 'communities')
  const openTaskRecords = taskRecords.filter((record) => getStringValue(record, 'status') !== 'Done')
  const blockedTaskRecords = taskRecords.filter((record) => getStringValue(record, 'status') === 'Blocked')
  const waitingTaskRecords = taskRecords.filter((record) => getStringValue(record, 'status') === 'Waiting')
  const waitingFollowupRecords = followupRecords.filter((record) => getStringValue(record, 'status') === 'Waiting')
  const openApprovalRecords = approvalRecords.filter((record) => !['Received', 'Not needed'].includes(getStringValue(record, 'status')))
  const highRiskRecords = riskRecords.filter((record) => getStringValue(record, 'level') === 'High')
  const atRiskCommunityRecords = communityRecords.filter((record) => {
    const status = getStringValue(record, 'status')

    return status === 'At risk' || status === 'Blocked' || getNumberValue(record, 'readiness') < 70
  })

  return {
    taskRecords,
    approvalRecords,
    riskRecords,
    followupRecords,
    meetingRecords,
    communityRecords,
    openTaskRecords,
    blockedTaskRecords,
    waitingTaskRecords,
    waitingFollowupRecords,
    openApprovalRecords,
    highRiskRecords,
    atRiskCommunityRecords,
  }
}

export function getTimelineSourceRecords(base: Workbase) {
  const {
    communityRecords,
    taskRecords,
    approvalRecords,
    followupRecords,
    meetingRecords,
    riskRecords,
  } = getWorkRecordGroups(base)

  return [
    ...communityRecords,
    ...taskRecords,
    ...approvalRecords,
    ...followupRecords,
    ...meetingRecords,
    ...riskRecords,
  ]
}

export function getTimelineStatusOptions(records: BaseRecord[]) {
  return Array.from(
    new Set(
      records
        .map((record) => getStringValue(record, 'status') || getStringValue(record, 'level') || getStringValue(record, 'priority'))
        .filter(Boolean),
    ),
  ).sort()
}

export function getTimelineRecords(
  base: Workbase,
  records: BaseRecord[],
  tableId: string,
  status: string,
  search: string,
) {
  const filter = search.trim().toLowerCase()

  return records
    .filter((record) => {
      const table = base.tables.find((tableItem) => tableItem.id === record.tableId)
      const recordStatus = getStringValue(record, 'status') || getStringValue(record, 'level') || getStringValue(record, 'priority')

      if (tableId !== 'all' && record.tableId !== tableId) {
        return false
      }

      if (status !== 'all' && recordStatus !== status) {
        return false
      }

      if (!filter) {
        return true
      }

      return [table?.label || record.tableId, getRecordTitle(base, record), getRecordContext(record), recordStatus]
        .join(' ')
        .toLowerCase()
        .includes(filter)
    })
    .sort((firstRecord, secondRecord) => {
      const firstDate = getFirstDateValue(firstRecord) || '9999-12-31'
      const secondDate = getFirstDateValue(secondRecord) || '9999-12-31'

      return firstDate.localeCompare(secondDate) || getRecordTitle(base, firstRecord).localeCompare(getRecordTitle(base, secondRecord))
    })
}

export function getRuleMatchesForDestination(base: Workbase, rules: LocalRule[], destination: string, todayDate: string): RuleMatch[] {
  return rules
    .filter((rule) => rule.destination === destination)
    .flatMap((rule) =>
      base.records
        .filter((record) => ruleMatchesRecord(base, rule, record, todayDate))
        .map((record) => ({
          rule,
          record,
        })),
    )
}

export function getTodayLanes(base: Workbase, todayRuleMatches: RuleMatch[]) {
  const {
    blockedTaskRecords,
    highRiskRecords,
    waitingFollowupRecords,
    waitingTaskRecords,
    openApprovalRecords,
    meetingRecords,
    openTaskRecords,
  } = getWorkRecordGroups(base)
  const todayRuleRecords = Array.from(new Map(todayRuleMatches.map((match) => [match.record.id, match.record])).values())

  return [
    {
      id: 'now',
      label: 'Now',
      title: 'Move the work that can burn the day.',
      records: [...blockedTaskRecords, ...highRiskRecords].slice(0, 4),
    },
    {
      id: 'waiting',
      label: 'Waiting',
      title: 'Hold every open loop that depends on someone else.',
      records: [...waitingFollowupRecords, ...waitingTaskRecords, ...openApprovalRecords].slice(0, 4),
    },
    {
      id: 'next',
      label: 'Next',
      title: 'Pull work forward before it becomes urgent.',
      records: sortRecordsByDate([...meetingRecords, ...openTaskRecords]).slice(0, 4),
    },
    {
      id: 'rules',
      label: 'Rules',
      title: 'Records matched by local Rules.',
      records: todayRuleRecords.slice(0, 4),
    },
  ]
}

export function getScreenStats(base: Workbase) {
  const {
    communityRecords,
    atRiskCommunityRecords,
    openTaskRecords,
    blockedTaskRecords,
    waitingFollowupRecords,
    openApprovalRecords,
    riskRecords,
    highRiskRecords,
  } = getWorkRecordGroups(base)

  return [
    { label: 'Communities', value: communityRecords.length, detail: `${atRiskCommunityRecords.length} need attention` },
    { label: 'Open tasks', value: openTaskRecords.length, detail: `${blockedTaskRecords.length} blocked` },
    { label: 'Waiting loops', value: waitingFollowupRecords.length, detail: `${openApprovalRecords.length} open approvals` },
    { label: 'Risks', value: riskRecords.length, detail: `${highRiskRecords.length} high` },
  ]
}

export function getDailyTimelineRecords(base: Workbase) {
  const {
    communityRecords,
    openTaskRecords,
    waitingFollowupRecords,
    meetingRecords,
  } = getWorkRecordGroups(base)

  return sortRecordsByDate([
    ...communityRecords,
    ...openTaskRecords,
    ...waitingFollowupRecords,
    ...meetingRecords,
  ])
}

export function getLocalEngineStats(base: Workbase, rules: LocalRule[], localGridViews: LocalGridView[]) {
  return [
    { label: 'Tables', value: base.tables.length },
    { label: 'Fields', value: base.fields.length },
    { label: 'Records', value: base.records.length },
    { label: 'Links', value: getMaterializedLinks(base).length },
    { label: 'Dependencies', value: base.dependencies.length },
    { label: 'Rules', value: rules.length },
    { label: 'Invalid Rules', value: rules.filter((rule) => getRuleValidationMessages(base, rule).length > 0).length },
    { label: 'Saved views', value: localGridViews.length },
  ]
}

export function getRuleDestinationStats(base: Workbase, rules: LocalRule[], todayDate: string) {
  return ruleDestinationOptions.map((destination) => {
    const destinationRules = rules.filter((rule) => rule.destination === destination.value)
    const matchCount = destinationRules.reduce((count, rule) => count + getRuleMatchCount(base, rule, todayDate), 0)

    return {
      label: destination.label,
      rules: destinationRules.length,
      matches: matchCount,
    }
  })
}
