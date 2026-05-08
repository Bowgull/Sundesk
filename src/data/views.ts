import {
  type BaseRecord,
  type FieldDefinition,
  type Workbase,
  getMaterializedLinks,
  getRecord,
  getRecordContext,
  getRecordTitle,
  getRecordsForTable,
} from './workbase'
import {
  type LocalGridView,
  getDefaultVisibleFieldIds,
} from './localStorage'
import {
  type LocalRule,
  getFieldDisplayValue,
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

export type BuildGridGroup = {
  label: string
  records: BaseRecord[]
}

export type BuildGridDerivation = {
  fieldsForSelectedTable: FieldDefinition[]
  visibleFieldIds: string[]
  visibleFieldsForGrid: FieldDefinition[]
  recordsForSelectedTable: BaseRecord[]
  sortedAndFilteredRecords: BaseRecord[]
  groupField?: FieldDefinition
  groupedRecords: BuildGridGroup[]
}

export type MeetingPrepItem = {
  id: string
  label: string
  records: BaseRecord[]
}

export type MeetingAgendaItem = {
  id: string
  title: string
  detail: string
  recordIds: string[]
}

export type MeetingPrep = {
  meeting: BaseRecord
  communities: BaseRecord[]
  linkedTasks: BaseRecord[]
  blockedItems: BaseRecord[]
  overdueFollowups: BaseRecord[]
  unresolvedApprovals: BaseRecord[]
  risks: BaseRecord[]
  nextSteps: BaseRecord[]
  sections: MeetingPrepItem[]
  agenda: MeetingAgendaItem[]
}

function getUniqueAgendaSourceRecords(base: Workbase, prep: MeetingPrep) {
  const sourceRecordIds = new Set(prep.agenda.flatMap((item) => item.recordIds))

  return Array.from(sourceRecordIds).flatMap((recordId) => {
    const record = getRecord(base, recordId)

    return record ? [record] : []
  })
}

function asSentence(value: string) {
  return /[.!?]$/.test(value) ? value : `${value}.`
}

export function getMeetingAgendaText(base: Workbase, prep: MeetingPrep) {
  const lines = [
    getRecordTitle(base, prep.meeting),
    'Computed agenda. Not saved.',
    '',
    ...prep.agenda.flatMap((item, index) => {
      const sourceRecords = item.recordIds.flatMap((recordId) => {
        const record = getRecord(base, recordId)

        return record ? [getRecordTitle(base, record)] : []
      })

      return [
        `${index + 1}. ${item.title}`,
        item.detail,
        sourceRecords.length > 0 ? `Source records: ${sourceRecords.join(', ')}.` : 'Source records: none.',
        '',
      ]
    }),
  ]

  return lines.join('\n').trim()
}

export function getMeetingDigestPreview(base: Workbase, prep: MeetingPrep) {
  const sourceRecords = getUniqueAgendaSourceRecords(base, prep)

  return [
    'Daily digest preview.',
    `Meeting: ${asSentence(getRecordTitle(base, prep.meeting))}`,
    `Agenda items: ${prep.agenda.length}. Source records: ${sourceRecords.length}.`,
    '',
    ...prep.agenda.map((item, index) => `${index + 1}. ${asSentence(item.title)} ${asSentence(item.detail)}`),
  ].join('\n')
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

export function getBuildGridDerivation(
  base: Workbase,
  tableId: string,
  visibleFieldIdsByTable: Record<string, string[]>,
  filterValue: string,
  sortFieldId: string,
  sortDirection: 'asc' | 'desc',
  groupFieldId: string,
): BuildGridDerivation {
  const fieldsForSelectedTable = base.fields.filter((field) => field.tableId === tableId)
  const visibleFieldIds = visibleFieldIdsByTable[tableId] || getDefaultVisibleFieldIds(fieldsForSelectedTable)
  const visibleFieldsForGrid = fieldsForSelectedTable.filter((field) => visibleFieldIds.includes(field.id))
  const recordsForSelectedTable = getRecordsForTable(base, tableId)
  const filter = filterValue.trim().toLowerCase()
  const sortedAndFilteredRecords = recordsForSelectedTable
    .filter((record) => {
      if (!filter) {
        return true
      }

      return fieldsForSelectedTable.some((field) => getFieldDisplayValue(base, record, field).toLowerCase().includes(filter))
    })
    .sort((firstRecord, secondRecord) => {
      if (!sortFieldId) {
        return 0
      }

      const field = fieldsForSelectedTable.find((fieldItem) => fieldItem.id === sortFieldId)

      if (!field) {
        return 0
      }

      const comparison = getFieldDisplayValue(base, firstRecord, field).localeCompare(getFieldDisplayValue(base, secondRecord, field), undefined, {
        numeric: true,
        sensitivity: 'base',
      })

      return sortDirection === 'desc' ? comparison * -1 : comparison
    })
  const groupField = fieldsForSelectedTable.find((field) => field.id === groupFieldId)
  const groupedRecords = groupField
    ? sortedAndFilteredRecords.reduce<BuildGridGroup[]>((groups, record) => {
        const label = getFieldDisplayValue(base, record, groupField)
        const existingGroup = groups.find((group) => group.label === label)

        if (existingGroup) {
          existingGroup.records.push(record)
          return groups
        }

        return [...groups, { label, records: [record] }]
      }, [])
    : [{ label: '', records: sortedAndFilteredRecords }]

  return {
    fieldsForSelectedTable,
    visibleFieldIds,
    visibleFieldsForGrid,
    recordsForSelectedTable,
    sortedAndFilteredRecords,
    groupField,
    groupedRecords,
  }
}

export function getDependencyPickerRecords(base: Workbase, currentRecordId: string, searchValue: string) {
  const searchTerm = searchValue.trim().toLowerCase()

  return base.records.filter((record) => {
    if (record.id === currentRecordId) {
      return false
    }

    if (!searchTerm) {
      return true
    }

    return [
      base.tables.find((table) => table.id === record.tableId)?.label || record.tableId,
      getRecordTitle(base, record),
      getRecordContext(record),
    ]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm)
  })
}

function getLinkedRecordIds(record: BaseRecord, fieldId: string) {
  const value = record.values[fieldId]

  return Array.isArray(value) ? value : []
}

function recordLinksToAny(record: BaseRecord, fieldId: string, targetIds: Set<string>) {
  return getLinkedRecordIds(record, fieldId).some((recordId) => targetIds.has(recordId))
}

export function getMeetingPrep(base: Workbase, meetingId: string, todayDate: string): MeetingPrep | null {
  const meeting = getRecord(base, meetingId)

  if (!meeting || meeting.tableId !== 'meetings') {
    return null
  }

  const communityIds = new Set(getLinkedRecordIds(meeting, 'community'))
  const explicitTaskIds = new Set(getLinkedRecordIds(meeting, 'tasks'))
  const communities = Array.from(communityIds).flatMap((recordId) => {
    const record = getRecord(base, recordId)

    return record ? [record] : []
  })
  const groups = getWorkRecordGroups(base)
  const linkedTasks = sortRecordsByDate(
    groups.taskRecords.filter((record) => explicitTaskIds.has(record.id) || recordLinksToAny(record, 'community', communityIds)),
  )
  const blockedItems = linkedTasks.filter((record) => getStringValue(record, 'status') === 'Blocked')
  const overdueFollowups = sortRecordsByDate(
    groups.followupRecords.filter(
      (record) =>
        recordLinksToAny(record, 'community', communityIds) &&
        getStringValue(record, 'status') === 'Waiting' &&
        Boolean(getFirstDateValue(record)) &&
        getFirstDateValue(record) < todayDate,
    ),
  )
  const unresolvedApprovals = groups.approvalRecords.filter(
    (record) =>
      recordLinksToAny(record, 'community', communityIds) &&
      !['Received', 'Not needed'].includes(getStringValue(record, 'status')),
  )
  const risks = groups.riskRecords.filter((record) => recordLinksToAny(record, 'community', communityIds))
  const nextSteps = linkedTasks.filter((record) => getStringValue(record, 'status') !== 'Done')
  const sections = [
    { id: 'blocked', label: 'Blocked items', records: blockedItems },
    { id: 'followups', label: 'Overdue follow-ups', records: overdueFollowups },
    { id: 'approvals', label: 'Unresolved approvals', records: unresolvedApprovals },
    { id: 'risks', label: 'Risks', records: risks },
    { id: 'next', label: 'Next steps', records: nextSteps },
  ]
  const agenda: MeetingAgendaItem[] = [
    {
      id: 'community-read',
      title: 'Read the community state.',
      detail: communities.length > 0
        ? communities.map((record) => `${getRecordTitle(base, record)}: ${getRecordContext(record)}.`).join(' ')
        : 'No community linked.',
      recordIds: communities.map((record) => record.id),
    },
    {
      id: 'clear-blockers',
      title: 'Clear blockers first.',
      detail: blockedItems.length > 0
        ? blockedItems.map((record) => getRecordTitle(base, record)).join(', ')
        : 'No blocked linked tasks.',
      recordIds: blockedItems.map((record) => record.id),
    },
    {
      id: 'settle-approvals',
      title: 'Settle approvals and waiting loops.',
      detail: [...unresolvedApprovals, ...overdueFollowups].length > 0
        ? [...unresolvedApprovals, ...overdueFollowups].map((record) => `${getRecordTitle(base, record)}: ${getRecordContext(record)}.`).join(' ')
        : 'No open approvals or overdue follow-ups surfaced.',
      recordIds: [...unresolvedApprovals, ...overdueFollowups].map((record) => record.id),
    },
    {
      id: 'name-risk',
      title: 'Name the risk.',
      detail: risks.length > 0
        ? risks.map((record) => `${getRecordTitle(base, record)}: ${getRecordContext(record)}.`).join(' ')
        : 'No risks linked to the meeting communities.',
      recordIds: risks.map((record) => record.id),
    },
    {
      id: 'assign-next',
      title: 'Assign next steps.',
      detail: nextSteps.length > 0
        ? nextSteps.map((record) => `${getRecordTitle(base, record)}: ${getRecordContext(record)}.`).join(' ')
        : 'No open next steps surfaced.',
      recordIds: nextSteps.map((record) => record.id),
    },
  ]

  return {
    meeting,
    communities,
    linkedTasks,
    blockedItems,
    overdueFollowups,
    unresolvedApprovals,
    risks,
    nextSteps,
    sections,
    agenda,
  }
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
  const usedRecordIds = new Set<string>()
  const takeUniqueRecords = (records: BaseRecord[], limit: number) => {
    const uniqueRecords: BaseRecord[] = []

    for (const record of records) {
      if (usedRecordIds.has(record.id)) {
        continue
      }

      usedRecordIds.add(record.id)
      uniqueRecords.push(record)

      if (uniqueRecords.length === limit) {
        break
      }
    }

    return uniqueRecords
  }

  return [
    {
      id: 'now',
      label: 'Now',
      title: 'Move the work that can burn the day.',
      records: takeUniqueRecords([...blockedTaskRecords, ...highRiskRecords, ...todayRuleRecords], 4),
    },
    {
      id: 'waiting',
      label: 'Waiting',
      title: 'Hold every open loop that depends on someone else.',
      records: takeUniqueRecords([...waitingFollowupRecords, ...waitingTaskRecords, ...openApprovalRecords, ...todayRuleRecords], 4),
    },
    {
      id: 'next',
      label: 'Next',
      title: 'Pull work forward before it becomes urgent.',
      records: takeUniqueRecords(sortRecordsByDate([...meetingRecords, ...openTaskRecords, ...todayRuleRecords]), 4),
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
