import { describe, expect, it } from 'vitest'
import { getFirebaseSetupState } from './firebaseSetup'

const completeEnv = {
  VITE_FIREBASE_API_KEY: 'key',
  VITE_FIREBASE_AUTH_DOMAIN: 'sundesk.example',
  VITE_FIREBASE_PROJECT_ID: 'sundesk',
  VITE_FIREBASE_STORAGE_BUCKET: 'sundesk.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'sender',
  VITE_FIREBASE_APP_ID: 'app',
  VITE_SUNDESK_ALLOWED_EMAILS: 'owner@example.invalid, helper@example.invalid',
}

describe('firebase setup state', () => {
  it('reports local mode when Firebase and allowlist are absent', () => {
    expect(getFirebaseSetupState({})).toMatchObject({
      allowlistCount: 0,
      configComplete: false,
      nextAction: 'Add Firebase config and approved accounts before hosted use.',
      status: 'local',
      statusLabel: 'Local mode',
      writeGateEnabled: false,
    })
  })

  it('reports partial setup when config or allowlist is missing', () => {
    expect(getFirebaseSetupState({ VITE_FIREBASE_PROJECT_ID: 'sundesk' })).toMatchObject({
      allowlistCount: 0,
      configComplete: false,
      nextAction: 'Finish Firebase config in the private environment.',
      status: 'partial',
      statusLabel: 'Setup incomplete',
    })
    expect(getFirebaseSetupState({ ...completeEnv, VITE_SUNDESK_ALLOWED_EMAILS: '' })).toMatchObject({
      allowlistCount: 0,
      configComplete: true,
      status: 'partial',
    })
  })

  it('reports sign-in ready when config and allowlist are present', () => {
    expect(getFirebaseSetupState(completeEnv)).toMatchObject({
      allowlistCount: 2,
      configComplete: true,
      nextAction: 'Verify Google sign-in before enabling writes.',
      status: 'ready',
      statusLabel: 'Sign-in ready',
      writeGateEnabled: false,
    })
  })

  it('reports write ready only when the explicit write gate is enabled', () => {
    expect(getFirebaseSetupState({
      ...completeEnv,
      VITE_SUNDESK_FIRESTORE_WRITES: 'enabled',
    })).toMatchObject({
      status: 'write-ready',
      statusLabel: 'Write ready',
      nextAction: 'Run a fake-data write smoke test after approval.',
      writeGateEnabled: true,
    })
  })

  it('keeps writes disabled unless the write gate is exactly lowercase enabled', () => {
    expect(getFirebaseSetupState({
      ...completeEnv,
      VITE_SUNDESK_FIRESTORE_WRITES: ' Enabled ',
    })).toMatchObject({
      status: 'ready',
      statusLabel: 'Sign-in ready',
      writeGateEnabled: false,
    })
  })

  it('counts trimmed allowlist emails once', () => {
    expect(getFirebaseSetupState({
      ...completeEnv,
      VITE_SUNDESK_ALLOWED_EMAILS: ' owner@example.invalid, helper@example.invalid, owner@example.invalid , ',
    })).toMatchObject({
      allowlistCount: 2,
      configComplete: true,
      status: 'ready',
    })
  })

  it('keeps partial setup focused on the missing step even when writes are enabled', () => {
    expect(getFirebaseSetupState({
      ...completeEnv,
      VITE_FIREBASE_APP_ID: '',
      VITE_SUNDESK_FIRESTORE_WRITES: 'enabled',
    })).toMatchObject({
      configComplete: false,
      nextAction: 'Finish Firebase config in the private environment.',
      status: 'partial',
      statusLabel: 'Setup incomplete',
      writeGateEnabled: true,
    })

    expect(getFirebaseSetupState({
      ...completeEnv,
      VITE_SUNDESK_ALLOWED_EMAILS: ' , ',
      VITE_SUNDESK_FIRESTORE_WRITES: 'enabled',
    })).toMatchObject({
      allowlistCount: 0,
      configComplete: true,
      nextAction: 'Add approved Google accounts in private config.',
      status: 'partial',
      statusLabel: 'Setup incomplete',
      writeGateEnabled: true,
    })
  })
})
