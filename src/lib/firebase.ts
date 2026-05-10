import type { FirebaseApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app: FirebaseApp | null = null

export async function getFirebaseApp() {
  if (!firebaseConfig.projectId) {
    return null
  }

  if (!app) {
    const { initializeApp } = await import('firebase/app')

    app = initializeApp(firebaseConfig)
  }

  return app
}

export async function getFirebaseServices() {
  const firebaseApp = await getFirebaseApp()

  if (!firebaseApp) {
    return null
  }

  const [{ getAuth }, { getFirestore }] = await Promise.all([
    import('firebase/auth'),
    import('firebase/firestore'),
  ])

  return {
    app: firebaseApp,
    auth: getAuth(firebaseApp),
    db: getFirestore(firebaseApp),
  }
}

export async function getFirebaseAuth() {
  const firebaseApp = await getFirebaseApp()

  if (!firebaseApp) {
    return null
  }

  const { getAuth } = await import('firebase/auth')

  return getAuth(firebaseApp)
}
