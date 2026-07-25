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
  type: 'Work' | 'Waiting On' | 'Meeting item' | 'Approval' | 'Risk'
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
    id: 'task-permit-toronto',
    title: 'Send permit follow-up for Toronto.',
    community: 'Toronto',
    priority: 'fire',
    summary: 'Permit missing. Event date is close. Venue readiness is blocked.',
    reasons: ['Permit missing', 'Venue readiness blocked', 'Toronto at risk'],
    linkedRecords: ['Toronto', 'Permit missing', 'Venue readiness waiting'],
  },
  {
    id: 'task-vendor-cois-mississauga',
    title: 'Log vendor COIs for Mississauga.',
    community: 'Mississauga',
    priority: 'waiting',
    summary: 'Vendor replies are pending. COI status keeps Mississauga in waiting.',
    reasons: ['Vendor COIs stale', 'Waiting item open', 'Vendor reply pending'],
    linkedRecords: ['Mississauga', 'Vendor COIs stale', 'Vendor lead'],
  },
  {
    id: 'task-meeting-brampton',
    title: 'Review Brampton prep notes.',
    community: 'Brampton',
    priority: 'prep',
    summary: 'Agenda is ready. Meeting prep needs one final read.',
    reasons: ['Meeting prep', 'Agenda ready', '1 meeting item'],
    linkedRecords: ['Meeting', '2 work items', '1 waiting item'],
  },
]

export const communities: CommunitySignal[] = [
  { id: 'toronto', name: 'Toronto', readiness: 58, status: 'hot' },
  { id: 'mississauga', name: 'Mississauga', readiness: 66, status: 'warm' },
  { id: 'brampton', name: 'Brampton', readiness: 81, status: 'warm' },
  { id: 'vaughan', name: 'Vaughan', readiness: 88, status: 'cool' },
]

export const linkedRecords: LinkedRecord[] = [
  {
    id: 'linked-task-permit',
    type: 'Work',
    title: 'Send permit follow-up.',
    detail: 'Blocks readiness.',
    priority: 'fire',
  },
  {
    id: 'linked-followup-vendor',
    type: 'Waiting On',
    title: 'Vendor replies pending.',
    detail: 'Waiting on vendor.',
    priority: 'waiting',
  },
  {
    id: 'linked-meeting-venue',
    type: 'Meeting item',
    title: 'Review prep notes.',
    detail: 'Added to next agenda.',
    priority: 'prep',
  },
]

export const selectedFields: FieldDefinition[] = [
  { label: 'Status', type: 'single select', value: 'At risk' },
  { label: 'Event date', type: 'date', value: 'May 22' },
  { label: 'Readiness', type: 'rollup', value: '62%' },
  { label: 'Permit status', type: 'custom field', value: 'Missing' },
]

export const automationRules: AutomationRule[] = [
  {
    id: 'rule-overdue-followup',
    when: 'a waiting item is overdue',
    then: 'put it in Today and include it in the morning summary',
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
    name: 'Work',
    purpose: 'Work items Lindsay can create, assign, link, block, and close.',
    records: 14,
  },
  {
    id: 'followups',
    name: 'Waiting On',
    purpose: 'People, approvals, and updates that owe the next move.',
    records: 9,
  },
  {
    id: 'approvals',
    name: 'Approvals',
    purpose: 'Permits, vendor COIs, confirmations, and blockers.',
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
    name: 'Work grid',
    type: 'Grid',
    rule: 'All open work. Sorted by due date and priority.',
  },
  {
    id: 'status-board',
    name: 'Status board',
    type: 'Kanban',
    rule: 'Work grouped by status. Uses the Status field.',
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
    rule: 'Work with start dates, due dates, and dependency links.',
  },
]

export const taskDependencies: TaskDependency[] = [
  {
    id: 'coi-venue',
    task: 'Send permit follow-up.',
    dependsOn: 'Venue readiness.',
    linkedTable: 'Approvals',
    reason: 'Permit status must clear before Toronto can be marked ready.',
  },
  {
    id: 'permit-map',
    task: 'Log vendor COIs.',
    dependsOn: 'Vendor replies.',
    linkedTable: 'Waiting On',
    reason: 'Mississauga waits for vendor replies before readiness can move.',
  },
  {
    id: 'prep-agenda',
    task: 'Build meeting prep.',
    dependsOn: 'Open work and risks.',
    linkedTable: 'Meetings',
    reason: 'Agenda is built from linked work, not memory.',
  },
]
