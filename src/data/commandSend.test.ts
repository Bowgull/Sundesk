import { describe, expect, it } from 'vitest'
import {
  buildCommandSendPreview,
} from './commandSend'
import {
  getRulePreview,
} from './rules'
import {
  getDefaultLocalRules,
} from './rules'
import {
  getMeetingPrep,
  getRuleMatchesForDestination,
  getTodayLanes,
} from './views'
import {
  type Workbase,
  workbase,
} from './workbase'

describe('command send preview', () => {
  const todayDate = '2026-05-07'

  it('builds a deterministic local preview from populated daily context', () => {
    const rules = getDefaultLocalRules()
    const todayMatches = getRuleMatchesForDestination(workbase, rules, 'today', todayDate)
    const todayLanes = getTodayLanes(workbase, todayMatches)
    const firstFocusRecord = todayLanes[0].records[0]
    const meetingPrep = getMeetingPrep(workbase, 'meeting_brampton', todayDate)

    const preview = buildCommandSendPreview({
      base: workbase,
      lanes: todayLanes,
      firstFocusRecord,
      ruleReceipts: [getRulePreview(workbase, todayMatches[0].rule)],
      meetingPrepCount: meetingPrep?.agenda.length,
    })

    expect(preview).toBe([
      'Sundesk command send preview.',
      'Mode: local preview only. No send happened.',
      'Now: 4. Waiting: 4. Next: 2.',
      'First focus: Send permit follow-up. (Blocked · 2026-05-12).',
      'Why: Waiting On.Status is "Waiting". show in screen: Today.',
      'Meeting prep: 5 items.',
    ].join('\n'))
  })

  it('builds a deterministic empty preview without optional context', () => {
    const emptyBase: Workbase = {
      tables: [],
      fields: [],
      records: [],
      dependencies: [],
    }

    const preview = buildCommandSendPreview({
      base: emptyBase,
      lanes: [],
    })

    expect(preview).toBe([
      'Sundesk command send preview.',
      'Mode: local preview only. No send happened.',
      'Now: 0. Waiting: 0. Next: 0.',
      'First focus: None provided.',
      'Why: No rule receipt provided.',
      'Meeting prep: Not provided.',
    ].join('\n'))
  })
})
