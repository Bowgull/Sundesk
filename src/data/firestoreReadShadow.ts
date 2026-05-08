import type { Firestore } from 'firebase/firestore'

type FirestoreEnv = {
  VITE_FIREBASE_PROJECT_ID?: string
  VITE_SUNDESK_FIRESTORE_READ_SHADOW?: string
  VITE_SUNDESK_FIRESTORE_READ_SHADOW_USER_ID?: string
  VITE_SUNDESK_FIRESTORE_WRITES?: string
}

export type FirestoreReadShadowState = {
  state: 'off' | 'missing-config' | 'ready' | 'loading' | 'loaded' | 'error'
  label: string
  detail: string
  collections?: FirestoreReadShadowCollection[]
}

export type FirestoreReadShadowCollection = {
  name: string
  count: number
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

export const firestoreReadShadowCollections = [
  'tables',
  'fields',
  'records',
  'dependencies',
  'rules',
  'views',
  'settings',
  'activityLog',
]

export function getFirestoreReadShadowState(env: FirestoreEnv = getDefaultFirestoreEnv()): FirestoreReadShadowState {
  if (env.VITE_SUNDESK_FIRESTORE_READ_SHADOW !== 'enabled') {
    return {
      state: 'off',
      label: 'Off',
      detail: 'Local storage is the active source.',
    }
  }

  if (!env.VITE_FIREBASE_PROJECT_ID || !env.VITE_SUNDESK_FIRESTORE_READ_SHADOW_USER_ID) {
    return {
      state: 'missing-config',
      label: 'Missing config',
      detail: 'Read shadow needs Firebase project config and a user id.',
    }
  }

  return {
    state: 'ready',
    label: 'Ready',
    detail: 'Read shadow can load remote counts without enabling writes.',
  }
}

export type FirestoreReadShadowReader = {
  listCollection: (path: string) => Promise<{ count: number }>
}

export function createFirestoreReadShadowReader(db: Firestore): FirestoreReadShadowReader {
  return {
    async listCollection(path: string) {
      const { collection, getDocs } = await import('firebase/firestore')
      const snapshot = await getDocs(collection(db, path))

      return { count: snapshot.size }
    },
  }
}

export async function loadFirestoreReadShadow(
  reader: FirestoreReadShadowReader,
  env: FirestoreEnv = getDefaultFirestoreEnv(),
): Promise<FirestoreReadShadowState> {
  const currentState = getFirestoreReadShadowState(env)
  const userId = env.VITE_SUNDESK_FIRESTORE_READ_SHADOW_USER_ID

  if (currentState.state !== 'ready' || !userId) {
    return currentState
  }

  try {
    const collections = await Promise.all(
      firestoreReadShadowCollections.map(async (collectionName) => {
        const result = await reader.listCollection(`users/${userId}/${collectionName}`)

        return {
          name: collectionName,
          count: result.count,
        }
      }),
    )
    const totalRecords = collections.reduce((sum, item) => sum + item.count, 0)

    return {
      state: 'loaded',
      label: 'Loaded',
      detail: `${totalRecords} remote documents counted. Local storage is still active.`,
      collections,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown read error.'

    return {
      state: 'error',
      label: 'Read failed',
      detail: `${message} Local storage is still active.`,
    }
  }
}
