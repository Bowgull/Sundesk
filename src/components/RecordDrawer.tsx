import type { ReactNode } from 'react'
import type { DependencyRelationship } from '../data/dependencies'
import { getDependencyLabel } from '../data/dependencies'
import type { MeetingPrep } from '../data/views'
import type {
  Backlink,
  BaseRecord,
  DependencyLink,
  FieldDefinition,
  RecordReference,
  RecordValue,
  Workbase,
} from '../data/workbase'
import { getRecordContext, getRecordTitle } from '../data/workbase'

type DrawerLinkedRecord = {
  fieldId: string
  fieldLabel: string
  record: RecordReference
}

type DrawerDependency = DependencyLink & {
  direction: string
  record: RecordReference
}

type DependencyDraft = {
  relationship: DependencyRelationship
  toRecordId: string
  reason: string
}

type RecordDrawerProps = {
  activeScreenIsBuild: boolean
  base: Workbase
  dependencyDraft: DependencyDraft
  dependencyPickerRecords: BaseRecord[]
  dependencySearch: string
  drawerBacklinks: Backlink[]
  drawerCommunityBlockers: BaseRecord[]
  drawerCommunityMeetings: BaseRecord[]
  drawerCommunityNextAction: BaseRecord | undefined
  drawerCommunityReadiness: number
  drawerCommunityWaiting: BaseRecord[]
  drawerDateText: string
  drawerDependencies: DrawerDependency[]
  drawerKeyFields: FieldDefinition[]
  drawerLinkedRecords: DrawerLinkedRecord[]
  drawerMeetingPrep: MeetingPrep | null
  drawerStatusText: string
  editableFieldsForSelectedTable: FieldDefinition[]
  getFieldDisplayValue: (record: BaseRecord, field: FieldDefinition) => string
  getPickerRecordMeta: (record: BaseRecord) => string
  isRecordDrawerOpen: boolean
  onClose: () => void
  onCreateDependency: () => void
  onDeleteDependency: (dependencyId: string) => void
  onFlipDependencyDirection: (dependencyId: string) => void
  onOpenRecord: (tableId: string, recordId: string) => void
  onRenderMeetingPrep: (prep: MeetingPrep) => ReactNode
  onRenderRecordInput: (
    field: FieldDefinition,
    value: RecordValue,
    onChange: (fieldId: string, value: RecordValue) => void,
  ) => ReactNode
  onSelectedRecordChange: (fieldId: string, value: RecordValue) => void
  onSetDependencyDraft: (updater: (current: DependencyDraft) => DependencyDraft) => void
  onSetDependencySearch: (value: string) => void
  onUpdateDependency: (dependencyId: string, updates: Partial<DependencyLink>) => void
  selectedDependencyTargetRecord: BaseRecord | null | undefined
  selectedRecord: BaseRecord | null
  selectedTableLabel: string
}

export function RecordDrawer({
  activeScreenIsBuild,
  base,
  dependencyDraft,
  dependencyPickerRecords,
  dependencySearch,
  drawerBacklinks,
  drawerCommunityBlockers,
  drawerCommunityMeetings,
  drawerCommunityNextAction,
  drawerCommunityReadiness,
  drawerCommunityWaiting,
  drawerDateText,
  drawerDependencies,
  drawerKeyFields,
  drawerLinkedRecords,
  drawerMeetingPrep,
  drawerStatusText,
  editableFieldsForSelectedTable,
  getFieldDisplayValue,
  getPickerRecordMeta,
  isRecordDrawerOpen,
  onClose,
  onCreateDependency,
  onDeleteDependency,
  onFlipDependencyDirection,
  onOpenRecord,
  onRenderMeetingPrep,
  onRenderRecordInput,
  onSelectedRecordChange,
  onSetDependencyDraft,
  onSetDependencySearch,
  onUpdateDependency,
  selectedDependencyTargetRecord,
  selectedRecord,
  selectedTableLabel,
}: RecordDrawerProps) {
  const drawerClassName = `record-drawer ${isRecordDrawerOpen ? 'active-record-drawer' : ''} ${!activeScreenIsBuild && isRecordDrawerOpen ? 'floating-record-drawer' : ''}`

  return (
    <section className={drawerClassName} data-testid="record-drawer" id="record">
      <div className="drawer-header">
        <div>
          <span className="eyebrow">{selectedTableLabel || 'Item'}</span>
          <h2>{selectedRecord ? getRecordTitle(base, selectedRecord) : 'Select an item'}</h2>
        </div>
        <div className="drawer-actions">
          <span className="metric-pill">{drawerBacklinks.length} incoming</span>
          <span className="metric-pill">{drawerLinkedRecords.length} connected</span>
          {!activeScreenIsBuild && (
            <button className="ghost" type="button" onClick={onClose}>Close</button>
          )}
        </div>
      </div>

      {selectedRecord ? (
        <>
          <div className="drawer-status-strip" aria-label="Item status">
            <span>{drawerStatusText}</span>
            <strong>{drawerDateText}</strong>
            <small>{drawerLinkedRecords.length} connected. {drawerBacklinks.length} incoming. {drawerDependencies.length} blockers.</small>
          </div>

          {selectedRecord.tableId === 'communities' && (
            <section className="community-detail-command" data-testid="community-detail-command">
              <div className="community-detail-readiness">
                <span>Readiness</span>
                <strong>{drawerCommunityReadiness}%</strong>
                <i aria-hidden="true"><b style={{ width: `${Math.max(8, drawerCommunityReadiness)}%` }} /></i>
              </div>
              <div className="community-detail-metrics">
                <article>
                  <span>Blockers</span>
                  <strong>{drawerCommunityBlockers.length}</strong>
                </article>
                <article>
                  <span>Waiting</span>
                  <strong>{drawerCommunityWaiting.length}</strong>
                </article>
                <article>
                  <span>Meetings</span>
                  <strong>{drawerCommunityMeetings.length}</strong>
                </article>
              </div>
              <div className="community-detail-next">
                <span>Next action</span>
                {drawerCommunityNextAction ? (
                  <button type="button" onClick={() => onOpenRecord(drawerCommunityNextAction.tableId, drawerCommunityNextAction.id)}>
                    <strong>{getRecordTitle(base, drawerCommunityNextAction)}</strong>
                    <small>{getPickerRecordMeta(drawerCommunityNextAction)}</small>
                  </button>
                ) : (
                  <p className="empty-line">Add work, waiting, risks, or meetings.</p>
                )}
              </div>
            </section>
          )}

          <div className="drawer-grid">
            {drawerKeyFields.map((field) => (
              <article className="field-strip" key={field.id}>
                <span>{field.label}</span>
                <strong>{getFieldDisplayValue(selectedRecord, field)}</strong>
                <small className="field-type-chip">Detail</small>
              </article>
            ))}
          </div>

          {drawerMeetingPrep && onRenderMeetingPrep(drawerMeetingPrep)}

          <div className="record-section-grid">
            <section>
              <div className="mini-title">
                <strong>Details</strong>
              </div>
              <div className="record-form">
                {editableFieldsForSelectedTable.map((field) => (
                  <div className="record-field-input-slot" key={field.id}>
                    {onRenderRecordInput(field, selectedRecord.values[field.id], onSelectedRecordChange)}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mini-title">
                <strong>Connected work</strong>
              </div>
              <div className="linked-list">
                {drawerLinkedRecords.length === 0 && <p className="empty-line">Nothing connected yet.</p>}
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

          <div className="record-section-grid">
            <section>
              <div className="mini-title">
                <strong>Related here</strong>
              </div>
              <div className="linked-list">
                {drawerBacklinks.length === 0 && <p className="empty-line">Nothing points here yet.</p>}
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

            <section className="why-card">
              <div className="mini-title">
                <strong>Blockers</strong>
              </div>
              <div className="dependency-editor" data-testid="dependency-editor">
                <label>
                  <span>Blocker type</span>
                  <select
                    value={dependencyDraft.relationship}
                    onChange={(event) =>
                      onSetDependencyDraft((current) => ({
                        ...current,
                        relationship: event.target.value as DependencyRelationship,
                      }))
                    }
                  >
                    <option value="dependsOn">Depends on</option>
                    <option value="blocks">Blocks</option>
                  </select>
                </label>
                <label>
                  <span>Find item</span>
                  <input
                    placeholder="Search items"
                    type="search"
                    value={dependencySearch}
                    onChange={(event) => onSetDependencySearch(event.target.value)}
                  />
                </label>
                {selectedDependencyTargetRecord && (
                  <button
                    className="selected-dependency-target"
                    type="button"
                    onClick={() => onSetDependencyDraft((current) => ({ ...current, toRecordId: '' }))}
                  >
                    <strong>{getRecordTitle(base, selectedDependencyTargetRecord)}</strong>
                    <small>Clear selected item</small>
                  </button>
                )}
                <div className="dependency-picker-list">
                  {dependencyPickerRecords.length === 0 && <p className="empty-note">No items match. Change the search.</p>}
                  {dependencyPickerRecords.slice(0, 6).map((record) => {
                    const table = base.tables.find((tableItem) => tableItem.id === record.tableId)
                    const isSelected = dependencyDraft.toRecordId === record.id

                    return (
                      <button
                        className={isSelected ? 'selected' : ''}
                        key={record.id}
                        type="button"
                        onClick={() => onSetDependencyDraft((current) => ({ ...current, toRecordId: record.id }))}
                      >
                        <strong>{getRecordTitle(base, record)}</strong>
                        <small>{table?.label || record.tableId}. {getRecordContext(record)}</small>
                      </button>
                    )
                  })}
                </div>
                <label className="full-row">
                  <span>Reason</span>
                  <textarea
                    rows={3}
                    value={dependencyDraft.reason}
                    onChange={(event) => onSetDependencyDraft((current) => ({ ...current, reason: event.target.value }))}
                    placeholder="Why this matters"
                  />
                </label>
                <button className="primary" disabled={!dependencyDraft.toRecordId} type="button" onClick={onCreateDependency}>
                  Add blocker
                </button>
              </div>
              {drawerDependencies.length > 0 ? (
                <ol className="editable-dependency-list">
                  {drawerDependencies.map((dependency) => (
                    <li key={dependency.id}>
                      <div>
                        <button
                          className="dependency-record-link"
                          type="button"
                          onClick={() => onOpenRecord(dependency.record.tableId, dependency.record.id)}
                        >
                          {getDependencyLabel(dependency, selectedRecord.id)} {dependency.record.title}.
                        </button>
                        <span>{dependency.record.tableLabel}</span>
                      </div>
                      <label>
                        <span>Blocker type</span>
                        <select
                          value={dependency.relationship}
                          onChange={(event) =>
                            onUpdateDependency(dependency.id, { relationship: event.target.value as DependencyRelationship })
                          }
                        >
                          <option value="dependsOn">Depends on</option>
                          <option value="blocks">Blocks</option>
                        </select>
                      </label>
                      <label>
                        <span>Reason</span>
                        <textarea
                          rows={2}
                          value={dependency.reason}
                          onChange={(event) => onUpdateDependency(dependency.id, { reason: event.target.value })}
                        />
                      </label>
                      <div className="dependency-row-actions">
                        <button type="button" onClick={() => onFlipDependencyDirection(dependency.id)}>Swap direction</button>
                        <button className="danger" type="button" onClick={() => onDeleteDependency(dependency.id)}>Remove</button>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="empty-line">No blockers for this item.</p>
              )}
            </section>
          </div>
        </>
      ) : (
        <p className="empty-note">Create an item in Build to edit it here.</p>
      )}
    </section>
  )
}
