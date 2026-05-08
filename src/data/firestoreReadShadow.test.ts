import { describe, expect, it } from 'vitest'
import {
  compareFirestoreReadShadowCounts,
  firestoreReadShadowCollections,
  getFirestoreReadShadowState,
  getFirestoreWriteGateState,
  loadFirestoreReadShadow,
} from './firestoreReadShadow'

describe('Firestore read shadow gates', () => {
  it('keeps reads and writes off by default', () => {
    expect(getFirestoreReadShadowState({})).toEqual({
      state: 'off',
      label: 'Off',
      detail: 'Local storage is the active source.',
    })
    expect(getFirestoreWriteGateState({})).toEqual({
      enabled: false,
      label: 'Disabled',
      detail: 'No Firestore writes can run in this build.',
    })
  })

  it('requires Firebase config before read shadow can be ready', () => {
    expect(getFirestoreReadShadowState({ VITE_SUNDESK_FIRESTORE_READ_SHADOW: 'enabled' })).toEqual({
      state: 'missing-config',
      label: 'Missing config',
      detail: 'Read shadow needs Firebase project config and a user id.',
    })
  })

  it('separates read shadow readiness from the write gate', () => {
    expect(getFirestoreReadShadowState({
      VITE_FIREBASE_PROJECT_ID: 'sundesk-local',
      VITE_SUNDESK_FIRESTORE_READ_SHADOW: 'enabled',
      VITE_SUNDESK_FIRESTORE_READ_SHADOW_USER_ID: 'local-user',
    })).toEqual({
      state: 'ready',
      label: 'Ready',
      detail: 'Read shadow can load remote counts without enabling writes.',
    })
    expect(getFirestoreWriteGateState({
      VITE_FIREBASE_PROJECT_ID: 'sundesk-local',
      VITE_SUNDESK_FIRESTORE_READ_SHADOW: 'enabled',
      VITE_SUNDESK_FIRESTORE_READ_SHADOW_USER_ID: 'local-user',
    }).enabled).toBe(false)
  })

  it('only opens the write gate with the explicit write flag', () => {
    expect(getFirestoreWriteGateState({ VITE_SUNDESK_FIRESTORE_WRITES: 'true' }).enabled).toBe(false)
    expect(getFirestoreWriteGateState({ VITE_SUNDESK_FIRESTORE_WRITES: 'enabled' })).toEqual({
      enabled: true,
      label: 'Enabled',
      detail: 'Firestore writes are allowed by environment gate.',
    })
  })

  it('loads read-shadow counts without opening the write gate', async () => {
    const paths: string[] = []
    const state = await loadFirestoreReadShadow(
      {
        async listCollection(path) {
          paths.push(path)

          return { count: path.endsWith('/records') ? 3 : 0 }
        },
      },
      {
        VITE_FIREBASE_PROJECT_ID: 'sundesk-local',
        VITE_SUNDESK_FIRESTORE_READ_SHADOW: 'enabled',
        VITE_SUNDESK_FIRESTORE_READ_SHADOW_USER_ID: 'local-user',
      },
    )

    expect(paths).toEqual(firestoreReadShadowCollections.map((collectionName) => `users/local-user/${collectionName}`))
    expect(state).toEqual({
      state: 'loaded',
      label: 'Loaded',
      detail: '3 remote documents counted. Local storage is still active.',
      collections: firestoreReadShadowCollections.map((collectionName) => ({
        name: collectionName,
        count: collectionName === 'records' ? 3 : 0,
      })),
    })
  })

  it('keeps local state active when read shadow fails', async () => {
    const state = await loadFirestoreReadShadow(
      {
        async listCollection() {
          throw new Error('Permission denied.')
        },
      },
      {
        VITE_FIREBASE_PROJECT_ID: 'sundesk-local',
        VITE_SUNDESK_FIRESTORE_READ_SHADOW: 'enabled',
        VITE_SUNDESK_FIRESTORE_READ_SHADOW_USER_ID: 'local-user',
      },
    )

    expect(state).toEqual({
      state: 'error',
      label: 'Read failed',
      detail: 'Permission denied. Local storage is still active.',
    })
  })

  it('compares remote counts against local engine counts', () => {
    expect(compareFirestoreReadShadowCounts(
      [
        { name: 'Tables', count: 6 },
        { name: 'Fields', count: 22 },
        { name: 'Records', count: 14 },
        { name: 'Dependencies', count: 2 },
        { name: 'Rules', count: 5 },
        { name: 'Saved views', count: 1 },
      ],
      [
        { name: 'tables', count: 6 },
        { name: 'fields', count: 20 },
        { name: 'records', count: 14 },
        { name: 'dependencies', count: 0 },
        { name: 'rules', count: 5 },
        { name: 'views', count: 1 },
      ],
    )).toEqual([
      { name: 'tables', local: 6, remote: 6, delta: 0, status: 'matched' },
      { name: 'fields', local: 22, remote: 20, delta: -2, status: 'different' },
      { name: 'records', local: 14, remote: 14, delta: 0, status: 'matched' },
      { name: 'dependencies', local: 2, remote: 0, delta: -2, status: 'different' },
      { name: 'rules', local: 5, remote: 5, delta: 0, status: 'matched' },
      { name: 'views', local: 1, remote: 1, delta: 0, status: 'matched' },
    ])
  })
})
