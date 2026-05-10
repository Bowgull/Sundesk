import {
  type LocalRule,
  getRuleOperatorOptionsForField,
  isDateField,
  ruleActionOptions,
  ruleDestinationOptions,
  ruleOperatorNeedsValue,
} from '../data/rules'
import {
  type BaseRecord,
  type Workbase,
  getRecordTitle,
  getRecordsForTable,
} from '../data/workbase'

type BuildRulesPanelProps = {
  base: Workbase
  localRules: LocalRule[]
  expandedRuleId: string
  createLocalRule: () => void
  setExpandedRuleId: (ruleId: string) => void
  updateLocalRule: (ruleId: string, updates: Partial<LocalRule>) => void
  updateLocalRuleField: (ruleId: string, tableId: string, fieldId: string) => void
  deleteLocalRule: (ruleId: string) => void
  getCommandReason: (rule: LocalRule) => string
  getRulePreview: (rule: LocalRule) => string
  getRuleMatchCount: (rule: LocalRule) => number
  getRuleValidationMessages: (rule: LocalRule) => string[]
  getRuleMatchedRecords: (rule: LocalRule) => BaseRecord[]
  openBuildRecord: (tableId: string, recordId: string) => void
}

export function BuildRulesPanel({
  base,
  localRules,
  expandedRuleId,
  createLocalRule,
  setExpandedRuleId,
  updateLocalRule,
  updateLocalRuleField,
  deleteLocalRule,
  getCommandReason,
  getRulePreview,
  getRuleMatchCount,
  getRuleValidationMessages,
  getRuleMatchedRecords,
  openBuildRecord,
}: BuildRulesPanelProps) {
  return (
    <article className="automation-panel build-sidecar" data-testid="rules-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Rules</span>
          <h2>When this happens, do this.</h2>
        </div>
        <button className="primary" type="button" onClick={createLocalRule}>New rule</button>
      </div>
      <div className="rules editable-rules">
        {localRules.map((rule) => {
          const isExpanded = expandedRuleId === rule.id
          const matchedRecords = getRuleMatchedRecords(rule)

          return (
            <article className={isExpanded ? 'expanded-rule-row' : 'compact-rule-row'} data-testid="local-rule-row" key={rule.id}>
              <div className="rule-row-summary">
                <div>
                  <strong>{getCommandReason(rule)}</strong>
                  <small>{getRulePreview(rule)}</small>
                </div>
                <span className="rule-match-count">{getRuleMatchCount(rule)} matches</span>
                <button type="button" onClick={() => setExpandedRuleId(isExpanded ? '' : rule.id)}>
                  {isExpanded ? 'Collapse' : 'Edit'}
                </button>
              </div>
              {isExpanded && (
                <>
                  <label>
                    <span>Table</span>
                    <select
                      value={rule.tableId}
                      onChange={(event) => {
                        const tableId = event.target.value
                        const nextFieldId = base.fields.find((field) => field.tableId === tableId)?.id || ''

                        updateLocalRuleField(rule.id, tableId, nextFieldId)
                      }}
                    >
                      {base.tables.map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Field</span>
                    <select
                      value={rule.fieldId}
                      onChange={(event) => updateLocalRuleField(rule.id, rule.tableId, event.target.value)}
                    >
                      {base.fields
                        .filter((field) => field.tableId === rule.tableId)
                        .map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.label}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    <span>Operator</span>
                    <select
                      value={rule.operator}
                      onChange={(event) => {
                        const operator = event.target.value as LocalRule['operator']

                        updateLocalRule(rule.id, {
                          operator,
                          value: ruleOperatorNeedsValue(operator) ? rule.value : '',
                        })
                      }}
                    >
                      {getRuleOperatorOptionsForField(base.fields.find((field) => field.tableId === rule.tableId && field.id === rule.fieldId))
                        .map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    <span>Value</span>
                    {base.fields.find((field) => field.tableId === rule.tableId && field.id === rule.fieldId)?.type === 'linkedRecord' && ruleOperatorNeedsValue(rule.operator) ? (
                      <select value={rule.value} onChange={(event) => updateLocalRule(rule.id, { value: event.target.value })}>
                        <option value="">Choose record</option>
                        {getRecordsForTable(
                          base,
                          base.fields.find((field) => field.tableId === rule.tableId && field.id === rule.fieldId)?.linkedTableId || '',
                        ).map((record) => (
                          <option key={record.id} value={record.id}>
                            {getRecordTitle(base, record)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        disabled={!ruleOperatorNeedsValue(rule.operator)}
                        type={isDateField(base.fields.find((field) => field.tableId === rule.tableId && field.id === rule.fieldId)) && ruleOperatorNeedsValue(rule.operator) ? 'date' : 'text'}
                        value={rule.value}
                        onChange={(event) => updateLocalRule(rule.id, { value: event.target.value })}
                        placeholder={ruleOperatorNeedsValue(rule.operator) ? 'Value to match' : 'Computed from today'}
                      />
                    )}
                  </label>
                  <label>
                    <span>Action</span>
                    <select
                      value={rule.action}
                      onChange={(event) => updateLocalRule(rule.id, { action: event.target.value as LocalRule['action'] })}
                    >
                      {ruleActionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Destination</span>
                    <select
                      value={rule.destination}
                      onChange={(event) => updateLocalRule(rule.id, { destination: event.target.value as LocalRule['destination'] })}
                    >
                      {ruleDestinationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {getRuleValidationMessages(rule).length > 0 && (
                    <div className="rule-validation-list">
                      {getRuleValidationMessages(rule).map((message) => (
                        <span key={message}>{message}</span>
                      ))}
                    </div>
                  )}
                  {matchedRecords.length > 0 && (
                    <div className="rule-match-list">
                      {matchedRecords.slice(0, 3).map((record) => (
                        <button key={record.id} type="button" onClick={() => openBuildRecord(record.tableId, record.id)}>
                          <strong>{getRecordTitle(base, record)}</strong>
                          <small>{base.tables.find((table) => table.id === record.tableId)?.label || record.tableId}</small>
                        </button>
                      ))}
                    </div>
                  )}
                  <button className="danger" type="button" onClick={() => deleteLocalRule(rule.id)}>Delete</button>
                </>
              )}
            </article>
          )
        })}
      </div>
    </article>
  )
}
