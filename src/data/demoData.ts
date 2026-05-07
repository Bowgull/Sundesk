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

export type TableDefinition = {
  id: string
  name: string
  purpose: string
  records: number
}

export type SavedView = {
  id: string
  name: string
  type: 'Grid' | 'Kanban' | 'Calendar' | 'Gantt' | 'Today'
  rule: string
}

export type TaskDependency = {
  id: string
  task: string
  dependsOn: string
  linkedTable: string
  reason: string
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
    when: 'a follow-up is overdue',
    then: 'put it in Today and include it in the morning digest',
  },
  {
    id: 'rule-blocked-status',
    when: 'an item gets blocked',
    then: 'mark the community at risk',
  },
  {
    id: 'rule-meeting-tomorrow',
    when: 'a meeting is tomorrow',
    then: 'make a meeting prep list',
  },
]

export const buildFieldTypes = [
  'Text',
  'Long text',
  'Status',
  'Single select',
  'Multi select',
  'Date',
  'Date + time',
  'Checkbox',
  'Number',
  'Percent',
  'Rating',
  'Phone',
  'URL',
  'Linked record',
  'Lookup',
  'Rollup',
  'Count',
  'System formula',
  'Created time',
  'Last updated time',
]

export const tables: TableDefinition[] = [
  {
    id: 'communities',
    name: 'Communities',
    purpose: 'One record per community. Owns readiness, event dates, and risk state.',
    records: 6,
  },
  {
    id: 'tasks',
    name: 'Tasks',
    purpose: 'Work items Lindsay can create, assign, link, block, and close.',
    records: 14,
  },
  {
    id: 'followups',
    name: 'Follow-ups',
    purpose: 'Waiting loops, nudges, owners, and due dates.',
    records: 9,
  },
  {
    id: 'approvals',
    name: 'Approvals',
    purpose: 'Permits, COI status, confirmations, and blockers.',
    records: 5,
  },
  {
    id: 'meetings',
    name: 'Meetings',
    purpose: 'Prep, agenda items, notes metadata, and next actions.',
    records: 4,
  },
  {
    id: 'risks',
    name: 'Risks',
    purpose: 'Things that may slip the plan and what they block.',
    records: 3,
  },
  {
    id: 'people',
    name: 'People',
    purpose: 'Allowed contacts, roles, and safe contact metadata.',
    records: 11,
  },
]

export const savedViews: SavedView[] = [
  {
    id: 'today',
    name: 'Today',
    type: 'Today',
    rule: 'Open work due now, overdue, blocked, or needed for the next meeting.',
  },
  {
    id: 'task-grid',
    name: 'Task grid',
    type: 'Grid',
    rule: 'All open tasks. Sorted by due date and priority.',
  },
  {
    id: 'status-board',
    name: 'Status board',
    type: 'Kanban',
    rule: 'Tasks grouped by status. Uses the Status field.',
  },
  {
    id: 'event-calendar',
    name: 'Event calendar',
    type: 'Calendar',
    rule: 'Communities and meetings plotted by date.',
  },
  {
    id: 'dependency-map',
    name: 'Dependency map',
    type: 'Gantt',
    rule: 'Tasks with start dates, due dates, and dependency links.',
  },
]

export const taskDependencies: TaskDependency[] = [
  {
    id: 'coi-venue',
    task: 'Confirm COI status.',
    dependsOn: 'Venue readiness.',
    linkedTable: 'Approvals',
    reason: 'COI must be received before the venue can be marked ready.',
  },
  {
    id: 'permit-map',
    task: 'Send permit follow-up.',
    dependsOn: 'Site map review.',
    linkedTable: 'Follow-ups',
    reason: 'Site map review waits for the permit answer.',
  },
  {
    id: 'prep-agenda',
    task: 'Build meeting prep.',
    dependsOn: 'Open tasks and risks.',
    linkedTable: 'Meetings',
    reason: 'Agenda is built from linked work, not memory.',
  },
]
