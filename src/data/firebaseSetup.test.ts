import { describe, expect, it } from 'vitest'
import { getFirebaseLaunchReadinessSummary, getFirebaseSetupState } from './firebaseSetup'

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

describe('firebase launch readiness summary', () => {
  it('marks local work ready while Firebase config still needs setup', () => {
    const summary = getFirebaseLaunchReadinessSummary(getFirebaseSetupState({}), {
      backupRehearsed: true,
      deployApproved: false,
      writeApproved: false,
    })

    expect(summary.items).toEqual([
      {
        id: 'local-backup',
        label: 'Local backup rehearsal',
        detail: 'Backup export and import rehearsal is done.',
        status: 'local-ready',
      },
      {
        id: 'firebase-config',
        label: 'Firebase config',
        detail: '6 config fields missing. Add Firebase config before hosted use.',
        status: 'config-needed',
      },
      {
        id: 'deploy-approval',
        label: 'Deploy approval',
        detail: 'Deploy approval is needed before hosting this build.',
        status: 'deploy-approval-needed',
      },
      {
        id: 'write-approval',
        label: 'Firestore writes',
        detail: 'Write approval is needed before enabling remote writes.',
        status: 'write-approval-needed',
      },
      {
        id: 'no-firebase-writes',
        label: 'No Firebase writes',
        detail: 'Write gate is disabled. No remote writes can run in this build.',
        status: 'local-ready',
      },
    ])
    expect(summary.readyForLaunch).toBe(false)
  })

  it('keeps deploy approval separate from write approval', () => {
    const summary = getFirebaseLaunchReadinessSummary(getFirebaseSetupState(completeEnv), {
      backupRehearsed: true,
      deployApproved: true,
      writeApproved: false,
    })

    expect(summary.items.map((item) => [item.id, item.status])).toEqual([
      ['local-backup', 'local-ready'],
      ['firebase-config', 'local-ready'],
      ['deploy-approval', 'local-ready'],
      ['write-approval', 'write-approval-needed'],
      ['no-firebase-writes', 'local-ready'],
    ])
    expect(summary.readyForLaunch).toBe(false)
  })

  it('marks missing approved accounts as config needed', () => {
    const summary = getFirebaseLaunchReadinessSummary(getFirebaseSetupState({
      ...completeEnv,
      VITE_SUNDESK_ALLOWED_EMAILS: '',
    }), {
      backupRehearsed: true,
      deployApproved: true,
      writeApproved: true,
    })

    expect(summary.items.find((item) => item.id === 'firebase-config')).toMatchObject({
      detail: 'Add approved Google accounts before hosted use.',
      status: 'config-needed',
    })
    expect(summary.readyForLaunch).toBe(false)
  })

  it('requires explicit write approval even when the write gate is enabled', () => {
    const summary = getFirebaseLaunchReadinessSummary(getFirebaseSetupState({
      ...completeEnv,
      VITE_SUNDESK_FIRESTORE_WRITES: 'enabled',
    }), {
      backupRehearsed: true,
      deployApproved: true,
      writeApproved: false,
    })

    expect(summary.items.find((item) => item.id === 'write-approval')).toMatchObject({
      detail: 'Write gate is enabled. Write approval is still needed before remote writes.',
      status: 'write-approval-needed',
    })
    expect(summary.items.find((item) => item.id === 'no-firebase-writes')).toMatchObject({
      detail: 'Write gate is enabled. Confirm write approval before using hosted data.',
      status: 'write-approval-needed',
    })
    expect(summary.readyForLaunch).toBe(false)
  })

  it('keeps launch blocked when the write gate is enabled before remote write use', () => {
    const summary = getFirebaseLaunchReadinessSummary(getFirebaseSetupState({
      ...completeEnv,
      VITE_SUNDESK_FIRESTORE_WRITES: 'enabled',
    }), {
      backupRehearsed: true,
      deployApproved: true,
      writeApproved: true,
    })

    expect(summary.items.map((item) => [item.id, item.status])).toEqual([
      ['local-backup', 'local-ready'],
      ['firebase-config', 'local-ready'],
      ['deploy-approval', 'local-ready'],
      ['write-approval', 'local-ready'],
      ['no-firebase-writes', 'write-approval-needed'],
    ])
    expect(summary.readyForLaunch).toBe(false)
  })
})
