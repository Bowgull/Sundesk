export type Priority = 'fire' | 'urgent' | 'waiting' | 'prep' | 'routine'
export type Status = 'blocked' | 'waiting' | 'inProgress' | 'done' | 'atRisk' | 'onTrack'

export type PriorityItem = {
  id: string
  title: string
  community: string
  priority: Priority
  summary: string
  reasons: string[]
  linkedRecords: string[]
}

export type CommunitySignal = {
  id: string
  name: string
  readiness: number
  status: 'hot' | 'warm' | 'cool'
}

export type LinkedRecord = {
  id: string
  type: 'Task' | 'Follow-up' | 'Meeting item' | 'Approval' | 'Risk'
  title: string
  detail: string
  priority: Priority
}

export type FieldDefinition = {
  label: string
  type: string
  value: string
}

export type AutomationRule = {
  id: string
  when: string
  then: string
}

export const priorityItems: PriorityItem[] = [
  {
    id: 'task-coi-halifax',
    title: 'Confirm COI status for Halifax.',
    community: 'Halifax',
    priority: 'fire',
    summary: 'Blocks venue readiness. Event date is 7 days out. Last follow-up was 3 days ago.',
    reasons: ['COI status missing', 'Venue readiness blocked', 'Halifax at risk'],
    linkedRecords: ['Halifax', 'Venue readiness', 'Venue lead nudge'],
  },
  {
    id: 'task-permit-moncton',
    title: 'Send permit follow-up to Moncton.',
    community: 'Moncton',
    priority: 'waiting',
    summary: 'Permit update gates site map review. The linked follow-up is overdue.',
    reasons: ['Permit status unclear', 'Site map review waiting', 'Follow-up overdue'],
    linkedRecords: ['Moncton', 'Permit approval', 'City contact'],
  },
  {
    id: 'task-meeting-charlottetown',
    title: 'Build Charlottetown meeting prep.',
    community: 'Charlottetown',
    priority: 'prep',
    summary: 'Meeting is tomorrow. 2 open tasks and 1 unanswered program note roll into the agenda.',
    reasons: ['Meeting tomorrow', '2 open tasks', '1 follow-up waiting'],
    linkedRecords: ['Meeting', '2 tasks', '1 follow-up'],
  },
]

export const communities: CommunitySignal[] = [
  { id: 'halifax', name: 'Halifax', readiness: 62, status: 'hot' },
  { id: 'moncton', name: 'Moncton', readiness: 71, status: 'warm' },
  { id: 'sydney', name: 'Sydney', readiness: 88, status: 'cool' },
  { id: 'fredericton', name: 'Fredericton', readiness: 92, status: 'cool' },
  { id: 'charlottetown', name: 'Charlottetown', readiness: 77, status: 'warm' },
  { id: 'st-johns', name: 'St. John’s', readiness: 84, status: 'cool' },
]

export const linkedRecords: LinkedRecord[] = [
  {
    id: 'linked-task-coi',
    type: 'Task',
    title: 'Confirm COI status.',
    detail: 'Blocks venue readiness.',
    priority: 'fire',
  },
  {
    id: 'linked-followup-venue',
    type: 'Follow-up',
    title: 'Venue lead nudge.',
    detail: 'Overdue by 1 day.',
    priority: 'waiting',
  },
  {
    id: 'linked-meeting-venue',
    type: 'Meeting item',
    title: 'Ask for final venue note.',
    detail: 'Added to next agenda.',
    priority: 'prep',
  },
]

export const selectedFields: FieldDefinition[] = [
  { label: 'Status', type: 'single select', value: 'At risk' },
  { label: 'Event date', type: 'date', value: 'May 22' },
  { label: 'Readiness', type: 'rollup', value: '62%' },
  { label: 'COI status', type: 'custom field', value: 'Missing' },
]

export const automationRules: AutomationRule[] = [
  {
    id: 'rule-overdue-followup',
    when: 'follow-up is overdue',
    then: 'add to Today and digest',
  },
  {
    id: 'rule-blocked-status',
    when: 'status becomes blocked',
    then: 'mark community at risk',
  },
  {
    id: 'rule-meeting-tomorrow',
    when: 'meeting is tomorrow',
    then: 'generate prep view',
  },
]

export const buildFieldTypes = [
  'Text',
  'Status',
  'Date',
  'Phone',
  'Linked record',
  'Lookup',
  'Rollup',
  'Formula rule',
]
