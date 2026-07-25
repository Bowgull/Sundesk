import { describe, expect, it } from 'vitest'
import {
  getBuildGridDerivation,
  getBuildTableRows,
  getDependencyPickerRecords,
  getLocalEngineStats,
  getMeetingAgendaText,
  getMeetingDigestPreview,
  getMeetingPrep,
  getRuleDestinationStats,
  getRuleMatchesForDestination,
  getScreenStats,
  getTimelineRecords,
  getTimelineSourceRecords,
  getTimelineStatusOptions,
  getTodayLanes,
  getWorkRecordGroups,
} from './views'
import {
  type LocalRule,
  getDefaultLocalRules,
} from './rules'
import {
  workbase,
} from './workbase'

describe('view read models', () => {
  const todayDate = '2026-05-07'

  it('keeps Build table rows ordered for daily building', () => {
    expect(getBuildTableRows(workbase).map((table) => table.id)).toEqual([
      'tasks',
      'approvals',
      'followups',
      'meetings',
      'people',
      'risks',
    ])
  })

  it('derives Build grid filtering, sorting, grouping, and visible fields', () => {
    const grid = getBuildGridDerivation(
      workbase,
      'tasks',
      { tasks: ['title', 'status'] },
      'permit',
      'dueDate',
      'asc',
      'status',
    )

    expect(grid.visibleFieldsForGrid.map((field) => field.id)).toEqual(['title', 'status'])
    expect(grid.sortedAndFilteredRecords.map((record) => record.id)).toEqual(['task_permit_toronto'])
    expect(grid.groupField?.id).toBe('status')
    expect(grid.groupedRecords).toEqual([
      {
        label: 'Blocked',
        records: [expect.objectContaining({ id: 'task_permit_toronto' })],
      },
    ])
  })

  it('derives dependency picker records without the active record', () => {
    const records = getDependencyPickerRecords(workbase, 'task_permit_toronto', 'permit')

    expect(records.map((record) => record.id)).toEqual([
      'approval_permit_toronto',
      'risk_permit_toronto',
    ])
    expect(getDependencyPickerRecords(workbase, 'task_permit_toronto', 'coi').map((record) => record.id)).toEqual([
      'approval_vendor_cois_mississauga',
      'task_vendor_cois_mississauga',
    ])
  })

  it('groups daily work records for screens and Today', () => {
    const groups = getWorkRecordGroups(workbase)

    expect(groups.openTaskRecords.map((record) => record.id)).toEqual([
      'task_permit_toronto',
      'task_vendor_cois_mississauga',
      'task_meeting_brampton',
      'task_site_map_vaughan',
    ])
    expect(groups.atRiskCommunityRecords.map((record) => record.id)).toEqual([
      'community_toronto',
      'community_mississauga',
    ])
  })

  it('uses the deck GTA community seed records', () => {
    const groups = getWorkRecordGroups(workbase)

    expect(groups.communityRecords.map((record) => ({
      name: record.values.name,
      readiness: record.values.readiness,
      status: record.values.status,
    }))).toEqual([
      { name: 'Toronto', readiness: 58, status: 'At risk' },
      { name: 'Mississauga', readiness: 66, status: 'Waiting' },
      { name: 'Brampton', readiness: 81, status: 'Prep' },
      { name: 'Vaughan', readiness: 88, status: 'On track' },
    ])
  })

  it('filters and sorts Timeline records', () => {
    const sourceRecords = getTimelineSourceRecords(workbase)

    expect(getTimelineStatusOptions(sourceRecords)).toContain('Blocked')
    expect(getTimelineRecords(workbase, sourceRecords, 'tasks', 'Blocked', '').map((record) => record.id)).toEqual([
      'task_permit_toronto',
    ])
    expect(getTimelineRecords(workbase, sourceRecords, 'all', 'all', 'permit').map((record) => record.id)).toEqual([
      'task_permit_toronto',
      'approval_permit_toronto',
      'risk_permit_toronto',
    ])
  })

  it('builds deterministic meeting prep from linked records and community work', () => {
    const prep = getMeetingPrep(workbase, 'meeting_brampton', todayDate)

    expect(prep?.communities.map((record) => record.id)).toEqual(['community_brampton'])
    expect(prep?.linkedTasks.map((record) => record.id)).toEqual(['task_meeting_brampton'])
    expect(prep?.nextSteps.map((record) => record.id)).toEqual(['task_meeting_brampton'])
    expect(prep?.sections.map((section) => section.id)).toEqual(['blocked', 'followups', 'approvals', 'risks', 'next'])
    expect(prep?.agenda.map((item) => item.id)).toEqual([
      'community-read',
      'clear-blockers',
      'settle-approvals',
      'name-risk',
      'assign-next',
    ])
    expect(prep?.agenda.find((item) => item.id === 'assign-next')?.recordIds).toEqual(['task_meeting_brampton'])
  })

  it('formats computed agenda text and digest preview without saving records', () => {
    const prep = getMeetingPrep(workbase, 'meeting_brampton', todayDate)

    expect(prep).not.toBeNull()

    const agendaText = getMeetingAgendaText(workbase, prep!)
    const digestPreview = getMeetingDigestPreview(workbase, prep!)

    expect(agendaText).toContain('Computed agenda. Not saved.')
    expect(agendaText).toContain('1. Read the community state.')
    expect(agendaText).toContain('Source records: Brampton.')
    expect(digestPreview).toContain('Command send preview.')
    expect(digestPreview).toContain('Agenda items: 5. Source records: 2.')
  })

  it('derives Rule matches and Today lanes from read-only Rules', () => {
    const rules = getDefaultLocalRules()
    const todayMatches = getRuleMatchesForDestination(workbase, rules, 'today', todayDate)
    const todayLanes = getTodayLanes(workbase, todayMatches)
    const laneRecordIds = todayLanes.flatMap((lane) => lane.records.map((record) => record.id))

    expect(todayMatches.map((match) => match.record.id)).toContain('task_permit_toronto')
    expect(todayLanes.map((lane) => lane.id)).toEqual(['now', 'waiting', 'next'])
    expect(laneRecordIds).toContain('task_permit_toronto')
    expect(new Set(laneRecordIds).size).toBe(laneRecordIds.length)
  })

  it('builds Settings stats from validation, not zero-match counts', () => {
    const invalidRule: LocalRule = {
      id: 'invalid',
      tableId: 'tasks',
      fieldId: 'missing',
      operator: 'is',
      value: 'Nope',
      action: 'showInScreen',
      destination: 'today',
    }
    const stats = getLocalEngineStats(workbase, [invalidRule], [])
    const destinationStats = getRuleDestinationStats(workbase, getDefaultLocalRules(), todayDate)

    expect(stats.find((stat) => stat.label === 'Invalid Rules')?.value).toBe(1)
    expect(destinationStats.find((stat) => stat.label === 'Today')?.rules).toBeGreaterThan(0)
  })

  it('derives screen stats for the home summary', () => {
    expect(getScreenStats(workbase)).toEqual([
      { label: 'Communities', value: 4, detail: '2 need attention' },
      { label: 'Open work', value: 4, detail: '1 blocked' },
      { label: 'Waiting On', value: 2, detail: '2 approvals open' },
      { label: 'Risks', value: 1, detail: '1 high' },
    ])
  })
})
