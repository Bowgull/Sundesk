import type { ReactNode } from 'react'
import type { Backlink, BaseRecord, FieldDefinition, RecordReference, RecordValue } from '../data/workbase'

export type RecordModalLinkedRecord = {
  fieldId: string
  fieldLabel: string
  record: RecordReference
}

export type RecordModalProps = {
  drawerBacklinks: readonly Backlink[]
  drawerLinkedRecords: readonly RecordModalLinkedRecord[]
  editableFieldsForSelectedTable: readonly FieldDefinition[]
  isCreatingRecord: boolean
  isOpen: boolean
  onClose: () => void
  onCreateRecord: () => void
  onOpenRecord: (tableId: string, recordId: string) => void
  onRenderRecordInput: (
    field: FieldDefinition,
    value: RecordValue,
    onChange: (fieldId: string, value: RecordValue) => void,
  ) => ReactNode
  onSelectedRecordChange: (fieldId: string, value: RecordValue) => void
  onUpdateRecordDraft: (fieldId: string, value: RecordValue) => void
  recordDraft: Record<string, RecordValue>
  selectedRecord: BaseRecord | null | undefined
  selectedRecordTitle: string
  selectedTableLabel: string | undefined
}

export function RecordModal({
  drawerBacklinks,
  drawerLinkedRecords,
  editableFieldsForSelectedTable,
  isCreatingRecord,
  isOpen,
  onClose,
  onCreateRecord,
  onOpenRecord,
  onRenderRecordInput,
  onSelectedRecordChange,
  onUpdateRecordDraft,
  recordDraft,
  selectedRecord,
  selectedRecordTitle,
  selectedTableLabel,
}: RecordModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="build-modal record-modal" data-testid="record-modal" role="dialog" aria-modal="true" aria-label="Record editor">
        <div className="modal-header">
          <div>
            <span className="eyebrow">{selectedTableLabel}</span>
            <h2>{isCreatingRecord || !selectedRecord ? 'New record.' : selectedRecordTitle}</h2>
          </div>
          <button className="ghost" type="button" onClick={onClose}>Close</button>
        </div>
        <div className="record-form">
          {isCreatingRecord || !selectedRecord
            ? editableFieldsForSelectedTable.map((field) => (
                <div className="record-field-input-slot" key={field.id}>
                  {onRenderRecordInput(field, recordDraft[field.id], onUpdateRecordDraft)}
                </div>
              ))
            : editableFieldsForSelectedTable.map((field) => (
                <div className="record-field-input-slot" key={field.id}>
                  {onRenderRecordInput(field, selectedRecord.values[field.id], onSelectedRecordChange)}
                </div>
              ))}
        </div>
        {!isCreatingRecord && selectedRecord && (
          <div className="record-modal-links">
            <section>
              <strong>Backlinks</strong>
              <div className="linked-list">
                {drawerBacklinks.length === 0 && <p className="empty-note">No records point here.</p>}
                {drawerBacklinks.map((backlink) => (
                  <button
                    className="linked-record-card"
                    key={`${backlink.fromRecord.id}-${backlink.fieldId}`}
                    type="button"
                    onClick={() => onOpenRecord(backlink.fromRecord.tableId, backlink.fromRecord.id)}
                  >
                    <span className="pill prep">{backlink.fromRecord.tableLabel}</span>
                    <strong>{backlink.fromRecord.title}</strong>
                    <small>{backlink.fieldLabel}. {backlink.fromRecord.context}</small>
                  </button>
                ))}
              </div>
            </section>
            <section>
              <strong>Linked records</strong>
              <div className="linked-list">
                {drawerLinkedRecords.length === 0 && <p className="empty-note">No linked records selected.</p>}
                {drawerLinkedRecords.map((link) => (
                  <button
                    className="linked-record-card"
                    key={`${link.fieldId}-${link.record.id}`}
                    type="button"
                    onClick={() => onOpenRecord(link.record.tableId, link.record.id)}
                  >
                    <span className="pill waiting">{link.record.tableLabel}</span>
                    <strong>{link.record.title}</strong>
                    <small>{link.fieldLabel}. {link.record.context}</small>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
        <div className="modal-actions">
          <button className="ghost" type="button" onClick={onClose}>Cancel</button>
          {isCreatingRecord ? (
            <button className="primary" type="button" onClick={onCreateRecord}>Add record</button>
          ) : (
            <button className="primary" type="button" onClick={onClose}>Done</button>
          )}
        </div>
      </section>
    </div>
  )
}
