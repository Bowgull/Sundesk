import { describe, expect, it } from 'vitest'
import {
  getFirestoreReadShadowState,
  getFirestoreWriteGateState,
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
      detail: 'Read shadow is requested, but Firebase project config is not present.',
    })
  })

  it('separates read shadow readiness from the write gate', () => {
    expect(getFirestoreReadShadowState({
      VITE_FIREBASE_PROJECT_ID: 'sundesk-local',
      VITE_SUNDESK_FIRESTORE_READ_SHADOW: 'enabled',
    })).toEqual({
      state: 'ready',
      label: 'Ready',
      detail: 'Read shadow can be wired without enabling writes.',
    })
    expect(getFirestoreWriteGateState({
      VITE_FIREBASE_PROJECT_ID: 'sundesk-local',
      VITE_SUNDESK_FIRESTORE_READ_SHADOW: 'enabled',
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
})
