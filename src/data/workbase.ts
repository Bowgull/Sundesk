export type FieldType =
  | 'text'
  | 'longText'
  | 'status'
  | 'singleSelect'
  | 'multiSelect'
  | 'date'
  | 'dateTime'
  | 'checkbox'
  | 'number'
  | 'currency'
  | 'percent'
  | 'rating'
  | 'phone'
  | 'url'
  | 'linkedRecord'
  | 'lookup'
  | 'rollup'
  | 'count'
  | 'systemFormula'
  | 'createdTime'
  | 'lastUpdatedTime'

export type CheckboxIcon = 'check' | 'star' | 'heart' | 'thumb' | 'flag'
export type CheckboxColor = 'lime' | 'mint' | 'cyan' | 'blue' | 'violet' | 'pink' | 'rose' | 'orange' | 'gold' | 'graphite'

export type FieldDefinition = {
  id: string
  tableId: string
  label: string
  type: FieldType
  options?: string[]
  checkboxIcon?: CheckboxIcon
  checkboxColor?: CheckboxColor
  linkedTableId?: string
  allowMultiple?: boolean
  sourceLinkedFieldId?: string
  sourceFieldId?: string
  operation?: 'count' | 'countWhere'
}

export type TableDefinition = {
  id: string
  label: string
  description: string
  primaryFieldId: string
}

export type RecordValue = string | number | boolean | string[] | null

export type BaseRecord = {
  id: string
  tableId: string
  values: Record<string, RecordValue>
}

export type DependencyLink = {
  id: string
  fromRecordId: string
  toRecordId: string
  relationship: 'dependsOn' | 'blocks'
  reason: string
}

export type MaterializedLink = {
  id: string
  fromTableId: string
  fromRecordId: string
  fromFieldId: string
  toTableId: string
  toRecordId: string
}

export type RecordReference = {
  id: string
  tableId: string
  tableLabel: string
  title: string
  context: string
}

export type Backlink = {
  fieldId: string
  fieldLabel: string
  fromRecord: RecordReference
}

export type Workbase = {
  tables: TableDefinition[]
  fields: FieldDefinition[]
  records: BaseRecord[]
  dependencies: DependencyLink[]
}

export const workbase: Workbase = {
  tables: [
    {
      id: 'communities',
      label: 'Communities',
      description: 'One record per community. Owns readiness, event dates, and risk state.',
      primaryFieldId: 'name',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      description: 'Work Lindsay can create, link, block, and close.',
      primaryFieldId: 'title',
    },
    {
      id: 'approvals',
      label: 'Approvals',
      description: 'Permits, COI status, confirmations, and blockers.',
      primaryFieldId: 'title',
    },
    {
      id: 'followups',
      label: 'Follow-ups',
      description: 'Waiting loops, nudges, owners, and due dates.',
      primaryFieldId: 'title',
    },
    {
      id: 'meetings',
      label: 'Meetings',
      description: 'Prep, agenda items, notes metadata, and next actions.',
      primaryFieldId: 'title',
    },
    {
      id: 'people',
      label: 'People',
      description: 'Allowed contacts, roles, and safe contact metadata.',
      primaryFieldId: 'name',
    },
    {
      id: 'risks',
      label: 'Risks',
      description: 'Things that may slip the plan and what they block.',
      primaryFieldId: 'title',
    },
  ],
  fields: [
    { id: 'name', tableId: 'communities', label: 'Name', type: 'text' },
    { id: 'status', tableId: 'communities', label: 'Status', type: 'singleSelect', options: ['On track', 'At risk', 'Blocked'] },
    { id: 'eventDate', tableId: 'communities', label: 'Event date', type: 'date' },
    { id: 'readiness', tableId: 'communities', label: 'Readiness', type: 'percent' },
    { id: 'openTaskCount', tableId: 'communities', label: 'Open tasks', type: 'count', sourceLinkedFieldId: 'community' },
    { id: 'approvalStatusRollup', tableId: 'communities', label: 'Approval status', type: 'rollup', sourceLinkedFieldId: 'community', sourceFieldId: 'status', operation: 'countWhere' },

    { id: 'title', tableId: 'tasks', label: 'Title', type: 'text' },
    { id: 'status', tableId: 'tasks', label: 'Status', type: 'status', options: ['Blocked', 'Waiting', 'In progress', 'Done'] },
    { id: 'dueDate', tableId: 'tasks', label: 'Due date', type: 'date' },
    { id: 'priority', tableId: 'tasks', label: 'Priority', type: 'singleSelect', options: ['Fire', 'Urgent', 'Waiting', 'Prep', 'Routine'] },
    { id: 'community', tableId: 'tasks', label: 'Community', type: 'linkedRecord', linkedTableId: 'communities', allowMultiple: false },
    { id: 'approval', tableId: 'tasks', label: 'Approval', type: 'linkedRecord', linkedTableId: 'approvals', allowMultiple: true },
    { id: 'owner', tableId: 'tasks', label: 'Owner', type: 'linkedRecord', linkedTableId: 'people', allowMultiple: false },
    { id: 'communityEventDate', tableId: 'tasks', label: 'Community event date', type: 'lookup', sourceLinkedFieldId: 'community', sourceFieldId: 'eventDate' },

    { id: 'title', tableId: 'approvals', label: 'Title', type: 'text' },
    { id: 'status', tableId: 'approvals', label: 'Status', type: 'singleSelect', options: ['Missing', 'Requested', 'Received', 'Not needed'] },
    { id: 'community', tableId: 'approvals', label: 'Community', type: 'linkedRecord', linkedTableId: 'communities', allowMultiple: false },
    { id: 'owner', tableId: 'approvals', label: 'Owner', type: 'linkedRecord', linkedTableId: 'people', allowMultiple: false },

    { id: 'title', tableId: 'followups', label: 'Title', type: 'text' },
    { id: 'status', tableId: 'followups', label: 'Status', type: 'singleSelect', options: ['Waiting', 'Sent', 'Answered', 'Not needed'] },
    { id: 'dueDate', tableId: 'followups', label: 'Due date', type: 'date' },
    { id: 'community', tableId: 'followups', label: 'Community', type: 'linkedRecord', linkedTableId: 'communities', allowMultiple: false },
    { id: 'person', tableId: 'followups', label: 'Person', type: 'linkedRecord', linkedTableId: 'people', allowMultiple: false },

    { id: 'title', tableId: 'meetings', label: 'Title', type: 'text' },
    { id: 'date', tableId: 'meetings', label: 'Date', type: 'dateTime' },
    { id: 'community', tableId: 'meetings', label: 'Community', type: 'linkedRecord', linkedTableId: 'communities', allowMultiple: true },
    { id: 'tasks', tableId: 'meetings', label: 'Tasks', type: 'linkedRecord', linkedTableId: 'tasks', allowMultiple: true },

    { id: 'name', tableId: 'people', label: 'Name', type: 'text' },
    { id: 'role', tableId: 'people', label: 'Role', type: 'text' },
    { id: 'phone', tableId: 'people', label: 'Phone', type: 'phone' },

    { id: 'title', tableId: 'risks', label: 'Title', type: 'text' },
    { id: 'level', tableId: 'risks', label: 'Level', type: 'singleSelect', options: ['Low', 'Medium', 'High'] },
    { id: 'community', tableId: 'risks', label: 'Community', type: 'linkedRecord', linkedTableId: 'communities', allowMultiple: false },
    { id: 'blocks', tableId: 'risks', label: 'Blocks', type: 'linkedRecord', linkedTableId: 'tasks', allowMultiple: true },
  ],
  records: [
    {
      id: 'community_halifax',
      tableId: 'communities',
      values: { name: 'Halifax', status: 'At risk', eventDate: '2026-05-22', readiness: 62 },
    },
    {
      id: 'community_moncton',
      tableId: 'communities',
      values: { name: 'Moncton', status: 'Waiting', eventDate: '2026-05-25', readiness: 71 },
    },
    {
      id: 'community_charlottetown',
      tableId: 'communities',
      values: { name: 'Charlottetown', status: 'Prep', eventDate: '2026-05-28', readiness: 77 },
    },
    {
      id: 'person_venue_lead',
      tableId: 'people',
      values: { name: 'Venue lead', role: 'Venue contact', phone: 'Only if permitted' },
    },
    {
      id: 'person_city_contact',
      tableId: 'people',
      values: { name: 'City contact', role: 'Permit contact', phone: 'Only if permitted' },
    },
    {
      id: 'approval_coi_halifax',
      tableId: 'approvals',
      values: {
        title: 'COI status',
        status: 'Missing',
        community: ['community_halifax'],
        owner: ['person_venue_lead'],
      },
    },
    {
      id: 'approval_permit_moncton',
      tableId: 'approvals',
      values: {
        title: 'Permit approval',
        status: 'Requested',
        community: ['community_moncton'],
        owner: ['person_city_contact'],
      },
    },
    {
      id: 'task_coi_halifax',
      tableId: 'tasks',
      values: {
        title: 'Confirm COI status.',
        status: 'Blocked',
        dueDate: '2026-05-12',
        priority: 'Fire',
        community: ['community_halifax'],
        approval: ['approval_coi_halifax'],
        owner: ['person_venue_lead'],
      },
    },
    {
      id: 'task_permit_moncton',
      tableId: 'tasks',
      values: {
        title: 'Send permit follow-up.',
        status: 'Waiting',
        dueDate: '2026-05-13',
        priority: 'Waiting',
        community: ['community_moncton'],
        approval: ['approval_permit_moncton'],
        owner: ['person_city_contact'],
      },
    },
    {
      id: 'task_meeting_charlottetown',
      tableId: 'tasks',
      values: {
        title: 'Build Charlottetown meeting prep.',
        status: 'In progress',
        dueDate: '2026-05-14',
        priority: 'Prep',
        community: ['community_charlottetown'],
      },
    },
    {
      id: 'followup_venue_halifax',
      tableId: 'followups',
      values: {
        title: 'Venue lead nudge.',
        status: 'Waiting',
        dueDate: '2026-05-11',
        community: ['community_halifax'],
        person: ['person_venue_lead'],
      },
    },
    {
      id: 'meeting_charlottetown',
      tableId: 'meetings',
      values: {
        title: 'Charlottetown prep.',
        date: '2026-05-15T09:30:00',
        community: ['community_charlottetown'],
        tasks: ['task_meeting_charlottetown'],
      },
    },
    {
      id: 'risk_venue_halifax',
      tableId: 'risks',
      values: {
        title: 'Venue readiness may slip.',
        level: 'High',
        community: ['community_halifax'],
        blocks: ['task_coi_halifax'],
      },
    },
  ],
  dependencies: [
    {
      id: 'dependency_coi_halifax',
      fromRecordId: 'task_coi_halifax',
      toRecordId: 'approval_coi_halifax',
      relationship: 'dependsOn',
      reason: 'COI must be received before venue readiness can be marked ready.',
    },
    {
      id: 'dependency_permit_moncton',
      fromRecordId: 'task_permit_moncton',
      toRecordId: 'approval_permit_moncton',
      relationship: 'dependsOn',
      reason: 'Site map review waits for the permit answer.',
    },
    {
      id: 'dependency_risk_halifax',
      fromRecordId: 'risk_venue_halifax',
      toRecordId: 'task_coi_halifax',
      relationship: 'blocks',
      reason: 'The venue risk blocks the task until COI status moves.',
    },
  ],
}

export function getTable(base: Workbase, tableId: string) {
  return base.tables.find((table) => table.id === tableId)
}

export function getField(base: Workbase, tableId: string, fieldId: string) {
  return base.fields.find((field) => field.tableId === tableId && field.id === fieldId)
}

export function getRecord(base: Workbase, recordId: string) {
  return base.records.find((record) => record.id === recordId)
}

export function getRecordTitle(base: Workbase, record: BaseRecord) {
  const table = getTable(base, record.tableId)
  const primaryFieldId = table?.primaryFieldId || 'title'
  const title = record.values[primaryFieldId]

  return typeof title === 'string' ? title : record.id
}

export function getRecordContext(record: BaseRecord) {
  const status = record.values.status
  const dueDate = record.values.dueDate || record.values.eventDate || record.values.date
  const parts = [typeof status === 'string' ? status : null, typeof dueDate === 'string' ? dueDate : null].filter(Boolean)

  return parts.length > 0 ? parts.join(' · ') : 'No status set'
}

export function getRecordReference(base: Workbase, record: BaseRecord): RecordReference {
  const table = getTable(base, record.tableId)

  return {
    id: record.id,
    tableId: record.tableId,
    tableLabel: table?.label || record.tableId,
    title: getRecordTitle(base, record),
    context: getRecordContext(record),
  }
}

export function getRecordReferences(base: Workbase) {
  return base.records.map((record) => getRecordReference(base, record))
}

export function getRecordsForTable(base: Workbase, tableId: string) {
  return base.records.filter((record) => record.tableId === tableId)
}

export function getLinkedRecordFields(base: Workbase) {
  return base.fields.filter((field) => field.type === 'linkedRecord' && field.linkedTableId)
}

export function getMaterializedLinks(base: Workbase): MaterializedLink[] {
  return getLinkedRecordFields(base).flatMap((field) =>
    getRecordsForTable(base, field.tableId).flatMap((record) => {
      const value = record.values[field.id]
      const linkedRecordIds = Array.isArray(value) ? value : []

      return linkedRecordIds.map((linkedRecordId) => ({
        id: `${record.id}:${field.id}:${linkedRecordId}`,
        fromTableId: record.tableId,
        fromRecordId: record.id,
        fromFieldId: field.id,
        toTableId: field.linkedTableId || '',
        toRecordId: linkedRecordId,
      }))
    }),
  )
}

export function getLinkedRecordsForRecord(base: Workbase, recordId: string) {
  const record = getRecord(base, recordId)

  if (!record) {
    return []
  }

  return getLinkedRecordFields(base)
    .filter((field) => field.tableId === record.tableId)
    .flatMap((field) => {
      const value = record.values[field.id]
      const linkedRecordIds = Array.isArray(value) ? value : []

      return linkedRecordIds.flatMap((linkedRecordId) => {
        const linkedRecord = getRecord(base, linkedRecordId)

        return linkedRecord
          ? [
              {
                fieldId: field.id,
                fieldLabel: field.label,
                record: getRecordReference(base, linkedRecord),
              },
            ]
          : []
      })
    })
}

export function getBacklinksForRecord(base: Workbase, recordId: string): Backlink[] {
  return getMaterializedLinks(base)
    .filter((link) => link.toRecordId === recordId)
    .flatMap((link) => {
      const fromRecord = getRecord(base, link.fromRecordId)
      const field = getField(base, link.fromTableId, link.fromFieldId)

      return fromRecord && field
        ? [
            {
              fieldId: field.id,
              fieldLabel: field.label,
              fromRecord: getRecordReference(base, fromRecord),
            },
          ]
        : []
    })
}

export function getDependencyReferencesForRecord(base: Workbase, recordId: string) {
  return base.dependencies.flatMap((dependency) => {
    if (dependency.fromRecordId !== recordId && dependency.toRecordId !== recordId) {
      return []
    }

    const otherRecordId = dependency.fromRecordId === recordId ? dependency.toRecordId : dependency.fromRecordId
    const otherRecord = getRecord(base, otherRecordId)

    return otherRecord
      ? [
          {
            ...dependency,
            direction: dependency.fromRecordId === recordId ? 'outgoing' : 'incoming',
            record: getRecordReference(base, otherRecord),
          },
        ]
      : []
  })
}

export function getLookupPreview(base: Workbase, recordId: string, lookupFieldId: string) {
  const record = getRecord(base, recordId)

  if (!record) {
    return null
  }

  const field = getField(base, record.tableId, lookupFieldId)
  const sourceLinkedFieldId = field?.sourceLinkedFieldId
  const sourceFieldId = field?.sourceFieldId

  if (!sourceLinkedFieldId || !sourceFieldId) {
    return null
  }

  const linkedIds = record.values[sourceLinkedFieldId]
  const firstLinkedRecord = Array.isArray(linkedIds) ? getRecord(base, linkedIds[0]) : null

  return firstLinkedRecord?.values[sourceFieldId] || null
}

export function countBacklinksFromTable(base: Workbase, recordId: string, fromTableId: string) {
  return getBacklinksForRecord(base, recordId).filter((backlink) => backlink.fromRecord.tableId === fromTableId).length
}
