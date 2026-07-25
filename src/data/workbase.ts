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
      label: 'Work',
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
      label: 'Waiting On',
      description: 'People, approvals, and updates that owe the next move.',
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
    { id: 'status', tableId: 'communities', label: 'Status', type: 'singleSelect', options: ['On track', 'At risk', 'Blocked', 'Waiting', 'Prep'] },
    { id: 'eventDate', tableId: 'communities', label: 'Event date', type: 'date' },
    { id: 'readiness', tableId: 'communities', label: 'Readiness', type: 'percent' },
    { id: 'openTaskCount', tableId: 'communities', label: 'Open work', type: 'count', sourceLinkedFieldId: 'community' },
    { id: 'approvalStatusRollup', tableId: 'communities', label: 'Approval status', type: 'rollup', sourceLinkedFieldId: 'community', sourceFieldId: 'status', operation: 'countWhere' },

    { id: 'title', tableId: 'tasks', label: 'Title', type: 'text' },
    { id: 'status', tableId: 'tasks', label: 'Status', type: 'status', options: ['Blocked', 'Waiting', 'In progress', 'Done'] },
    { id: 'dueDate', tableId: 'tasks', label: 'Due date', type: 'date' },
    { id: 'priority', tableId: 'tasks', label: 'Priority', type: 'singleSelect', options: ['Fire', 'Urgent', 'Waiting', 'Prep', 'Routine'] },
    { id: 'tags', tableId: 'tasks', label: 'Tags', type: 'multiSelect', options: ['COI', 'Permit', 'Meeting', 'Blocked', 'Waiting', 'Prep'] },
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
    { id: 'tasks', tableId: 'meetings', label: 'Work', type: 'linkedRecord', linkedTableId: 'tasks', allowMultiple: true },
    { id: 'weeklyNote', tableId: 'meetings', label: 'Weekly note', type: 'longText' },

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
      id: 'community_toronto',
      tableId: 'communities',
      values: { name: 'Toronto', status: 'At risk', eventDate: '2026-05-22', readiness: 58 },
    },
    {
      id: 'community_mississauga',
      tableId: 'communities',
      values: { name: 'Mississauga', status: 'Waiting', eventDate: '2026-05-25', readiness: 66 },
    },
    {
      id: 'community_brampton',
      tableId: 'communities',
      values: { name: 'Brampton', status: 'Prep', eventDate: '2026-05-28', readiness: 81 },
    },
    {
      id: 'community_vaughan',
      tableId: 'communities',
      values: { name: 'Vaughan', status: 'On track', eventDate: '2026-05-31', readiness: 88 },
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
      id: 'approval_permit_toronto',
      tableId: 'approvals',
      values: {
        title: 'Permit missing',
        status: 'Missing',
        community: ['community_toronto'],
        owner: ['person_venue_lead'],
      },
    },
    {
      id: 'approval_vendor_cois_mississauga',
      tableId: 'approvals',
      values: {
        title: 'Vendor COIs stale',
        status: 'Requested',
        community: ['community_mississauga'],
        owner: ['person_city_contact'],
      },
    },
    {
      id: 'approval_site_map_vaughan',
      tableId: 'approvals',
      values: {
        title: 'Site map received',
        status: 'Received',
        community: ['community_vaughan'],
        owner: ['person_venue_lead'],
      },
    },
    {
      id: 'task_permit_toronto',
      tableId: 'tasks',
      values: {
        title: 'Send permit follow-up.',
        status: 'Blocked',
        dueDate: '2026-05-12',
        priority: 'Fire',
        tags: ['Permit', 'Blocked'],
        community: ['community_toronto'],
        approval: ['approval_permit_toronto'],
        owner: ['person_venue_lead'],
      },
    },
    {
      id: 'task_vendor_cois_mississauga',
      tableId: 'tasks',
      values: {
        title: 'Log vendor COIs.',
        status: 'Waiting',
        dueDate: '2026-05-13',
        priority: 'Waiting',
        tags: ['COI', 'Waiting'],
        community: ['community_mississauga'],
        approval: ['approval_vendor_cois_mississauga'],
        owner: ['person_city_contact'],
      },
    },
    {
      id: 'task_meeting_brampton',
      tableId: 'tasks',
      values: {
        title: 'Review prep notes.',
        status: 'In progress',
        dueDate: '2026-05-14',
        priority: 'Prep',
        tags: ['Meeting', 'Prep'],
        community: ['community_brampton'],
      },
    },
    {
      id: 'task_site_map_vaughan',
      tableId: 'tasks',
      values: {
        title: 'Check Friday.',
        status: 'In progress',
        dueDate: '2026-05-15',
        priority: 'Routine',
        tags: ['Prep'],
        community: ['community_vaughan'],
        approval: ['approval_site_map_vaughan'],
      },
    },
    {
      id: 'followup_venue_toronto',
      tableId: 'followups',
      values: {
        title: 'Venue readiness waiting.',
        status: 'Waiting',
        dueDate: '2026-05-11',
        community: ['community_toronto'],
        person: ['person_venue_lead'],
      },
    },
    {
      id: 'followup_vendor_mississauga',
      tableId: 'followups',
      values: {
        title: 'Vendor replies pending.',
        status: 'Waiting',
        dueDate: '2026-05-13',
        community: ['community_mississauga'],
        person: ['person_city_contact'],
      },
    },
    {
      id: 'meeting_brampton',
      tableId: 'meetings',
      values: {
        title: 'Brampton prep.',
        date: '2026-05-15T09:30:00',
        community: ['community_brampton'],
        tasks: ['task_meeting_brampton'],
        weeklyNote: '',
      },
    },
    {
      id: 'risk_permit_toronto',
      tableId: 'risks',
      values: {
        title: 'Permit risk may slip readiness.',
        level: 'High',
        community: ['community_toronto'],
        blocks: ['task_permit_toronto'],
      },
    },
  ],
  dependencies: [
    {
      id: 'dependency_permit_toronto',
      fromRecordId: 'task_permit_toronto',
      toRecordId: 'approval_permit_toronto',
      relationship: 'dependsOn',
      reason: 'Permit status must be clear before Toronto readiness can move.',
    },
    {
      id: 'dependency_vendor_cois_mississauga',
      fromRecordId: 'task_vendor_cois_mississauga',
      toRecordId: 'approval_vendor_cois_mississauga',
      relationship: 'dependsOn',
      reason: 'Vendor COIs must land before Mississauga can leave waiting.',
    },
    {
      id: 'dependency_risk_toronto',
      fromRecordId: 'risk_permit_toronto',
      toRecordId: 'task_permit_toronto',
      relationship: 'blocks',
      reason: 'The permit risk blocks readiness until the follow-up moves.',
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
