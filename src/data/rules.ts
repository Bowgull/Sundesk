import {
  type BaseRecord,
  type FieldDefinition,
  type RecordValue,
  type Workbase,
  getLookupPreview,
  getMaterializedLinks,
  getRecord,
  getRecordTitle,
} from './workbase'

export const ruleOperatorOptions = [
  { label: 'Is', value: 'is' },
  { label: 'Is not', value: 'isNot' },
  { label: 'Contains', value: 'contains' },
  { label: 'Is empty', value: 'isEmpty' },
  { label: 'Is today', value: 'isToday' },
  { label: 'Is on or before today', value: 'isOnOrBeforeToday' },
  { label: 'Is before today', value: 'isBeforeToday' },
  { label: 'Is within 7 days', value: 'isWithin7Days' },
  { label: 'Is linked to', value: 'linkedTo' },
  { label: 'Is not linked to', value: 'notLinkedTo' },
  { label: 'Has any link', value: 'hasAnyLink' },
  { label: 'Has no link', value: 'hasNoLink' },
] as const

export const ruleActionOptions = [
  { label: 'Show in screen', value: 'showInScreen' },
  { label: 'Set status', value: 'setStatus' },
  { label: 'Add to prep', value: 'addToPrep' },
] as const

export const ruleDestinationOptions = [
  { label: 'Today', value: 'today' },
  { label: 'Timeline', value: 'timeline' },
  { label: 'Communities', value: 'communities' },
  { label: 'Tasks', value: 'tasks' },
  { label: 'Follow-ups', value: 'followups' },
  { label: 'Meetings', value: 'meetings' },
] as const

export type LocalRule = {
  id: string
  tableId: string
  fieldId: string
  operator: (typeof ruleOperatorOptions)[number]['value']
  value: string
  action: (typeof ruleActionOptions)[number]['value']
  destination: (typeof ruleDestinationOptions)[number]['value']
}

export function getDefaultLocalRules(): LocalRule[] {
  return [
    {
      id: 'rule-overdue-followup',
      tableId: 'followups',
      fieldId: 'status',
      operator: 'is',
      value: 'Waiting',
      action: 'showInScreen',
      destination: 'today',
    },
    {
      id: 'rule-blocked-status',
      tableId: 'tasks',
      fieldId: 'status',
      operator: 'is',
      value: 'Blocked',
      action: 'showInScreen',
      destination: 'today',
    },
    {
      id: 'rule-task-due-today',
      tableId: 'tasks',
      fieldId: 'dueDate',
      operator: 'isToday',
      value: '',
      action: 'showInScreen',
      destination: 'today',
    },
    {
      id: 'rule-task-upcoming',
      tableId: 'tasks',
      fieldId: 'dueDate',
      operator: 'isWithin7Days',
      value: '',
      action: 'showInScreen',
      destination: 'timeline',
    },
    {
      id: 'rule-task-has-community',
      tableId: 'tasks',
      fieldId: 'community',
      operator: 'hasAnyLink',
      value: '',
      action: 'showInScreen',
      destination: 'today',
    },
    {
      id: 'rule-risk-blocks-task',
      tableId: 'risks',
      fieldId: 'blocks',
      operator: 'hasAnyLink',
      value: '',
      action: 'showInScreen',
      destination: 'timeline',
    },
    {
      id: 'rule-meeting-prep',
      tableId: 'meetings',
      fieldId: 'date',
      operator: 'isBeforeToday',
      value: '',
      action: 'addToPrep',
      destination: 'meetings',
    },
    {
      id: 'rule-upcoming-meeting-prep',
      tableId: 'meetings',
      fieldId: 'date',
      operator: 'isWithin7Days',
      value: '',
      action: 'addToPrep',
      destination: 'meetings',
    },
  ]
}

export function isLocalRule(value: unknown): value is LocalRule {
  if (!value || typeof value !== 'object') {
    return false
  }

  const rule = value as Partial<LocalRule>

  return typeof rule.id === 'string' &&
    typeof rule.tableId === 'string' &&
    typeof rule.fieldId === 'string' &&
    ruleOperatorOptions.some((option) => option.value === rule.operator) &&
    typeof rule.value === 'string' &&
    ruleActionOptions.some((option) => option.value === rule.action) &&
    ruleDestinationOptions.some((option) => option.value === rule.destination)
}

export function mergeDefaultLocalRules(rules: LocalRule[]) {
  const ruleIds = new Set(rules.map((rule) => rule.id))
  const missingDefaultRules = getDefaultLocalRules().filter((rule) => !ruleIds.has(rule.id))

  return [...rules, ...missingDefaultRules]
}

export function getStringValue(record: BaseRecord, fieldId: string) {
  const value = record.values[fieldId]

  return typeof value === 'string' ? value : ''
}

export function getNumberValue(record: BaseRecord, fieldId: string) {
  const value = record.values[fieldId]

  return typeof value === 'number' ? value : 0
}

export function isDateField(field?: FieldDefinition) {
  return field?.type === 'date' || field?.type === 'dateTime' || field?.type === 'createdTime' || field?.type === 'lastUpdatedTime'
}

export function isDateRuleOperator(operator: LocalRule['operator']) {
  return operator === 'isToday' ||
    operator === 'isOnOrBeforeToday' ||
    operator === 'isBeforeToday' ||
    operator === 'isWithin7Days'
}

export function isLinkedRecordRuleOperator(operator: LocalRule['operator']) {
  return operator === 'linkedTo' ||
    operator === 'notLinkedTo' ||
    operator === 'hasAnyLink' ||
    operator === 'hasNoLink'
}

export function ruleOperatorNeedsValue(operator: LocalRule['operator']) {
  return operator !== 'isEmpty' &&
    operator !== 'hasAnyLink' &&
    operator !== 'hasNoLink' &&
    !isDateRuleOperator(operator)
}

export function getRuleOperatorOptionsForField(field?: FieldDefinition) {
  if (isDateField(field)) {
    return ruleOperatorOptions.filter((option) => !isLinkedRecordRuleOperator(option.value) && option.value !== 'contains')
  }

  if (field?.type === 'linkedRecord') {
    return ruleOperatorOptions.filter(
      (option) =>
        isLinkedRecordRuleOperator(option.value) ||
        option.value === 'isEmpty',
    )
  }

  return ruleOperatorOptions.filter((option) => !isDateRuleOperator(option.value) && !isLinkedRecordRuleOperator(option.value))
}

export function getRuleDateValue(value: RecordValue) {
  return typeof value === 'string' && value.length >= 10 ? value.slice(0, 10) : ''
}

export function getFirstDateValue(record: BaseRecord) {
  return getStringValue(record, 'dueDate') || getStringValue(record, 'eventDate') || getStringValue(record, 'date')
}

export function sortRecordsByDate(records: BaseRecord[]) {
  return [...records].sort((firstRecord, secondRecord) => getFirstDateValue(firstRecord).localeCompare(getFirstDateValue(secondRecord)))
}

export function getFieldDisplayValue(base: Workbase, record: BaseRecord, field: FieldDefinition) {
  if (field.type === 'lookup') {
    return String(getLookupPreview(base, record.id, field.id) || 'Empty')
  }

  if (field.type === 'count') {
    const count = getMaterializedLinks(base).filter(
      (link) => link.toRecordId === record.id && link.fromFieldId === field.sourceLinkedFieldId,
    ).length

    return String(count)
  }

  if (field.type === 'rollup') {
    const values = getMaterializedLinks(base)
      .filter((link) => link.toRecordId === record.id && link.fromFieldId === field.sourceLinkedFieldId)
      .flatMap((link) => {
        const linkedRecord = getRecord(base, link.fromRecordId)
        const value = field.sourceFieldId && linkedRecord ? linkedRecord.values[field.sourceFieldId] : null

        return typeof value === 'string' || typeof value === 'number' ? [String(value)] : []
      })

    return values.length > 0 ? values.join(', ') : 'Empty'
  }

  const value = record.values[field.id]

  if (Array.isArray(value)) {
    if (field.type === 'multiSelect') {
      return value.length > 0 ? value.join(', ') : 'Empty'
    }

    const titles = value.flatMap((recordId) => {
      const linkedRecord = getRecord(base, recordId)

      return linkedRecord ? [getRecordTitle(base, linkedRecord)] : []
    })

    return titles.length > 0 ? titles.join(', ') : 'Empty'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (value === null || value === '') {
    return 'Empty'
  }

  if (field.type === 'currency' && typeof value === 'number') {
    return `$${value.toLocaleString()}`
  }

  return String(value)
}

export function getRuleValueLabel(base: Workbase, rule: LocalRule) {
  const field = base.fields.find((fieldItem) => fieldItem.tableId === rule.tableId && fieldItem.id === rule.fieldId)

  if (field?.type === 'linkedRecord') {
    const record = getRecord(base, rule.value)

    return record ? getRecordTitle(base, record) : rule.value
  }

  return rule.value
}

export function getRulePreview(base: Workbase, rule: LocalRule) {
  const table = base.tables.find((tableItem) => tableItem.id === rule.tableId)
  const field = base.fields.find((fieldItem) => fieldItem.tableId === rule.tableId && fieldItem.id === rule.fieldId)
  const operator = ruleOperatorOptions.find((option) => option.value === rule.operator)?.label.toLowerCase() || rule.operator
  const action = ruleActionOptions.find((option) => option.value === rule.action)?.label.toLowerCase() || rule.action
  const destination = ruleDestinationOptions.find((option) => option.value === rule.destination)?.label || rule.destination
  const valueText = ruleOperatorNeedsValue(rule.operator) ? ` "${getRuleValueLabel(base, rule) || 'value'}"` : ''

  return `${table?.label || rule.tableId}.${field?.label || rule.fieldId} ${operator}${valueText}. ${action}: ${destination}.`
}

export function getRuleValidationMessages(base: Workbase, rule: LocalRule) {
  const table = base.tables.find((tableItem) => tableItem.id === rule.tableId)
  const field = base.fields.find((fieldItem) => fieldItem.tableId === rule.tableId && fieldItem.id === rule.fieldId)
  const operatorOptions = getRuleOperatorOptionsForField(field)
  const messages: string[] = []

  if (!table) {
    messages.push('Table missing.')
  }

  if (!field) {
    messages.push('Field missing.')
  }

  if (field && !operatorOptions.some((option) => option.value === rule.operator)) {
    messages.push('Operator does not fit this field.')
  }

  if (ruleOperatorNeedsValue(rule.operator) && !rule.value.trim()) {
    messages.push('Value required.')
  }

  if (field?.type === 'linkedRecord' && ruleOperatorNeedsValue(rule.operator)) {
    const linkedRecord = getRecord(base, rule.value)

    if (!linkedRecord || linkedRecord.tableId !== field.linkedTableId) {
      messages.push('Linked record missing.')
    }
  }

  return messages
}

export function ruleMatchesRecord(base: Workbase, rule: LocalRule, record: BaseRecord, todayDate: string) {
  const field = base.fields.find((fieldItem) => fieldItem.tableId === rule.tableId && fieldItem.id === rule.fieldId)

  if (getRuleValidationMessages(base, rule).length > 0 || !field || record.tableId !== rule.tableId) {
    return false
  }

  const value = record.values[field.id]
  const displayValue = getFieldDisplayValue(base, record, field)
  const ruleValue = rule.value.trim().toLowerCase()

  if (rule.operator === 'isEmpty') {
    return value === null || value === '' || (Array.isArray(value) && value.length === 0) || displayValue === 'Empty'
  }

  const ruleDateValue = getRuleDateValue(value)

  if (rule.operator === 'isToday') {
    return ruleDateValue === todayDate
  }

  if (rule.operator === 'isOnOrBeforeToday') {
    return Boolean(ruleDateValue) && ruleDateValue <= todayDate
  }

  if (rule.operator === 'isBeforeToday') {
    return Boolean(ruleDateValue) && ruleDateValue < todayDate
  }

  if (rule.operator === 'isWithin7Days') {
    if (!ruleDateValue) {
      return false
    }

    const date = new Date(`${ruleDateValue}T00:00:00`)
    const today = new Date(`${todayDate}T00:00:00`)
    const differenceInDays = Math.floor((date.getTime() - today.getTime()) / 86400000)

    return differenceInDays >= 0 && differenceInDays <= 7
  }

  if (Array.isArray(value) && field.type === 'linkedRecord') {
    if (rule.operator === 'hasAnyLink') {
      return value.length > 0
    }

    if (rule.operator === 'hasNoLink') {
      return value.length === 0
    }

    if (rule.operator === 'linkedTo') {
      return value.includes(rule.value)
    }

    if (rule.operator === 'notLinkedTo') {
      return !value.includes(rule.value)
    }
  }

  if (Array.isArray(value)) {
    const values = value.map((item) => String(item).toLowerCase())

    if (rule.operator === 'contains') {
      return displayValue.toLowerCase().includes(ruleValue) || values.some((item) => item.includes(ruleValue))
    }

    const hasValue = values.includes(ruleValue) || displayValue.toLowerCase() === ruleValue

    return rule.operator === 'isNot' ? !hasValue : hasValue
  }

  const normalizedValue = displayValue.toLowerCase()

  if (rule.operator === 'contains') {
    return normalizedValue.includes(ruleValue)
  }

  const isMatch = normalizedValue === ruleValue

  return rule.operator === 'isNot' ? !isMatch : isMatch
}

export function getRuleMatchedRecords(base: Workbase, rule: LocalRule, todayDate: string) {
  return base.records.filter((record) => ruleMatchesRecord(base, rule, record, todayDate))
}

export function getRuleMatchCount(base: Workbase, rule: LocalRule, todayDate: string) {
  return getRuleMatchedRecords(base, rule, todayDate).length
}
