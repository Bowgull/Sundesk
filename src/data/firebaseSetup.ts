export type FirebaseSetupEnv = {
  VITE_FIREBASE_API_KEY?: string
  VITE_FIREBASE_AUTH_DOMAIN?: string
  VITE_FIREBASE_PROJECT_ID?: string
  VITE_FIREBASE_STORAGE_BUCKET?: string
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  VITE_FIREBASE_APP_ID?: string
  VITE_SUNDESK_ALLOWED_EMAILS?: string
  VITE_SUNDESK_FIRESTORE_WRITE_APPROVAL?: string
  VITE_SUNDESK_FIRESTORE_WRITES?: string
}

export type FirebaseSetupState = {
  allowlistCount: number
  configComplete: boolean
  missingConfigKeys: string[]
  nextAction: string
  status: 'local' | 'partial' | 'ready' | 'write-ready'
  statusLabel: string
  writeApprovalRecorded: boolean
  writeGateEnabled: boolean
  writeIntentEnabled: boolean
}

export type FirebaseLaunchReadinessStatus =
  | 'local-ready'
  | 'config-needed'
  | 'deploy-approval-needed'
  | 'write-approval-needed'

export type FirebaseLaunchReadinessInputs = {
  backupRehearsed: boolean
  deployApproved: boolean
  writeApproved: boolean
}

export type FirebaseLaunchReadinessItem = {
  detail: string
  id: 'local-backup' | 'firebase-config' | 'deploy-approval' | 'write-approval' | 'no-firebase-writes'
  label: string
  status: FirebaseLaunchReadinessStatus
}

export type FirebaseLaunchReadinessSummary = {
  items: FirebaseLaunchReadinessItem[]
  readyForLaunch: boolean
}

const requiredConfigKeys: Array<keyof FirebaseSetupEnv> = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

function getDefaultFirebaseSetupEnv(): FirebaseSetupEnv {
  return import.meta.env as FirebaseSetupEnv
}

export function getFirebaseSetupState(env: FirebaseSetupEnv = getDefaultFirebaseSetupEnv()): FirebaseSetupState {
  const missingConfigKeys = requiredConfigKeys.filter((key) => !String(env[key] || '').trim())
  const allowlistCount = new Set(String(env.VITE_SUNDESK_ALLOWED_EMAILS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.toLowerCase())).size
  const hasAnyConfigValue = requiredConfigKeys.some((key) => String(env[key] || '').trim())
  const configComplete = missingConfigKeys.length === 0
  const writeIntentEnabled = env.VITE_SUNDESK_FIRESTORE_WRITES === 'enabled'
  const writeApprovalRecorded = env.VITE_SUNDESK_FIRESTORE_WRITE_APPROVAL === 'approved'
  const writeGateEnabled = writeIntentEnabled && writeApprovalRecorded

  if (!hasAnyConfigValue && allowlistCount === 0) {
    return {
      allowlistCount,
      configComplete,
      missingConfigKeys,
      nextAction: 'Add Firebase config and approved accounts before hosted use.',
      status: 'local',
      statusLabel: 'Local mode',
      writeApprovalRecorded,
      writeGateEnabled,
      writeIntentEnabled,
    }
  }

  if (!configComplete || allowlistCount === 0) {
    return {
      allowlistCount,
      configComplete,
      missingConfigKeys,
      nextAction: configComplete ? 'Add approved Google accounts in private config.' : 'Finish Firebase config in the private environment.',
      status: 'partial',
      statusLabel: 'Setup incomplete',
      writeApprovalRecorded,
      writeGateEnabled,
      writeIntentEnabled,
    }
  }

  return {
    allowlistCount,
    configComplete,
    missingConfigKeys,
    nextAction: writeGateEnabled
      ? 'Run a fake-data write smoke test after approval.'
      : writeIntentEnabled
        ? 'Record write approval before remote writes can run.'
        : 'Verify Google sign-in before enabling writes.',
    status: writeGateEnabled ? 'write-ready' : 'ready',
    statusLabel: writeGateEnabled ? 'Write ready' : 'Sign-in ready',
    writeApprovalRecorded,
    writeGateEnabled,
    writeIntentEnabled,
  }
}

export function getFirebaseLaunchReadinessSummary(
  setupState: FirebaseSetupState,
  inputs: FirebaseLaunchReadinessInputs,
): FirebaseLaunchReadinessSummary {
  const items: FirebaseLaunchReadinessItem[] = [
    {
      id: 'local-backup',
      label: 'Local backup rehearsal',
      detail: inputs.backupRehearsed
        ? 'Backup export and import rehearsal is done.'
        : 'Run a local backup export and import rehearsal before launch.',
      status: inputs.backupRehearsed ? 'local-ready' : 'config-needed',
    },
    {
      id: 'firebase-config',
      label: 'Firebase config',
      detail: getFirebaseConfigReadinessDetail(setupState),
      status: setupState.configComplete && setupState.allowlistCount > 0 ? 'local-ready' : 'config-needed',
    },
    {
      id: 'deploy-approval',
      label: 'Deploy approval',
      detail: inputs.deployApproved
        ? 'Deploy approval is recorded.'
        : 'Deploy approval is needed before hosting this build.',
      status: inputs.deployApproved ? 'local-ready' : 'deploy-approval-needed',
    },
    {
      id: 'write-approval',
      label: 'Firestore writes',
      detail: inputs.writeApproved
        ? 'Write approval is recorded.'
        : setupState.writeIntentEnabled
          ? 'Write gate is enabled. Write approval is still needed before remote writes.'
          : 'Write approval is needed before enabling remote writes.',
      status: inputs.writeApproved ? 'local-ready' : 'write-approval-needed',
    },
    {
      id: 'no-firebase-writes',
      label: 'No Firebase writes',
      detail: setupState.writeGateEnabled
        ? 'Write gate is enabled. Confirm write approval before using hosted data.'
        : setupState.writeIntentEnabled
          ? 'Write gate is armed without approval. Remote writes remain blocked.'
        : 'Write gate is disabled. No remote writes can run in this build.',
      status: setupState.writeGateEnabled ? 'write-approval-needed' : 'local-ready',
    },
  ]

  return {
    items,
    readyForLaunch: items.every((item) => item.status === 'local-ready'),
  }
}

function getFirebaseConfigReadinessDetail(setupState: FirebaseSetupState): string {
  if (!setupState.configComplete) {
    return `${setupState.missingConfigKeys.length} config fields missing. Add Firebase config before hosted use.`
  }

  if (setupState.allowlistCount === 0) {
    return 'Add approved Google accounts before hosted use.'
  }

  return `${setupState.allowlistCount} approved accounts in local config.`
}
