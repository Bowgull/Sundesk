import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { getCopyModeText, type CopyEntryId } from '../data/copyMode'
import type {
  CheckboxColor,
  CheckboxIcon,
  FieldDefinition,
  FieldType,
  TableDefinition,
  Workbase,
} from '../data/workbase'

export type BuildModalKind =
  | ''
  | 'table'
  | 'tableSettings'
  | 'deleteTable'
  | 'field'
  | 'fieldSettings'
  | 'deleteField'
  | 'record'
  | 'resetLocalData'

export type TableDraft = {
  label: string
  description: string
}

export type FieldDraft = {
  label: string
  type: FieldType
  options: string
  checkboxIcon: CheckboxIcon
  checkboxColor: CheckboxColor
  linkedTableId: string
  allowMultiple: boolean
  sourceLinkedFieldId: string
  sourceFieldId: string
}

export type FieldTypeOption = {
  label: string
  value: FieldType
}

export type FieldBehaviorOption = FieldTypeOption & {
  description: string
}

export type CheckboxIconOption = {
  label: string
  value: CheckboxIcon
}

export type CheckboxColorOption = {
  label: string
  value: CheckboxColor
}

export type BuildModalsProps = {
  base: Workbase
  buildModal: BuildModalKind
  checkboxColorOptions: readonly CheckboxColorOption[]
  checkboxIconOptions: readonly CheckboxIconOption[]
  closeBuildModal: () => void
  createField: () => void
  createTable: () => void
  deleteField: (field: FieldDefinition) => void
  deleteTable: (tableId: string) => void
  effectiveSourceLinkedFieldId: string
  fieldBehaviorOptions: readonly FieldBehaviorOption[]
  fieldDraft: FieldDraft
  fieldTypeOptions: readonly FieldTypeOption[]
  linkedFieldsForSelectedTable: readonly FieldDefinition[]
  optionFieldTypes: readonly FieldType[]
  parseOptions: (value: string) => string[]
  pendingDeleteField: FieldDefinition | undefined
  pendingDeleteTable: TableDefinition | undefined
  renameTable: () => void
  renderCheckboxIcon: (icon: CheckboxIcon) => ReactNode
  resetLocalWorkbase: () => void
  rupaulMode: boolean
  selectedBuildTable: TableDefinition | undefined
  setFieldDraft: Dispatch<SetStateAction<FieldDraft>>
  setTableDraft: Dispatch<SetStateAction<TableDraft>>
  setTableSettingsDraft: Dispatch<SetStateAction<TableDraft>>
  settingsField: FieldDefinition | undefined
  sourceFields: readonly FieldDefinition[]
  tableDraft: TableDraft
  tableSettingsDraft: TableDraft
  updateField: (fieldId: string, updates: Partial<FieldDefinition>) => void
}

export function BuildModals({
  base,
  buildModal,
  checkboxColorOptions,
  checkboxIconOptions,
  closeBuildModal,
  createField,
  createTable,
  deleteField,
  deleteTable,
  effectiveSourceLinkedFieldId,
  fieldBehaviorOptions,
  fieldDraft,
  fieldTypeOptions,
  linkedFieldsForSelectedTable,
  optionFieldTypes,
  parseOptions,
  pendingDeleteField,
  pendingDeleteTable,
  renameTable,
  renderCheckboxIcon,
  resetLocalWorkbase,
  rupaulMode,
  selectedBuildTable,
  setFieldDraft,
  setTableDraft,
  setTableSettingsDraft,
  settingsField,
  sourceFields,
  tableDraft,
  tableSettingsDraft,
  updateField,
}: BuildModalsProps) {
  const copyButtonProps = (copyId: CopyEntryId) => {
    const plain = getCopyModeText(copyId, false)

    return {
      'aria-label': plain,
      'data-copy-plain': plain,
      title: plain,
    }
  }
  const copyButtonText = (copyId: CopyEntryId) => getCopyModeText(copyId, rupaulMode)

  return (
    <>
      {buildModal === 'table' && (
        <div className="modal-backdrop" role="presentation">
          <section className="build-modal" role="dialog" aria-modal="true" aria-label="Add table">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Table</span>
                <h2>Add table.</h2>
              </div>
              <button className="ghost" {...copyButtonProps('button.close')} type="button" onClick={closeBuildModal}>{copyButtonText('button.close')}</button>
            </div>
            <div className="build-form table-builder-form">
              <label>
                <span>Table name</span>
                <input
                  value={tableDraft.label}
                  onChange={(event) => setTableDraft((current) => ({ ...current, label: event.target.value }))}
                  placeholder="Partners"
                />
              </label>
              <label>
                <span>Purpose</span>
                <input
                  value={tableDraft.description}
                  onChange={(event) => setTableDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="People or groups tied to the work."
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="ghost" {...copyButtonProps('button.cancel')} type="button" onClick={closeBuildModal}>{copyButtonText('button.cancel')}</button>
              <button className="primary" {...copyButtonProps('button.addTable')} type="button" onClick={createTable}>{copyButtonText('button.addTable')}</button>
            </div>
          </section>
        </div>
      )}

      {buildModal === 'tableSettings' && selectedBuildTable && (
        <div className="modal-backdrop" role="presentation">
          <section className="build-modal" role="dialog" aria-modal="true" aria-label="Table settings">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Table</span>
                <h2>Rename table.</h2>
              </div>
              <button className="ghost" {...copyButtonProps('button.close')} type="button" onClick={closeBuildModal}>{copyButtonText('button.close')}</button>
            </div>
            <div className="build-form table-builder-form">
              <label>
                <span>Table name</span>
                <input
                  value={tableSettingsDraft.label}
                  onChange={(event) => setTableSettingsDraft((current) => ({ ...current, label: event.target.value }))}
                />
              </label>
              <label>
                <span>Purpose</span>
                <input
                  value={tableSettingsDraft.description}
                  onChange={(event) => setTableSettingsDraft((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="ghost" {...copyButtonProps('button.cancel')} type="button" onClick={closeBuildModal}>{copyButtonText('button.cancel')}</button>
              <button className="primary" {...copyButtonProps('button.saveTable')} type="button" onClick={renameTable}>{copyButtonText('button.saveTable')}</button>
            </div>
          </section>
        </div>
      )}

      {buildModal === 'deleteTable' && pendingDeleteTable && (
        <div className="modal-backdrop" role="presentation">
          <section className="build-modal confirm-modal" role="dialog" aria-modal="true" aria-label="Delete table">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Delete</span>
                <h2>Delete {pendingDeleteTable.label}.</h2>
              </div>
            </div>
            <p>This removes the table, its fields, its records, its saved views, and any links pointing to those records.</p>
            <p>This cannot be undone in this local build.</p>
            <div className="modal-actions">
              <button className="ghost" {...copyButtonProps('button.cancel')} type="button" onClick={closeBuildModal}>{copyButtonText('button.cancel')}</button>
              <button className="danger" {...copyButtonProps('button.deleteTable')} type="button" onClick={() => deleteTable(pendingDeleteTable.id)}>{copyButtonText('button.deleteTable')}</button>
            </div>
          </section>
        </div>
      )}

      {buildModal === 'resetLocalData' && (
        <div className="modal-backdrop" role="presentation">
          <section className="build-modal confirm-modal" role="dialog" aria-modal="true" aria-label="Reset local data">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Reset</span>
                <h2>Reset local data.</h2>
              </div>
            </div>
            <p>This restores the starter workbase in this browser.</p>
            <p>Saved views and rules stay local. Record, table, and field edits return to the starter set.</p>
            <div className="modal-actions">
              <button className="ghost" {...copyButtonProps('button.cancel')} type="button" onClick={closeBuildModal}>{copyButtonText('button.cancel')}</button>
              <button className="danger" {...copyButtonProps('button.resetLocalData')} type="button" onClick={resetLocalWorkbase}>{copyButtonText('button.resetLocalData')}</button>
            </div>
          </section>
        </div>
      )}

      {buildModal === 'field' && (
        <div className="modal-backdrop" role="presentation">
          <section className="build-modal" role="dialog" aria-modal="true" aria-label="Add field">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Column behavior</span>
                <h2>Choose what this column does.</h2>
                <p className="modal-lede">Start with the behavior. Sundesk handles the field type underneath.</p>
              </div>
              <button className="ghost" {...copyButtonProps('button.close')} type="button" onClick={closeBuildModal}>{copyButtonText('button.close')}</button>
            </div>
            <div className="field-behavior-grid" aria-label="Column behavior choices">
              {fieldBehaviorOptions.map((option) => (
                <button
                  aria-pressed={fieldDraft.type === option.value}
                  className={fieldDraft.type === option.value ? 'selected' : ''}
                  key={option.value}
                  type="button"
                  onClick={() => setFieldDraft((current) => ({
                    ...current,
                    type: option.value,
                    sourceLinkedFieldId: linkedFieldsForSelectedTable[0]?.id || '',
                    sourceFieldId: '',
                  }))}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>
            <div className="build-form field-builder-form">
              <label>
                <span>Column name</span>
                <input
                  aria-label="Field name"
                  value={fieldDraft.label}
                  onChange={(event) => setFieldDraft((current) => ({ ...current, label: event.target.value }))}
                  placeholder="COI status"
                />
              </label>
              <label>
                <span>Behavior type</span>
                <select
                  aria-label="Type"
                  data-onboarding-target="field-type-menu"
                  value={fieldDraft.type}
                  onChange={(event) => {
                    const type = event.target.value as FieldType
                    setFieldDraft((current) => ({
                      ...current,
                      type,
                      sourceLinkedFieldId: linkedFieldsForSelectedTable[0]?.id || '',
                      sourceFieldId: '',
                    }))
                  }}
                >
                  {fieldTypeOptions.map((fieldType) => (
                    <option key={fieldType.value} value={fieldType.value}>
                      {fieldType.label}
                    </option>
                  ))}
                </select>
              </label>
              {optionFieldTypes.includes(fieldDraft.type) && (
                <label className="full-row">
                  <span>Options</span>
                  <textarea
                    value={fieldDraft.options}
                    onChange={(event) => setFieldDraft((current) => ({ ...current, options: event.target.value }))}
                    rows={3}
                  />
                </label>
              )}
              {fieldDraft.type === 'checkbox' && (
                <>
                  <label className="full-row">
                    <span>Icon</span>
                    <div className="checkbox-style-grid">
                      {checkboxIconOptions.map((option) => (
                        <button
                          aria-label={option.label}
                          aria-pressed={fieldDraft.checkboxIcon === option.value}
                          className={fieldDraft.checkboxIcon === option.value ? 'selected' : ''}
                          data-onboarding-target={`checkbox-icon-${option.value}`}
                          key={option.value}
                          type="button"
                          onClick={() => setFieldDraft((current) => ({ ...current, checkboxIcon: option.value }))}
                        >
                          {renderCheckboxIcon(option.value)}
                          <span className="selection-mark" aria-hidden="true">✓</span>
                        </button>
                      ))}
                    </div>
                  </label>
                  <label className="full-row">
                    <span>Colour</span>
                    <div className="checkbox-color-grid">
                      {checkboxColorOptions.map((option) => (
                        <button
                          aria-label={`Checkbox colour option ${checkboxColorOptions.indexOf(option) + 1}`}
                          aria-pressed={fieldDraft.checkboxColor === option.value}
                          className={`check-${option.value} ${fieldDraft.checkboxColor === option.value ? 'selected' : ''}`}
                          data-onboarding-target="checkbox-colour-swatch"
                          key={option.value}
                          type="button"
                          onClick={() => setFieldDraft((current) => ({ ...current, checkboxColor: option.value }))}
                        >
                          <span className="selection-mark" aria-hidden="true">✓</span>
                        </button>
                      ))}
                    </div>
                  </label>
                </>
              )}
              {fieldDraft.type === 'linkedRecord' && (
                <>
                  <label>
                    <span>Linked table</span>
                    <select
                      value={fieldDraft.linkedTableId}
                      onChange={(event) => setFieldDraft((current) => ({ ...current, linkedTableId: event.target.value }))}
                    >
                      {base.tables
                        .filter((table) => table.id !== selectedBuildTable?.id)
                        .map((table) => (
                          <option key={table.id} value={table.id}>
                            {table.label}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="checkbox-row">
                    <span>Allow multiple linked records</span>
                    <input
                      checked={fieldDraft.allowMultiple}
                      type="checkbox"
                      onChange={(event) => setFieldDraft((current) => ({ ...current, allowMultiple: event.target.checked }))}
                    />
                  </label>
                </>
              )}
              {(fieldDraft.type === 'lookup' || fieldDraft.type === 'rollup' || fieldDraft.type === 'count') && (
                <label>
                  <span>Source link</span>
                  <select
                    value={effectiveSourceLinkedFieldId}
                    onChange={(event) => setFieldDraft((current) => ({ ...current, sourceLinkedFieldId: event.target.value, sourceFieldId: '' }))}
                  >
                    {linkedFieldsForSelectedTable.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {(fieldDraft.type === 'lookup' || fieldDraft.type === 'rollup') && (
                <label>
                  <span>Source field</span>
                  <select
                    value={fieldDraft.sourceFieldId || sourceFields[0]?.id || ''}
                    onChange={(event) => setFieldDraft((current) => ({ ...current, sourceFieldId: event.target.value }))}
                  >
                    {sourceFields.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <div className="modal-actions">
              <button className="ghost" {...copyButtonProps('button.cancel')} type="button" onClick={closeBuildModal}>{copyButtonText('button.cancel')}</button>
              <button className="primary" {...copyButtonProps('button.addField')} type="button" onClick={createField}>{copyButtonText('button.addField')}</button>
            </div>
          </section>
        </div>
      )}

      {buildModal === 'fieldSettings' && settingsField && (
        <div className="modal-backdrop" role="presentation">
          <section className="build-modal" role="dialog" aria-modal="true" aria-label="Field settings">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Column behavior</span>
                <h2>{settingsField.label}</h2>
                <p className="modal-lede">Change what this column does without leaving the grid.</p>
              </div>
              <button className="ghost" {...copyButtonProps('button.close')} type="button" onClick={closeBuildModal}>{copyButtonText('button.close')}</button>
            </div>
            <div className="field-behavior-grid" aria-label="Column behavior choices">
              {fieldBehaviorOptions.map((option) => (
                <button
                  aria-pressed={settingsField.type === option.value}
                  className={settingsField.type === option.value ? 'selected' : ''}
                  key={option.value}
                  type="button"
                  onClick={() => updateField(settingsField.id, {
                    type: option.value,
                    sourceLinkedFieldId: linkedFieldsForSelectedTable[0]?.id || '',
                    sourceFieldId: '',
                  })}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>
            <div className="build-form field-builder-form">
              <label>
                <span>Column name</span>
                <input
                  aria-label="Field name"
                  value={settingsField.label}
                  onChange={(event) => updateField(settingsField.id, { label: event.target.value })}
                />
              </label>
              <label>
                <span>Behavior type</span>
                <select
                  aria-label="Type"
                  data-onboarding-target="field-type-menu"
                  value={settingsField.type}
                  onChange={(event) => updateField(settingsField.id, { type: event.target.value as FieldType })}
                >
                  {fieldTypeOptions.map((fieldType) => (
                    <option key={fieldType.value} value={fieldType.value}>
                      {fieldType.label}
                    </option>
                  ))}
                </select>
              </label>
              {optionFieldTypes.includes(settingsField.type) && (
                <label className="full-row">
                  <span>Options</span>
                  <textarea
                    value={(settingsField.options || []).join(', ')}
                    rows={3}
                    onChange={(event) => updateField(settingsField.id, { options: parseOptions(event.target.value) })}
                  />
                </label>
              )}
              {settingsField.type === 'checkbox' && (
                <>
                  <label className="full-row">
                    <span>Icon</span>
                    <div className="checkbox-style-grid">
                      {checkboxIconOptions.map((option) => (
                        <button
                          aria-label={option.label}
                          aria-pressed={(settingsField.checkboxIcon || 'check') === option.value}
                          className={(settingsField.checkboxIcon || 'check') === option.value ? 'selected' : ''}
                          data-onboarding-target={`checkbox-icon-${option.value}`}
                          key={option.value}
                          type="button"
                          onClick={() => updateField(settingsField.id, { checkboxIcon: option.value })}
                        >
                          {renderCheckboxIcon(option.value)}
                          <span className="selection-mark" aria-hidden="true">✓</span>
                        </button>
                      ))}
                    </div>
                  </label>
                  <label className="full-row">
                    <span>Colour</span>
                    <div className="checkbox-color-grid">
                      {checkboxColorOptions.map((option) => (
                        <button
                          aria-label={`Checkbox colour option ${checkboxColorOptions.indexOf(option) + 1}`}
                          aria-pressed={(settingsField.checkboxColor || 'lime') === option.value}
                          className={`check-${option.value} ${(settingsField.checkboxColor || 'lime') === option.value ? 'selected' : ''}`}
                          data-onboarding-target="checkbox-colour-swatch"
                          key={option.value}
                          type="button"
                          onClick={() => updateField(settingsField.id, { checkboxColor: option.value })}
                        >
                          <span className="selection-mark" aria-hidden="true">✓</span>
                        </button>
                      ))}
                    </div>
                  </label>
                </>
              )}
              {settingsField.type === 'linkedRecord' && (
                <>
                  <label>
                    <span>Linked table</span>
                    <select
                      value={settingsField.linkedTableId || ''}
                      onChange={(event) => updateField(settingsField.id, { linkedTableId: event.target.value })}
                    >
                      {base.tables
                        .filter((table) => table.id !== selectedBuildTable?.id)
                        .map((table) => (
                          <option key={table.id} value={table.id}>
                            {table.label}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="checkbox-row">
                    <span>Allow multiple linked records</span>
                    <input
                      checked={settingsField.allowMultiple ?? true}
                      type="checkbox"
                      onChange={(event) => updateField(settingsField.id, { allowMultiple: event.target.checked })}
                    />
                  </label>
                </>
              )}
            </div>
            <div className="modal-actions">
              <button className="primary" {...copyButtonProps('button.done')} type="button" onClick={closeBuildModal}>{copyButtonText('button.done')}</button>
            </div>
          </section>
        </div>
      )}

      {buildModal === 'deleteField' && pendingDeleteField && (
        <div className="modal-backdrop" role="presentation">
          <section className="build-modal confirm-modal" role="dialog" aria-modal="true" aria-label="Delete field">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Delete</span>
                <h2>Delete field.</h2>
              </div>
            </div>
            <p>This removes the field from every record in this table.</p>
            <p>This cannot be undone in this local build.</p>
            <div className="modal-actions">
              <button className="ghost" {...copyButtonProps('button.cancel')} type="button" onClick={closeBuildModal}>{copyButtonText('button.cancel')}</button>
              <button className="danger" {...copyButtonProps('button.deleteField')} type="button" onClick={() => deleteField(pendingDeleteField)}>{copyButtonText('button.deleteField')}</button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
