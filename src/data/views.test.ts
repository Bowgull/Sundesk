import { describe, expect, it } from 'vitest'
import {
  getBuildTableRows,
  getLocalEngineStats,
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
      'risks',
      'tasks',
      'followups',
      'approvals',
      'meetings',
      'people',
    ])
  })

  it('groups daily work records for screens and Today', () => {
    const groups = getWorkRecordGroups(workbase)

    expect(groups.openTaskRecords.map((record) => record.id)).toEqual([
      'task_coi_halifax',
      'task_permit_moncton',
      'task_meeting_charlottetown',
    ])
    expect(groups.atRiskCommunityRecords.map((record) => record.id)).toEqual([
      'community_halifax',
    ])
  })

  it('filters and sorts Timeline records', () => {
    const sourceRecords = getTimelineSourceRecords(workbase)

    expect(getTimelineStatusOptions(sourceRecords)).toContain('Blocked')
    expect(getTimelineRecords(workbase, sourceRecords, 'tasks', 'Blocked', '').map((record) => record.id)).toEqual([
      'task_coi_halifax',
    ])
    expect(getTimelineRecords(workbase, sourceRecords, 'all', 'all', 'permit').map((record) => record.id)).toEqual([
      'task_permit_moncton',
      'approval_permit_moncton',
    ])
  })

  it('derives Rule matches and Today lanes from read-only Rules', () => {
    const rules = getDefaultLocalRules()
    const todayMatches = getRuleMatchesForDestination(workbase, rules, 'today', todayDate)
    const todayLanes = getTodayLanes(workbase, todayMatches)

    expect(todayMatches.map((match) => match.record.id)).toContain('task_coi_halifax')
    expect(todayLanes.map((lane) => lane.id)).toEqual(['now', 'waiting', 'next', 'rules'])
    expect(todayLanes.find((lane) => lane.id === 'rules')?.records.length).toBeGreaterThan(0)
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
      { label: 'Communities', value: 3, detail: '1 need attention' },
      { label: 'Open tasks', value: 3, detail: '1 blocked' },
      { label: 'Waiting loops', value: 1, detail: '2 open approvals' },
      { label: 'Risks', value: 1, detail: '1 high' },
    ])
  })
})
