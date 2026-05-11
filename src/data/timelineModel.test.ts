import { describe, expect, it } from 'vitest'
import { getDefaultLocalRules } from './rules'
import { buildTimelineModel } from './timelineModel'
import { getRuleMatchesForDestination, getTimelineRecords, getTimelineSourceRecords, getWorkRecordGroups } from './views'
import { workbase } from './workbase'

describe('Timeline command model', () => {
  const todayDate = '2026-05-11'
  const sourceRecords = getTimelineSourceRecords(workbase)
  const records = getTimelineRecords(workbase, sourceRecords, 'all', 'all', '')
  const communityRecords = getWorkRecordGroups(workbase).communityRecords
  const ruleMatches = getRuleMatchesForDestination(workbase, getDefaultLocalRules(), 'timeline', todayDate)

  it('builds clean grid rows without leaking rule machinery', () => {
    const model = buildTimelineModel({ base: workbase, records, communityRecords, ruleMatches, todayDate })
    const permitRow = model.grid.rows.find((row) => row.id === 'task_permit_toronto')

    expect(permitRow).toMatchObject({
      place: 'Toronto',
      title: 'Send permit follow-up.',
      status: 'Blocked',
      dueLabel: 'May 12',
      nextMove: 'Move the blocker.',
    })
    expect(permitRow?.blockers).toEqual([
      'Depends on Permit missing',
      'Blocked by Permit risk may slip readiness.',
      'Due within 7 days',
    ])
    expect(permitRow?.blockers.join(' ')).not.toContain('show in screen')
  })

  it('groups kanban lanes with branded card facts', () => {
    const model = buildTimelineModel({ base: workbase, records, communityRecords, ruleMatches, todayDate })

    expect(model.kanban.lanes.map((lane) => [lane.id, lane.cards.length])).toEqual([
      ['blocked', 1],
      ['waiting', 4],
      ['prep', 3],
      ['done', 1],
    ])
    expect(model.kanban.lanes[0].cards[0]).toMatchObject({
      title: 'Send permit follow-up.',
      place: 'Toronto',
      dueLabel: 'May 12',
      reason: 'Depends on Permit missing',
      nextMove: 'Move to Waiting',
    })
  })

  it('builds date pressure days for calendar mode', () => {
    const model = buildTimelineModel({ base: workbase, records, communityRecords, ruleMatches, todayDate, selectedCalendarDate: '2026-05-13' })

    expect(model.calendar.pressureDays.map((day) => day.date)).toContain('2026-05-13')
    expect(model.calendar.selectedDay?.items.map((item) => item.title)).toEqual([
      'Log vendor COIs.',
      'Vendor replies pending.',
    ])
    expect(model.calendar.selectedDay?.nextAction).toBe('Open Log vendor COIs.')
  })

  it('builds Gantt readiness rows with event markers', () => {
    const model = buildTimelineModel({ base: workbase, records, communityRecords, ruleMatches, todayDate })
    const toronto = model.gantt.rows.find((row) => row.communityId === 'community_toronto')

    expect(toronto).toMatchObject({
      community: 'Toronto',
      readiness: 58,
      eventDate: '2026-05-22',
      eventLabel: 'May 22',
    })
    expect(toronto?.items.map((item) => item.title)).toEqual([
      'Venue readiness waiting.',
      'Send permit follow-up.',
      'Permit missing',
      'Permit risk may slip readiness.',
    ])
    expect(toronto?.items.every((item) => item.left >= 0 && item.left <= 100)).toBe(true)
  })

  it('builds graph nodes and edges without hardcoded line endpoints', () => {
    const model = buildTimelineModel({ base: workbase, records, communityRecords, ruleMatches, todayDate, selectedGraphCommunityId: 'community_toronto' })

    expect(model.graph.center?.id).toBe('community_toronto')
    expect(model.graph.nodes.map((node) => node.id)).toEqual([
      'community_toronto',
      'followup_venue_toronto',
      'task_permit_toronto',
      'approval_permit_toronto',
      'risk_permit_toronto',
    ])
    expect(model.graph.edges).toEqual([
      { id: 'edge-community_toronto-followup_venue_toronto', fromId: 'community_toronto', toId: 'followup_venue_toronto' },
      { id: 'edge-community_toronto-task_permit_toronto', fromId: 'community_toronto', toId: 'task_permit_toronto' },
      { id: 'edge-community_toronto-approval_permit_toronto', fromId: 'community_toronto', toId: 'approval_permit_toronto' },
      { id: 'edge-community_toronto-risk_permit_toronto', fromId: 'community_toronto', toId: 'risk_permit_toronto' },
    ])
    expect(model.graph.whyAtRisk).toEqual([
      'Toronto is 58% ready.',
      'Venue readiness waiting. is waiting.',
      'Send permit follow-up. is blocked.',
      'Permit risk may slip readiness. is high risk.',
    ])
  })

  it('keeps graph data stable with sparse or missing records', () => {
    const vaughan = communityRecords.find((record) => record.id === 'community_vaughan')
    const sparseModel = buildTimelineModel({
      base: workbase,
      records: vaughan ? [vaughan] : [],
      communityRecords: vaughan ? [vaughan] : [],
      ruleMatches: [],
      todayDate,
      selectedGraphCommunityId: 'community_vaughan',
    })

    expect(sparseModel.graph.nodes.map((node) => node.id)).toEqual(['community_vaughan'])
    expect(sparseModel.graph.edges).toEqual([])
    expect(sparseModel.graph.nextMove).toBeNull()

    const emptyModel = buildTimelineModel({
      base: workbase,
      records: [],
      communityRecords: [],
      ruleMatches: [],
      todayDate,
      selectedGraphCommunityId: 'missing',
    })

    expect(emptyModel.graph).toEqual({
      center: null,
      nodes: [],
      edges: [],
      whyAtRisk: [],
      nextMove: null,
    })
  })

  it('caps dense graph records and keeps crowded calendar days readable', () => {
    const extraRecords = Array.from({ length: 8 }, (_, index) => ({
      id: `dense_task_${index}`,
      tableId: 'tasks',
      values: {
        title: `Dense task ${index + 1}.`,
        status: index % 2 === 0 ? 'Waiting' : 'Blocked',
        dueDate: '2026-05-13',
        priority: 'Fire',
        tags: ['Permit'],
        community: 'community_toronto',
      },
    }))
    const denseRecords = [...records, ...extraRecords]
    const model = buildTimelineModel({
      base: {
        ...workbase,
        records: [...workbase.records, ...extraRecords],
      },
      records: denseRecords,
      communityRecords,
      ruleMatches,
      todayDate,
      selectedCalendarDate: '2026-05-13',
      selectedGraphCommunityId: 'community_toronto',
    })

    expect(model.graph.nodes.length).toBeLessThanOrEqual(5)
    expect(model.graph.edges.length).toBeLessThanOrEqual(4)
    expect(model.calendar.selectedDay?.items.length).toBeGreaterThan(4)
    expect(model.calendar.selectedDay?.nextAction).toBe('Open Log vendor COIs.')
  })
})
