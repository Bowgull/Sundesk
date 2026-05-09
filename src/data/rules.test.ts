import { describe, expect, it } from 'vitest'
import {
  type LocalRule,
  getFieldDisplayValue,
  getRuleMatchedRecords,
  getRuleOperatorOptionsForField,
  getRulePreview,
  getRuleValidationMessages,
  ruleMatchesRecord,
} from './rules'
import {
  getField,
  getRecord,
  workbase,
} from './workbase'

describe('rule helpers', () => {
  const todayDate = '2026-05-07'

  it('matches status rules without executing actions', () => {
    const rule: LocalRule = {
      id: 'test-blocked',
      tableId: 'tasks',
      fieldId: 'status',
      operator: 'is',
      value: 'Blocked',
      action: 'showInScreen',
      destination: 'today',
    }
    const blockedTask = getRecord(workbase, 'task_coi_halifax')
    const waitingTask = getRecord(workbase, 'task_permit_moncton')

    expect(blockedTask).toBeDefined()
    expect(waitingTask).toBeDefined()
    expect(ruleMatchesRecord(workbase, rule, blockedTask!, todayDate)).toBe(true)
    expect(ruleMatchesRecord(workbase, rule, waitingTask!, todayDate)).toBe(false)
  })

  it('matches date windows from the supplied today date', () => {
    const rule: LocalRule = {
      id: 'test-upcoming',
      tableId: 'tasks',
      fieldId: 'dueDate',
      operator: 'isWithin7Days',
      value: '',
      action: 'showInScreen',
      destination: 'timeline',
    }

    expect(getRuleMatchedRecords(workbase, rule, todayDate).map((record) => record.id)).toEqual([
      'task_coi_halifax',
      'task_permit_moncton',
      'task_meeting_charlottetown',
    ])
  })

  it('matches linked-record rules and rejects missing linked targets', () => {
    const rule: LocalRule = {
      id: 'test-linked',
      tableId: 'tasks',
      fieldId: 'community',
      operator: 'linkedTo',
      value: 'community_halifax',
      action: 'showInScreen',
      destination: 'today',
    }
    const missingRule = { ...rule, value: 'missing_community' }

    expect(getRuleMatchedRecords(workbase, rule, todayDate).map((record) => record.id)).toEqual([
      'task_coi_halifax',
    ])
    expect(getRuleValidationMessages(workbase, missingRule)).toEqual(['Linked record missing.'])
  })

  it('limits operator choices by field type', () => {
    const dueDateField = getField(workbase, 'tasks', 'dueDate')
    const communityField = getField(workbase, 'tasks', 'community')

    expect(getRuleOperatorOptionsForField(dueDateField).map((option) => option.value)).toContain('isWithin7Days')
    expect(getRuleOperatorOptionsForField(dueDateField).map((option) => option.value)).not.toContain('linkedTo')
    expect(getRuleOperatorOptionsForField(communityField).map((option) => option.value)).toEqual([
      'isEmpty',
      'linkedTo',
      'notLinkedTo',
      'hasAnyLink',
      'hasNoLink',
    ])
  })

  it('renders computed fields and rule previews consistently', () => {
    const task = getRecord(workbase, 'task_coi_halifax')
    const lookupField = getField(workbase, 'tasks', 'communityEventDate')
    const rule: LocalRule = {
      id: 'test-preview',
      tableId: 'tasks',
      fieldId: 'community',
      operator: 'linkedTo',
      value: 'community_halifax',
      action: 'showInScreen',
      destination: 'today',
    }

    expect(task).toBeDefined()
    expect(lookupField).toBeDefined()
    expect(getFieldDisplayValue(workbase, task!, lookupField!)).toBe('2026-05-22')
    expect(getRulePreview(workbase, rule)).toBe('Work.Community is linked to "Halifax". show in screen: Today.')
  })
})
