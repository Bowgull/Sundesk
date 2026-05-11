import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { RecordDrawer } from './RecordDrawer'
import {
  getBacklinksForRecord,
  getDependencyReferencesForRecord,
  getField,
  getLinkedRecordsForRecord,
  getRecord,
  getRecordContext,
  getRecordReferences,
  workbase,
  type BaseRecord,
  type FieldDefinition,
  type RecordValue,
} from '../data/workbase'

const noop = vi.fn()

function renderDrawer(activeScreenIsBuild: boolean) {
  const selectedRecord = getRecord(workbase, 'task_permit_toronto') as BaseRecord
  const editableFieldsForSelectedTable = workbase.fields.filter((field) => field.tableId === selectedRecord.tableId)
  const drawerKeyFields = ['title', 'status', 'dueDate', 'priority'].flatMap((fieldId) => {
    const field = getField(workbase, selectedRecord.tableId, fieldId)

    return field ? [field] : []
  })

  return renderToStaticMarkup(
    createElement(RecordDrawer, {
      activeScreenIsBuild,
      base: workbase,
      dependencyDraft: {
        relationship: 'dependsOn',
        reason: '',
        toRecordId: '',
      },
      dependencyPickerRecords: getRecordReferences(workbase).slice(0, 4).map((reference) => getRecord(workbase, reference.id)).filter(Boolean) as BaseRecord[],
      dependencySearch: '',
      drawerBacklinks: getBacklinksForRecord(workbase, selectedRecord.id),
      drawerCommunityBlockers: [],
      drawerCommunityMeetings: [],
      drawerCommunityNextAction: undefined,
      drawerCommunityReadiness: 0,
      drawerCommunityWaiting: [],
      drawerDateText: '2026-05-12',
      drawerDependencies: getDependencyReferencesForRecord(workbase, selectedRecord.id),
      drawerKeyFields,
      drawerLinkedRecords: getLinkedRecordsForRecord(workbase, selectedRecord.id),
      drawerMeetingPrep: null,
      drawerStatusText: 'Blocked',
      editableFieldsForSelectedTable,
      getFieldDisplayValue: (record: BaseRecord, field: FieldDefinition) => String(record.values[field.id] || ''),
      getPickerRecordMeta: (record: BaseRecord) => getRecordContext(record),
      isRecordDrawerOpen: true,
      onClose: noop,
      onCreateDependency: noop,
      onDeleteDependency: noop,
      onFlipDependencyDirection: noop,
      onOpenRecord: noop,
      onRenderMeetingPrep: () => null,
      onRenderRecordInput: (field: FieldDefinition, value: RecordValue) => createElement('input', {
        'aria-label': field.label,
        readOnly: true,
        value: String(value || ''),
      }),
      onSelectedRecordChange: noop,
      onSetDependencyDraft: noop,
      onSetDependencySearch: noop,
      onUpdateDependency: noop,
      selectedDependencyTargetRecord: null,
      selectedRecord,
      selectedTableLabel: 'Work',
    }),
  )
}

describe('RecordDrawer', () => {
  it('renders a focused work page in daily mode without the Build editor wall', () => {
    const html = renderDrawer(false)

    expect(html).toContain('floating-record-drawer')
    expect(html).toContain('Send permit follow-up.')
    expect(html).toContain('Blocked')
    expect(html).toContain('Permit missing')
    expect(html).toContain('Connected work')
    expect(html).toContain('Related here')
    expect(html).toContain('Close')
  })

  it('keeps the editable field and blocker controls in Build mode', () => {
    const html = renderDrawer(true)

    expect(html).not.toContain('floating-record-drawer')
    expect(html).toContain('field-type-chip')
    expect(html).toContain('record-form')
    expect(html).toContain('dependency-editor')
    expect(html).not.toContain('Close')
  })
})
