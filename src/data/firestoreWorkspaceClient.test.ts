import { describe, expect, it } from 'vitest'
import type { DocumentReference, Firestore } from 'firebase/firestore'
import { getDefaultLocalRules } from './rules'
import { workbase } from './workbase'
import { getDefaultSundeskEducationState } from './educationState'
import {
  createFirestoreWorkspaceClient,
  createFirestoreWorkspaceSdkDocumentStore,
  type FirestoreWorkspaceDocumentStore,
} from './firestoreWorkspaceClient'
import {
  createFirestoreWorkspaceSnapshot,
  getDefaultFirestoreBuildViewState,
  getFirestoreWorkspaceSnapshotPath,
} from './firestoreWorkspace'

describe('Firestore workspace client', () => {
  it('loads normalized fallback state when the remote workspace is missing', async () => {
    const reads: string[] = []
    const client = createFirestoreWorkspaceClient({
      store: {
        async getDocument(path) {
          reads.push(path)

          return undefined
        },
        async setDocument() {
          throw new Error('Should not write during load.')
        },
      },
    })

    const result = await client.loadCurrent()

    expect(reads).toEqual(['workspaces/lindsay-sundesk/state/current'])
    expect(result.exists).toBe(false)
    expect(result.state.workspaceId).toBe('lindsay-sundesk')
    expect(result.state.base.tables).toHaveLength(workbase.tables.length)
    expect(result.state.rules).toHaveLength(getDefaultLocalRules().length)
    expect(result.state.theme).toBe('command-center')
    expect(result.state.educationState).toEqual(getDefaultSundeskEducationState())
    expect(result.state.usedFallbacks).toEqual({
      base: true,
      rules: true,
      buildViewState: true,
      theme: true,
      educationState: true,
    })
  })

  it('loads a valid remote workspace snapshot from the shared path', async () => {
    const remoteSnapshot = createFirestoreWorkspaceSnapshot({
      base: workbase,
      rules: getDefaultLocalRules(),
      buildViewState: getDefaultFirestoreBuildViewState(),
      theme: 'coast',
      metadata: {
        updatedAt: '2026-05-10T12:00:00.000Z',
        updatedByUid: 'lindsay',
        updatedByEmail: 'lindsay@example.com',
      },
    })
    const client = createFirestoreWorkspaceClient({
      store: {
        async getDocument() {
          return remoteSnapshot
        },
        async setDocument() {
          throw new Error('Should not write during load.')
        },
      },
    })

    const result = await client.loadCurrent()

    expect(result.exists).toBe(true)
    expect(result.path).toBe('workspaces/lindsay-sundesk/state/current')
    expect(result.state).toMatchObject({
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
      usedFallbacks: {
        base: false,
        rules: false,
        buildViewState: false,
        theme: false,
      },
    })
  })

  it('loads normalized fallback state when remote workspace data is malformed', async () => {
    const client = createFirestoreWorkspaceClient({
      store: {
        async getDocument() {
          return {
            workspaceId: 42,
            base: { tables: [], fields: [], records: [], dependencies: [] },
            rules: [{ id: 'bad-rule' }],
            buildViewState: { version: 2 },
            theme: 'nope',
            metadata: {
              updatedAt: 123,
              updatedByUid: false,
            },
          }
        },
        async setDocument() {
          throw new Error('Should not write during load.')
        },
      },
    })

    const result = await client.loadCurrent()

    expect(result.exists).toBe(true)
    expect(result.state.workspaceId).toBe('lindsay-sundesk')
    expect(result.state.base.tables).toHaveLength(workbase.tables.length)
    expect(result.state.rules).toHaveLength(getDefaultLocalRules().length)
    expect(result.state.theme).toBe('command-center')
    expect(result.state.metadata).toEqual({
      schemaVersion: 1,
      workspaceId: 'lindsay-sundesk',
      updatedAt: '',
      updatedByUid: '',
      updatedByEmail: undefined,
    })
    expect(result.state.educationState).toEqual(getDefaultSundeskEducationState())
    expect(result.state.usedFallbacks).toEqual({
      base: true,
      rules: true,
      buildViewState: true,
      theme: true,
      educationState: true,
    })
  })

  it('blocks saves unless the write gate is enabled', async () => {
    const writes: string[] = []
    const client = createFirestoreWorkspaceClient({
      store: {
        async getDocument() {
          return undefined
        },
        async setDocument(path) {
          writes.push(path)
        },
      },
      writeGate: { enabled: false },
    })

    await expect(client.saveCurrent({
      base: workbase,
      rules: getDefaultLocalRules(),
      buildViewState: getDefaultFirestoreBuildViewState(),
      theme: 'command-center',
      metadata: {
        updatedAt: '2026-05-10T12:00:00.000Z',
        updatedByUid: 'lindsay',
      },
    })).rejects.toThrow('Firestore workspace writes are disabled.')
    expect(writes).toEqual([])
  })

  it('saves snapshots to the shared workspace path when the write gate is enabled', async () => {
    const writes: Array<{ path: string, updatedByUid: string, updatedByEmail?: string }> = []
    const client = createFirestoreWorkspaceClient({
      store: {
        async getDocument() {
          return undefined
        },
        async setDocument(path, payload) {
          writes.push({
            path,
            updatedByUid: payload.metadata.updatedByUid,
            updatedByEmail: payload.metadata.updatedByEmail,
          })
        },
      },
      writeGate: { enabled: true },
    })

    const saved = await client.saveCurrent({
      base: workbase,
      rules: getDefaultLocalRules(),
      buildViewState: getDefaultFirestoreBuildViewState(),
      theme: 'graphite',
      metadata: {
        updatedAt: '2026-05-10T12:00:00.000Z',
        updatedByUid: 'lindsay',
        updatedByEmail: 'lindsay@example.com',
      },
    })

    expect(saved.path).toBe(getFirestoreWorkspaceSnapshotPath())
    expect(saved.snapshot.metadata).toMatchObject({
      updatedAt: '2026-05-10T12:00:00.000Z',
      updatedByUid: 'lindsay',
      updatedByEmail: 'lindsay@example.com',
    })
    expect(writes).toEqual([{
      path: 'workspaces/lindsay-sundesk/state/current',
      updatedByUid: 'lindsay',
      updatedByEmail: 'lindsay@example.com',
    }])
  })

  it('creates a lazy Firestore SDK document store from an injected loader', async () => {
    const calls: string[] = []
    const firestoreModule = {
      doc(db: unknown, path: string) {
        calls.push(`doc:${path}`)

        return { db, path } as unknown as DocumentReference
      },
      async getDoc(ref: DocumentReference) {
        const path = (ref as unknown as { path: string }).path
        calls.push(`get:${path}`)

        return {
          exists: () => true,
          data: () => ({ theme: 'coast' }),
        }
      },
      async setDoc(ref: DocumentReference, payload: unknown) {
        const path = (ref as unknown as { path: string }).path

        calls.push(`set:${path}:${typeof payload}`)
      },
    }
    const store: FirestoreWorkspaceDocumentStore = createFirestoreWorkspaceSdkDocumentStore(
      { kind: 'db' } as unknown as Firestore,
      async () => firestoreModule,
    )

    await expect(store.getDocument('workspaces/lindsay-sundesk/state/current')).resolves.toEqual({ theme: 'coast' })
    await store.setDocument('workspaces/lindsay-sundesk/state/current', createFirestoreWorkspaceSnapshot({
      base: workbase,
      rules: getDefaultLocalRules(),
      buildViewState: getDefaultFirestoreBuildViewState(),
      theme: 'coast',
      metadata: {
        updatedAt: '2026-05-10T12:00:00.000Z',
        updatedByUid: 'lindsay',
      },
    }))
    expect(calls).toEqual([
      'doc:workspaces/lindsay-sundesk/state/current',
      'get:workspaces/lindsay-sundesk/state/current',
      'doc:workspaces/lindsay-sundesk/state/current',
      'set:workspaces/lindsay-sundesk/state/current:object',
    ])
  })
})
