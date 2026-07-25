import {
  type BaseRecord,
  type Workbase,
  getDependencyReferencesForRecord,
  getRecord,
  getRecordTitle,
  getTable,
} from './workbase'
import {
  getFirstDateValue,
  getNumberValue,
  getStringValue,
  type LocalRule,
} from './rules'
import type { RuleMatch } from './views'

export type TimelineTone = 'blocked' | 'waiting' | 'prep' | 'done' | 'event' | 'meeting' | 'neutral'

export type TimelineCard = {
  id: string
  record: BaseRecord
  title: string
  tableLabel: string
  place: string
  status: string
  dueDate: string
  dueLabel: string
  tags: string[]
  blockers: string[]
  reason?: string
  nextMove: string
  tone: TimelineTone
}

export type TimelineKanbanLane = {
  id: 'blocked' | 'waiting' | 'prep' | 'done'
  label: string
  cards: TimelineCard[]
}

export type TimelineCalendarDay = {
  date: string
  label: string
  count: number
  items: TimelineCard[]
}

export type TimelineGanttItem = TimelineCard & {
  left: number
  width: number
}

export type TimelineGanttRow = {
  communityId: string
  community: string
  status: string
  readiness: number
  eventDate: string
  eventLabel: string
  eventLeft: number
  items: TimelineGanttItem[]
}

export type TimelineGraphNode = {
  id: string
  card: TimelineCard
  role: 'center' | 'work' | 'blocker' | 'risk'
}

export type TimelineGraphEdge = {
  id: string
  fromId: string
  toId: string
}

export type TimelineModel = {
  summary: {
    shown: number
    dated: number
    linked: number
    checked: number
    nextMove: TimelineCard | null
  }
  grid: {
    rows: TimelineCard[]
  }
  kanban: {
    lanes: TimelineKanbanLane[]
  }
  calendar: {
    anchorDate: string
    pressureDays: TimelineCalendarDay[]
    selectedDay: (TimelineCalendarDay & { nextAction: string }) | null
  }
  gantt: {
    startDate: string
    endDate: string
    rows: TimelineGanttRow[]
  }
  graph: {
    center: TimelineGraphNode | null
    nodes: TimelineGraphNode[]
    edges: TimelineGraphEdge[]
    whyAtRisk: string[]
    nextMove: TimelineCard | null
  }
}

type TimelineModelInput = {
  base: Workbase
  records: readonly BaseRecord[]
  communityRecords: readonly BaseRecord[]
  ruleMatches: readonly RuleMatch[]
  selectedCalendarDate?: string
  selectedGraphCommunityId?: string
  selectedGanttCommunityId?: string
  todayDate: string
}

const laneLabels: Record<TimelineKanbanLane['id'], string> = {
  blocked: 'Blocked',
  waiting: 'Waiting',
  prep: 'Prep',
  done: 'Done',
}

export function buildTimelineModel({
  base,
  records,
  communityRecords,
  ruleMatches,
  selectedCalendarDate,
  selectedGraphCommunityId,
  todayDate,
}: TimelineModelInput): TimelineModel {
  const cards = records.map((record) => buildTimelineCard(base, record, ruleMatches))
  const datedCards = cards.filter((card) => card.dueDate)
  const linkedCards = cards.filter((card) => getCommunityRecordForRecord(card.record, communityRecords))
  const checkedRecordIds = new Set(ruleMatches.map((match) => match.record.id))
  const nextMove = cards.find((card) => card.tone === 'blocked') || cards.find((card) => card.tone === 'waiting') || cards[0] || null
  const calendar = buildCalendar(cards, selectedCalendarDate || todayDate)
  const gantt = buildGantt(base, cards, communityRecords)
  const graph = buildGraph(base, cards, communityRecords, selectedGraphCommunityId)

  return {
    summary: {
      shown: cards.length,
      dated: datedCards.length,
      linked: linkedCards.length,
      checked: checkedRecordIds.size,
      nextMove,
    },
    grid: { rows: cards },
    kanban: {
      lanes: (['blocked', 'waiting', 'prep', 'done'] as const).map((laneId) => ({
        id: laneId,
        label: laneLabels[laneId],
        cards: cards
          .filter((card) => getKanbanLane(card) === laneId)
          .map((card) => ({ ...card, reason: getKanbanReason(card), nextMove: getKanbanNextMove(laneId) })),
      })),
    },
    calendar,
    gantt,
    graph,
  }
}

export function getDateKey(value: string) {
  if (!value) {
    return ''
  }

  const isoDateMatch = value.match(/^\d{4}-\d{2}-\d{2}/)

  if (isoDateMatch) {
    return isoDateMatch[0]
  }

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
}

export function formatTimelineDate(value: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  const dateKey = getDateKey(value)

  if (!dateKey) {
    return ''
  }

  const parsed = new Date(`${dateKey}T12:00:00`)

  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(undefined, options)
}

function buildTimelineCard(base: Workbase, record: BaseRecord, ruleMatches: readonly RuleMatch[]): TimelineCard {
  const table = getTable(base, record.tableId)
  const status = getRecordStatus(record)
  const dueDate = getDateKey(getFirstDateValue(record))
  const tags = getRecordTags(record)
  const blockers = [
    ...getDependencyReferencesForRecord(base, record.id).map((dependency) => `${getDependencyLabel(dependency, record.id)} ${dependency.record.title}`),
    ...ruleMatches
      .filter((match) => match.record.id === record.id)
      .map((match) => getPlainRuleReason(match.rule))
      .filter(Boolean),
  ]
  const tone = getTone(record, status)

  return {
    id: record.id,
    record,
    title: getRecordTitle(base, record),
    tableLabel: table?.label || record.tableId,
    place: getRecordPlace(base, record),
    status,
    dueDate,
    dueLabel: formatTimelineDate(dueDate) || 'Date pending',
    tags,
    reason: blockers[0] || getNextMove(status, tone),
    blockers,
    nextMove: getNextMove(status, tone),
    tone,
  }
}

function getRecordStatus(record: BaseRecord) {
  return getStringValue(record, 'status') || getStringValue(record, 'level') || getStringValue(record, 'priority') || 'No status set'
}

function getRecordTags(record: BaseRecord) {
  const tags = record.values.tags

  if (Array.isArray(tags)) {
    return tags.filter((tag): tag is string => typeof tag === 'string')
  }

  return [getRecordStatus(record)].filter((tag) => tag !== 'No status set')
}

function getRecordPlace(base: Workbase, record: BaseRecord) {
  if (record.tableId === 'communities') {
    return getRecordTitle(base, record)
  }

  const communityIds = Object.values(record.values).find((value): value is string[] =>
    Array.isArray(value) && value.some((item) => getRecord(base, item)?.tableId === 'communities'),
  )
  const community = communityIds?.map((recordId) => getRecord(base, recordId)).find(Boolean)

  return community ? getRecordTitle(base, community) : 'No place'
}

function getCommunityRecordForRecord(record: BaseRecord, communityRecords: readonly BaseRecord[]) {
  if (record.tableId === 'communities') {
    return communityRecords.find((community) => community.id === record.id) || null
  }

  return communityRecords.find((community) =>
    Object.values(record.values).some((value) => Array.isArray(value) && value.includes(community.id)),
  ) || null
}

function getDependencyLabel(
  dependency: ReturnType<typeof getDependencyReferencesForRecord>[number],
  recordId: string,
) {
  if (dependency.relationship === 'dependsOn') {
    return dependency.fromRecordId === recordId ? 'Depends on' : 'Needed by'
  }

  return dependency.fromRecordId === recordId ? 'Blocks' : 'Blocked by'
}

function getPlainRuleReason(rule: LocalRule) {
  if (rule.operator === 'isWithin7Days') {
    return 'Due within 7 days'
  }

  if (rule.operator === 'isToday') {
    return 'Due today'
  }

  if (rule.operator === 'hasAnyLink') {
    return rule.tableId === 'risks' ? 'Blocks linked work' : 'Connected work'
  }

  return 'Saved check matched'
}

function getTone(record: BaseRecord, status: string): TimelineTone {
  const value = status.toLowerCase()

  if (record.tableId === 'meetings') {
    return 'meeting'
  }

  if (record.tableId === 'communities') {
    return 'event'
  }

  if (['blocked', 'missing', 'high', 'fire', 'at risk'].some((token) => value.includes(token))) {
    return 'blocked'
  }

  if (['waiting', 'requested'].some((token) => value.includes(token))) {
    return 'waiting'
  }

  if (['prep', 'progress', 'routine'].some((token) => value.includes(token))) {
    return 'prep'
  }

  if (['done', 'received', 'track'].some((token) => value.includes(token))) {
    return 'done'
  }

  return 'neutral'
}

function getNextMove(status: string, tone: TimelineTone) {
  if (tone === 'blocked') {
    return 'Move the blocker.'
  }

  if (tone === 'waiting') {
    return 'Nudge the next owner.'
  }

  if (status === 'In progress' || tone === 'prep') {
    return 'Finish the prep.'
  }

  if (tone === 'done') {
    return 'Closed.'
  }

  return 'Open the record.'
}

function getKanbanLane(card: TimelineCard): TimelineKanbanLane['id'] | null {
  const status = card.status.toLowerCase()

  if (card.record.tableId === 'approvals' && card.status !== 'Received') {
    return null
  }

  if (card.record.tableId === 'risks') {
    return null
  }

  if (card.record.tableId === 'communities' && status.includes('track')) {
    return null
  }

  if (status.includes('blocked')) {
    return 'blocked'
  }

  if (status.includes('waiting')) {
    return 'waiting'
  }

  if (status.includes('prep') || status.includes('progress')) {
    return 'prep'
  }

  if (status.includes('done') || status.includes('received') || status.includes('track')) {
    return 'done'
  }

  return null
}

function getKanbanReason(card: TimelineCard) {
  if (card.tone === 'blocked') {
    return card.blockers[0] || 'Blocked'
  }

  if (card.tone === 'waiting') {
    return card.blockers[0] || 'Waiting on owner'
  }

  return card.tags[0] || card.tableLabel
}

function getKanbanNextMove(laneId: TimelineKanbanLane['id']) {
  if (laneId === 'blocked') {
    return 'Move to Waiting'
  }

  if (laneId === 'waiting') {
    return 'Move to Prep'
  }

  if (laneId === 'prep') {
    return 'Move to Done'
  }

  return 'Closed'
}

function buildCalendar(cards: TimelineCard[], selectedDate: string): TimelineModel['calendar'] {
  const pressureDays = Array.from(
    cards
      .filter((card) => card.dueDate)
      .reduce((days, card) => {
        days.set(card.dueDate, [...(days.get(card.dueDate) || []), card])
        return days
      }, new Map<string, TimelineCard[]>()),
  )
    .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
    .map(([date, items]) => ({
      date,
      label: formatTimelineDate(date, { weekday: 'short', month: 'short', day: 'numeric' }),
      count: items.length,
      items,
    }))
  const selectedDateKey = pressureDays.some((day) => day.date === selectedDate) ? selectedDate : pressureDays[0]?.date || ''
  const selectedDay = pressureDays.find((day) => day.date === selectedDateKey) || null

  return {
    anchorDate: selectedDateKey || selectedDate,
    pressureDays,
    selectedDay: selectedDay
      ? {
          ...selectedDay,
          nextAction: selectedDay.items[0] ? `Open ${selectedDay.items[0].title}` : 'Pick another date.',
        }
      : null,
  }
}

function buildGantt(base: Workbase, cards: TimelineCard[], communityRecords: readonly BaseRecord[]): TimelineModel['gantt'] {
  const datedCards = cards.filter((card) => card.dueDate)
  const dates = [
    ...datedCards.map((card) => card.dueDate),
    ...communityRecords.map((community) => getDateKey(getStringValue(community, 'eventDate'))).filter(Boolean),
  ].sort()
  const startDate = dates[0] || ''
  const endDate = dates[dates.length - 1] || startDate
  const totalDays = Math.max(1, getDayOffset(startDate, endDate))

  return {
    startDate,
    endDate,
    rows: communityRecords.map((community) => {
      const eventDate = getDateKey(getStringValue(community, 'eventDate'))
      const items = cards
        .filter((card) => card.record.id !== community.id && getCommunityRecordForRecord(card.record, communityRecords)?.id === community.id)
        .map((card) => ({
          ...card,
          left: getDatePercent(startDate, totalDays, card.dueDate || eventDate),
          width: card.dueDate ? 18 : 10,
        }))

      return {
        communityId: community.id,
        community: getRecordTitle(base, community),
        status: getRecordStatus(community),
        readiness: getNumberValue(community, 'readiness'),
        eventDate,
        eventLabel: formatTimelineDate(eventDate),
        eventLeft: getDatePercent(startDate, totalDays, eventDate),
        items,
      }
    }),
  }
}

function getDayOffset(firstDate: string, secondDate: string) {
  const first = new Date(`${firstDate}T12:00:00`).getTime()
  const second = new Date(`${secondDate}T12:00:00`).getTime()

  if (!firstDate || !secondDate || Number.isNaN(first) || Number.isNaN(second)) {
    return 1
  }

  return Math.max(1, Math.round((second - first) / 86_400_000))
}

function getDatePercent(startDate: string, totalDays: number, date: string) {
  if (!date) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round((getDayOffset(startDate, date) / totalDays) * 100)))
}

function buildGraph(
  base: Workbase,
  cards: TimelineCard[],
  communityRecords: readonly BaseRecord[],
  selectedCommunityId = '',
): TimelineModel['graph'] {
  const community = communityRecords.find((record) => record.id === selectedCommunityId) || communityRecords[0]

  if (!community) {
    return { center: null, nodes: [], edges: [], whyAtRisk: [], nextMove: null }
  }

  const communityCard = buildTimelineCard(base, community, [])
  const relatedCards = cards
    .filter((card) => card.id !== community.id && getCommunityRecordForRecord(card.record, communityRecords)?.id === community.id)
    .slice(0, 4)
  const nodes: TimelineGraphNode[] = [
    { id: community.id, card: communityCard, role: 'center' },
    ...relatedCards.map((card): TimelineGraphNode => ({
      id: card.id,
      card,
      role: card.record.tableId === 'risks' ? 'risk' : card.tone === 'blocked' ? 'blocker' : 'work',
    })),
  ]
  const center = nodes[0] || null
  const edges = relatedCards.map((card) => ({
    id: `edge-${community.id}-${card.id}`,
    fromId: community.id,
    toId: card.id,
  }))
  const reasonCards = relatedCards
    .filter((card) => card.tone === 'blocked' || card.tone === 'waiting' || card.record.tableId === 'risks')
    .sort((firstCard, secondCard) => getGraphReasonWeight(firstCard) - getGraphReasonWeight(secondCard))
  const whyAtRisk = [
    `${getRecordTitle(base, community)} is ${getNumberValue(community, 'readiness')}% ready.`,
    ...reasonCards.map((card) => {
      if (card.record.tableId === 'risks') {
        return `${card.title} is high risk.`
      }

      return `${card.title} is ${card.status.toLowerCase()}.`
    }),
  ].slice(0, 4)

  return {
    center,
    nodes,
    edges,
    whyAtRisk,
    nextMove: relatedCards.find((card) => card.tone === 'blocked') || relatedCards.find((card) => card.tone === 'waiting') || relatedCards[0] || null,
  }
}

function getGraphReasonWeight(card: TimelineCard) {
  if (card.tone === 'waiting') {
    return 1
  }

  if (card.record.tableId === 'risks') {
    return 3
  }

  if (card.record.tableId === 'approvals') {
    return 4
  }

  if (card.tone === 'blocked') {
    return 2
  }

  return 4
}
