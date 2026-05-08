type FirestoreEnv = {
  VITE_FIREBASE_PROJECT_ID?: string
  VITE_SUNDESK_FIRESTORE_READ_SHADOW?: string
  VITE_SUNDESK_FIRESTORE_WRITES?: string
}

export type FirestoreReadShadowState = {
  state: 'off' | 'missing-config' | 'ready'
  label: string
  detail: string
}

export type FirestoreWriteGateState = {
  enabled: boolean
  label: string
  detail: string
}

function getDefaultFirestoreEnv(): FirestoreEnv {
  return import.meta.env as unknown as FirestoreEnv
}

export function getFirestoreWriteGateState(env: FirestoreEnv = getDefaultFirestoreEnv()): FirestoreWriteGateState {
  const enabled = env.VITE_SUNDESK_FIRESTORE_WRITES === 'enabled'

  return enabled
    ? {
        enabled: true,
        label: 'Enabled',
        detail: 'Firestore writes are allowed by environment gate.',
      }
    : {
        enabled: false,
        label: 'Disabled',
        detail: 'No Firestore writes can run in this build.',
      }
}

export function getFirestoreReadShadowState(env: FirestoreEnv = getDefaultFirestoreEnv()): FirestoreReadShadowState {
  if (env.VITE_SUNDESK_FIRESTORE_READ_SHADOW !== 'enabled') {
    return {
      state: 'off',
      label: 'Off',
      detail: 'Local storage is the active source.',
    }
  }

  if (!env.VITE_FIREBASE_PROJECT_ID) {
    return {
      state: 'missing-config',
      label: 'Missing config',
      detail: 'Read shadow is requested, but Firebase project config is not present.',
    }
  }

  return {
    state: 'ready',
    label: 'Ready',
    detail: 'Read shadow can be wired without enabling writes.',
  }
}
