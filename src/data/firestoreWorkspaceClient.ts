import type { DocumentReference, Firestore } from 'firebase/firestore'
import {
  createFirestoreWorkspaceSnapshot,
  defaultFirestoreWorkspaceId,
  getFirestoreWorkspaceSnapshotPath,
  normalizeFirestoreWorkspaceSnapshot,
  writeFirestoreWorkspaceSnapshot,
  type FirestoreWorkspaceLocalState,
  type FirestoreWorkspaceSnapshot,
  type FirestoreWorkspaceWriteGate,
  type NormalizedFirestoreWorkspaceState,
} from './firestoreWorkspace'

export type FirestoreWorkspaceDocumentStore = {
  getDocument: (path: string) => Promise<unknown | undefined>
  setDocument: (path: string, payload: FirestoreWorkspaceSnapshot) => Promise<void>
}

export type FirestoreWorkspaceLoadResult = {
  path: string
  exists: boolean
  state: NormalizedFirestoreWorkspaceState
}

export type FirestoreWorkspaceSaveResult = {
  path: string
  snapshot: FirestoreWorkspaceSnapshot
}

export type FirestoreWorkspaceClientOptions = {
  store: FirestoreWorkspaceDocumentStore
  workspaceId?: string
  writeGate?: FirestoreWorkspaceWriteGate
}

export type FirestoreWorkspaceClient = {
  loadCurrent: () => Promise<FirestoreWorkspaceLoadResult>
  saveCurrent: (state: FirestoreWorkspaceLocalState) => Promise<FirestoreWorkspaceSaveResult>
}

type FirestoreSdkModule = {
  doc: (db: Firestore, path: string) => DocumentReference
  getDoc: (ref: DocumentReference) => Promise<{
    exists: () => boolean
    data: () => unknown
  }>
  setDoc: (ref: DocumentReference, payload: FirestoreWorkspaceSnapshot) => Promise<void>
}

export function createFirestoreWorkspaceClient({
  store,
  workspaceId = defaultFirestoreWorkspaceId,
  writeGate = { enabled: false },
}: FirestoreWorkspaceClientOptions): FirestoreWorkspaceClient {
  const path = getFirestoreWorkspaceSnapshotPath(workspaceId)

  return {
    async loadCurrent() {
      const remoteValue = await store.getDocument(path)

      return {
        path,
        exists: remoteValue !== undefined,
        state: normalizeFirestoreWorkspaceSnapshot(remoteValue),
      }
    },
    async saveCurrent(state) {
      const snapshot = createFirestoreWorkspaceSnapshot({
        ...state,
        workspaceId,
      })

      await writeFirestoreWorkspaceSnapshot(store, snapshot, writeGate)

      return {
        path: getFirestoreWorkspaceSnapshotPath(snapshot.workspaceId),
        snapshot,
      }
    },
  }
}

export function createFirestoreWorkspaceSdkDocumentStore(
  db: Firestore,
  loadFirestoreSdk: () => Promise<FirestoreSdkModule> = loadDefaultFirestoreSdk,
): FirestoreWorkspaceDocumentStore {
  return {
    async getDocument(path) {
      const { doc, getDoc } = await loadFirestoreSdk()
      const snapshot = await getDoc(doc(db, path))

      return snapshot.exists() ? snapshot.data() : undefined
    },
    async setDocument(path, payload) {
      const { doc, setDoc } = await loadFirestoreSdk()

      await setDoc(doc(db, path), payload)
    },
  }
}

async function loadDefaultFirestoreSdk(): Promise<FirestoreSdkModule> {
  return import('firebase/firestore')
}
