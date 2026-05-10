import type { BaseRecord, FieldDefinition, RecordValue, Workbase } from '../data/workbase'

export type RecordFieldInputProps = {
  base: Workbase
  field: FieldDefinition
  value: RecordValue
  linkedRecordFilters: Record<string, string>
  setLinkedRecordFilters: (updater: (current: Record<string, string>) => Record<string, string>) => void
  getRecord: (base: Workbase, recordId: string) => BaseRecord | undefined
  getRecordContext: (record: BaseRecord) => string
  getRecordTitle: (base: Workbase, record: BaseRecord) => string
  getRecordsForTable: (base: Workbase, tableId: string) => BaseRecord[]
  getPickerRecordLabel: (record: BaseRecord) => string
  getPickerRecordMeta: (record: BaseRecord) => string
  onChange: (fieldId: string, value: RecordValue) => void
  toggleListValue: (values: string[], value: string, allowMultiple?: boolean) => string[]
}

export function RecordFieldInput({
  base,
  field,
  value,
  linkedRecordFilters,
  setLinkedRecordFilters,
  getRecord,
  getRecordContext,
  getRecordTitle,
  getRecordsForTable,
  getPickerRecordLabel,
  getPickerRecordMeta,
  onChange,
  toggleListValue,
}: RecordFieldInputProps) {
  const linkedRecords = field.linkedTableId ? getRecordsForTable(base, field.linkedTableId) : []
  const selectedLinkedIds = Array.isArray(value) ? value : []

  if (field.type === 'linkedRecord') {
    const linkedTable = base.tables.find((table) => table.id === field.linkedTableId)
    const searchKey = `${field.tableId}:${field.id}`
    const searchTerm = linkedRecordFilters[searchKey] || ''
    const normalizedSearchTerm = searchTerm.trim().toLowerCase()
    const selectedRecords = selectedLinkedIds.map((recordId) => getRecord(base, recordId))
    const filteredLinkedRecords = linkedRecords.filter((record) => {
      if (!normalizedSearchTerm) {
        return true
      }

      const title = getRecordTitle(base, record).toLowerCase()
      const context = getRecordContext(record).toLowerCase()

      return title.includes(normalizedSearchTerm) || context.includes(normalizedSearchTerm)
    })

    return (
      <label className="full-row" key={field.id}>
        <span>{field.label}</span>
        <div className="linked-record-picker">
          <div className="linked-picker-head">
            <div>
              <strong>{linkedTable ? linkedTable.label : 'No linked table'}</strong>
              <small>{field.allowMultiple ? `${selectedLinkedIds.length} selected` : selectedLinkedIds.length > 0 ? '1 selected' : 'None selected'}</small>
            </div>
            {linkedTable && <small>{linkedRecords.length} records</small>}
          </div>
          {field.linkedTableId ? (
            <>
              <input
                aria-label={`Search ${field.label}`}
                placeholder={`Search ${linkedTable?.label || 'records'}`}
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setLinkedRecordFilters((current) => ({
                    ...current,
                    [searchKey]: event.target.value,
                  }))
                }
              />
              {selectedLinkedIds.length > 0 && (
                <div className="linked-selected-list" aria-label={`Selected ${field.label}`}>
                  {selectedRecords.map((record, index) => {
                    const recordId = selectedLinkedIds[index]

                    return (
                      <button
                        key={recordId}
                        type="button"
                        onClick={() => onChange(field.id, selectedLinkedIds.filter((selectedId) => selectedId !== recordId))}
                      >
                        <strong>{record ? getRecordTitle(base, record) : recordId}</strong>
                        {record && <small>{getPickerRecordMeta(record)}</small>}
                        <small>Remove</small>
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="linked-choice-grid">
                {linkedRecords.length === 0 && <small>Add a record in the linked table.</small>}
                {linkedRecords.length > 0 && filteredLinkedRecords.length === 0 && <small>No records match. Change the search.</small>}
                {filteredLinkedRecords.map((record) => {
                  const isSelected = selectedLinkedIds.includes(record.id)

                  return (
                    <button
                      className={isSelected ? 'selected' : ''}
                      key={record.id}
                      type="button"
                      onClick={() => onChange(field.id, toggleListValue(selectedLinkedIds, record.id, field.allowMultiple))}
                    >
                      <strong>{getPickerRecordLabel(record)}</strong>
                      <small>{getPickerRecordMeta(record)}</small>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="empty-note">Choose a linked table in field settings.</p>
          )}
        </div>
      </label>
    )
  }

  if (field.type === 'multiSelect' && field.options) {
    const selectedOptions = Array.isArray(value) ? value : []

    return (
      <label className="full-row" key={field.id}>
        <span>{field.label}</span>
        <div className="linked-choice-grid option-choice-grid">
          {field.options.map((option) => {
            const isSelected = selectedOptions.includes(option)

            return (
              <button
                className={isSelected ? 'selected' : ''}
                key={option}
                type="button"
                onClick={() => onChange(field.id, toggleListValue(selectedOptions, option))}
              >
                <strong>{option}</strong>
              </button>
            )
          })}
        </div>
      </label>
    )
  }

  if (field.options) {
    return (
      <label key={field.id}>
        <span>{field.label}</span>
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(field.id, event.target.value)}
        >
          <option value="">Choose</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <label className="checkbox-row" key={field.id}>
        <span>{field.label}</span>
        <input
          checked={Boolean(value)}
          type="checkbox"
          onChange={(event) => onChange(field.id, event.target.checked)}
        />
      </label>
    )
  }

  if (field.type === 'longText') {
    return (
      <label className="full-row" key={field.id}>
        <span>{field.label}</span>
        <textarea
          value={typeof value === 'string' ? value : ''}
          rows={3}
          onChange={(event) => onChange(field.id, event.target.value)}
        />
      </label>
    )
  }

  const inputType = field.type === 'date' ? 'date' : field.type === 'dateTime' ? 'datetime-local' : ['number', 'currency', 'percent', 'rating'].includes(field.type) ? 'number' : field.type === 'url' ? 'url' : 'text'

  return (
    <label key={field.id}>
      <span>{field.label}</span>
      <input
        type={inputType}
        value={typeof value === 'string' || typeof value === 'number' ? value : ''}
        onChange={(event) => onChange(field.id, inputType === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value)}
      />
    </label>
  )
}
