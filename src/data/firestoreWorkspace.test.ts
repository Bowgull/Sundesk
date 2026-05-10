import { describe, expect, it } from 'vitest'
import { workbase } from './workbase'
import { getDefaultLocalRules } from './rules'
import {
  getDefaultSundeskEducationState,
} from './educationState'
import {
  createFirestoreWorkspaceSnapshot,
  defaultFirestoreWorkspaceId,
  getDefaultFirestoreBuildViewState,
  getFirestoreWorkspaceCollectionDocumentPath,
  getFirestoreWorkspaceCollectionPath,
  getFirestoreWorkspaceDocumentPath,
  getFirestoreWorkspaceSnapshotPath,
  normalizeFirestoreWorkspaceSnapshot,
  writeFirestoreWorkspaceSnapshot,
  type FirestoreWorkspaceWriter,
} from './firestoreWorkspace'

describe('Firestore workspace persistence helpers', () => {
  it('builds workspace-scoped document paths', () => {
    expect(defaultFirestoreWorkspaceId).toBe('lindsay-sundesk')
    expect(getFirestoreWorkspaceDocumentPath()).toBe('workspaces/lindsay-sundesk')
    expect(getFirestoreWorkspaceSnapshotPath()).toBe('workspaces/lindsay-sundesk/state/current')
    expect(getFirestoreWorkspaceCollectionPath('records')).toBe('workspaces/lindsay-sundesk/records')
    expect(getFirestoreWorkspaceCollectionDocumentPath('records', 'task_1')).toBe('workspaces/lindsay-sundesk/records/task_1')
    expect(getFirestoreWorkspaceCollectionDocumentPath('rules', 'rule_1', 'sandbox')).toBe('workspaces/sandbox/rules/rule_1')
  })

  it('converts local state into a Firestore workspace snapshot', () => {
    const buildViewState = getDefaultFirestoreBuildViewState()
    const educationState = {
      ...getDefaultSundeskEducationState(),
      copyMode: {
        rupaulMode: true,
        updatedAt: '2026-05-10T12:00:00.000Z',
      },
    }
    const snapshot = createFirestoreWorkspaceSnapshot({
      base: workbase,
      rules: getDefaultLocalRules(),
      buildViewState,
      educationState,
      theme: 'coast',
      metadata: {
        updatedAt: '2026-05-10T12:00:00.000Z',
        updatedByUid: 'lindsay',
        updatedByEmail: 'lindsay@example.com',
      },
    })

    expect(snapshot).toMatchObject({
      version: 1,
      workspaceId: 'lindsay-sundesk',
      theme: 'coast',
      metadata: {
        schemaVersion: 1,
        workspaceId: 'lindsay-sundesk',
        updatedAt: '2026-05-10T12:00:00.000Z',
        updatedByUid: 'lindsay',
        updatedByEmail: 'lindsay@example.com',
      },
    })
    expect(snapshot.base).not.toBe(workbase)
    expect(snapshot.base.tables).toHaveLength(workbase.tables.length)
    expect(snapshot.rules).toHaveLength(getDefaultLocalRules().length)
    expect(snapshot.buildViewState).toEqual(buildViewState)
    expect(snapshot.educationState).toEqual(educationState)
  })

  it('normalizes loaded workspace payloads and falls back for invalid slices', () => {
    const normalized = normalizeFirestoreWorkspaceSnapshot({
      version: 1,
      workspaceId: 'lindsay-sundesk',
      base: { tables: [], fields: [], records: [], dependencies: [] },
      rules: [{ id: 'bad-rule' }],
      buildViewState: {
        version: 1,
        selectedBuildTableId: 'tasks',
        visibleFieldIdsByTable: { tasks: ['title'], bad: [2] },
        gridFilter: 42,
        gridSortFieldId: 'dueDate',
        gridSortDirection: 'desc',
        gridGroupFieldId: 'status',
        gridColorFieldId: 'priority',
        gridDensity: 'expanded',
        localGridViews: [{ id: 'bad-view' }],
        viewRenameDrafts: { one: 'Draft', two: 2 },
        activeGridViewId: 'today',
        columnWidths: { title: 180, bad: 'wide' },
      },
      theme: 'not-a-theme',
      educationState: {
        version: 1,
        onboarding: {
          status: 'completed',
          completedStepIds: ['welcome', 1],
        },
        copyMode: {
          rupaulMode: true,
        },
      },
      metadata: {
        updatedAt: '2026-05-10T12:00:00.000Z',
        updatedByUid: 'lindsay',
      },
    })

    expect(normalized.base.tables).toHaveLength(workbase.tables.length)
    expect(normalized.rules).toHaveLength(getDefaultLocalRules().length)
    expect(normalized.buildViewState).toMatchObject({
      selectedBuildTableId: 'tasks',
      visibleFieldIdsByTable: { tasks: ['title'] },
      gridFilter: '',
      gridSortDirection: 'desc',
      gridDensity: 'expanded',
      viewRenameDrafts: { one: 'Draft' },
      columnWidths: { title: 180 },
    })
    expect(normalized.theme).toBe('command-center')
    expect(normalized.educationState.onboarding.status).toBe('completed')
    expect(normalized.educationState.onboarding.completedStepIds).toEqual(['welcome'])
    expect(normalized.educationState.copyMode.rupaulMode).toBe(true)
    expect(normalized.usedFallbacks).toEqual({
      base: true,
      rules: true,
      buildViewState: false,
      theme: true,
      educationState: false,
    })
  })

  it('blocks write helpers unless the explicit write gate is enabled', async () => {
    const writes: string[] = []
    const writer: FirestoreWorkspaceWriter = {
      async setDocument(path) {
        writes.push(path)
      },
    }
    const snapshot = createFirestoreWorkspaceSnapshot({
      base: workbase,
      rules: getDefaultLocalRules(),
      buildViewState: getDefaultFirestoreBuildViewState(),
      theme: 'command-center',
      metadata: {
        updatedAt: '2026-05-10T12:00:00.000Z',
        updatedByUid: 'lindsay',
      },
    })

    await expect(writeFirestoreWorkspaceSnapshot(writer, snapshot, { enabled: false })).rejects.toThrow('Firestore workspace writes are disabled.')
    expect(writes).toEqual([])

    await writeFirestoreWorkspaceSnapshot(writer, snapshot, { enabled: true })
    expect(writes).toEqual(['workspaces/lindsay-sundesk/state/current'])
  })
})
