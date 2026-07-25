import {
  type BaseRecord,
  type Workbase,
  getRecordContext,
  getRecordTitle,
} from './workbase'

export type CommandSendLaneId = 'now' | 'waiting' | 'next'

export type CommandSendLane = {
  id: CommandSendLaneId | string
  records: BaseRecord[]
}

export type CommandSendPreviewInput = {
  base: Workbase
  lanes?: CommandSendLane[]
  firstFocusRecord?: BaseRecord | null
  ruleReceipts?: string[]
  meetingPrepCount?: number | null
}

function getLaneCount(lanes: CommandSendLane[], laneId: CommandSendLaneId) {
  return lanes.find((lane) => lane.id === laneId)?.records.length || 0
}

function formatFocusRecord(base: Workbase, record?: BaseRecord | null) {
  if (!record) {
    return 'First focus: None provided.'
  }

  return `First focus: ${getRecordTitle(base, record)} (${getRecordContext(record)}).`
}

function formatRuleReceipt(ruleReceipts?: string[]) {
  const receipt = ruleReceipts?.find((item) => item.trim())

  return receipt ? `Why: ${receipt}` : 'Why: No rule receipt provided.'
}

function formatMeetingPrepCount(meetingPrepCount?: number | null) {
  if (typeof meetingPrepCount !== 'number') {
    return 'Meeting prep: Not provided.'
  }

  return `Meeting prep: ${meetingPrepCount} ${meetingPrepCount === 1 ? 'item' : 'items'}.`
}

export function buildCommandSendPreview(input: CommandSendPreviewInput) {
  const lanes = input.lanes || []

  return [
    'Sundesk command send preview.',
    'Mode: local preview only. No send happened.',
    `Now: ${getLaneCount(lanes, 'now')}. Waiting: ${getLaneCount(lanes, 'waiting')}. Next: ${getLaneCount(lanes, 'next')}.`,
    formatFocusRecord(input.base, input.firstFocusRecord),
    formatRuleReceipt(input.ruleReceipts),
    formatMeetingPrepCount(input.meetingPrepCount),
  ].join('\n')
}
