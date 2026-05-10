export type FirebaseSetupEnv = {
  VITE_FIREBASE_API_KEY?: string
  VITE_FIREBASE_AUTH_DOMAIN?: string
  VITE_FIREBASE_PROJECT_ID?: string
  VITE_FIREBASE_STORAGE_BUCKET?: string
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  VITE_FIREBASE_APP_ID?: string
  VITE_SUNDESK_ALLOWED_EMAILS?: string
  VITE_SUNDESK_FIRESTORE_WRITES?: string
}

export type FirebaseSetupState = {
  allowlistCount: number
  configComplete: boolean
  missingConfigKeys: string[]
  status: 'local' | 'partial' | 'ready' | 'write-ready'
  statusLabel: string
  writeGateEnabled: boolean
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
  const allowlistCount = String(env.VITE_SUNDESK_ALLOWED_EMAILS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .length
  const hasAnyConfigValue = requiredConfigKeys.some((key) => String(env[key] || '').trim())
  const configComplete = missingConfigKeys.length === 0
  const writeGateEnabled = env.VITE_SUNDESK_FIRESTORE_WRITES === 'enabled'

  if (!hasAnyConfigValue && allowlistCount === 0) {
    return {
      allowlistCount,
      configComplete,
      missingConfigKeys,
      status: 'local',
      statusLabel: 'Local mode',
      writeGateEnabled,
    }
  }

  if (!configComplete || allowlistCount === 0) {
    return {
      allowlistCount,
      configComplete,
      missingConfigKeys,
      status: 'partial',
      statusLabel: 'Setup incomplete',
      writeGateEnabled,
    }
  }

  return {
    allowlistCount,
    configComplete,
    missingConfigKeys,
    status: writeGateEnabled ? 'write-ready' : 'ready',
    statusLabel: writeGateEnabled ? 'Write ready' : 'Sign-in ready',
    writeGateEnabled,
  }
}
