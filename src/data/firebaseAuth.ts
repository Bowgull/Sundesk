import type { Auth, Unsubscribe, User } from 'firebase/auth'
import { getFirebaseAuth } from '../lib/firebase'
import { isAllowedEmail, normalizeEmail, normalizeEmailAllowlist } from './authAccess'

export type FirebaseAuthSession = {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export type FirebaseAuthUserLike = Pick<User, 'uid' | 'email' | 'displayName' | 'photoURL'>

export type SundeskAuthEnv = {
  VITE_SUNDESK_ALLOWED_EMAILS?: string
}

export type AuthStateChangeHandler = (session: FirebaseAuthSession | null) => void

export function getAllowedEmailsFromEnv(env: SundeskAuthEnv = import.meta.env as SundeskAuthEnv) {
  return normalizeEmailAllowlist((env.VITE_SUNDESK_ALLOWED_EMAILS || '').split(','))
}

export function normalizeAuthSession(user: FirebaseAuthUserLike | null): FirebaseAuthSession | null {
  if (!user) {
    return null
  }

  return {
    uid: user.uid,
    email: normalizeEmail(user.email) || null,
    displayName: normalizeNullableString(user.displayName),
    photoURL: normalizeNullableString(user.photoURL),
  }
}

export function isSessionAllowed(
  session: FirebaseAuthSession | null,
  allowedEmails = getAllowedEmailsFromEnv(),
) {
  return isAllowedEmail(session?.email, allowedEmails)
}

export async function setFirebaseAuthLocalPersistence(auth?: Auth) {
  const resolvedAuth = auth || await getConfiguredFirebaseAuth()
  const { browserLocalPersistence, setPersistence } = await import('firebase/auth')

  await setPersistence(resolvedAuth, browserLocalPersistence)
}

export async function signInWithGooglePopup(auth?: Auth) {
  const resolvedAuth = auth || await getConfiguredFirebaseAuth()
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')

  await setFirebaseAuthLocalPersistence(resolvedAuth)

  const credential = await signInWithPopup(resolvedAuth, new GoogleAuthProvider())

  return normalizeAuthSession(credential.user)
}

export async function signOutOfFirebaseAuth(auth?: Auth) {
  const resolvedAuth = auth || await getConfiguredFirebaseAuth()
  const { signOut } = await import('firebase/auth')

  await signOut(resolvedAuth)
}

export async function subscribeToFirebaseAuthState(
  onChange: AuthStateChangeHandler,
  auth?: Auth,
): Promise<Unsubscribe> {
  const resolvedAuth = auth || await getFirebaseAuth()

  if (!resolvedAuth) {
    onChange(null)
    return () => undefined
  }

  const { onAuthStateChanged } = await import('firebase/auth')

  return onAuthStateChanged(resolvedAuth, (user) => {
    onChange(normalizeAuthSession(user))
  })
}

async function getConfiguredFirebaseAuth() {
  const auth = await getFirebaseAuth()

  if (!auth) {
    throw new Error('Firebase Auth is not configured.')
  }

  return auth
}

function normalizeNullableString(value: string | null | undefined) {
  const normalized = (value || '').trim()

  return normalized || null
}
