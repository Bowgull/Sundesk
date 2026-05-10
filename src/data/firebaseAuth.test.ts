import { describe, expect, it } from 'vitest'
import {
  getAllowedEmailsFromEnv,
  isSessionAllowed,
  normalizeAuthSession,
  type FirebaseAuthUserLike,
} from './firebaseAuth'

describe('Firebase auth helpers', () => {
  it('reads a comma-separated email allowlist from env input', () => {
    expect(getAllowedEmailsFromEnv({
      VITE_SUNDESK_ALLOWED_EMAILS: ' lindsay@example.com, JOSH@example.com ,, lindsay@example.com ',
    })).toEqual(['lindsay@example.com', 'josh@example.com'])
  })

  it('returns an empty allowlist when the env value is missing', () => {
    expect(getAllowedEmailsFromEnv({})).toEqual([])
    expect(getAllowedEmailsFromEnv({ VITE_SUNDESK_ALLOWED_EMAILS: undefined })).toEqual([])
  })

  it('normalizes Firebase users into the app auth session shape', () => {
    const user: FirebaseAuthUserLike = {
      uid: 'user_1',
      email: ' Lindsay@example.com ',
      displayName: '',
      photoURL: 'https://example.com/avatar.png',
    }

    expect(normalizeAuthSession(user)).toEqual({
      uid: 'user_1',
      email: 'lindsay@example.com',
      displayName: null,
      photoURL: 'https://example.com/avatar.png',
    })
  })

  it('returns null when there is no Firebase user', () => {
    expect(normalizeAuthSession(null)).toBeNull()
  })

  it('checks session access against the normalized allowlist', () => {
    const session = normalizeAuthSession({
      uid: 'user_1',
      email: ' Lindsay@example.com ',
      displayName: 'Lindsay',
      photoURL: null,
    })

    expect(isSessionAllowed(session, ['guest@example.com', 'lindsay@example.com'])).toBe(true)
    expect(isSessionAllowed(session, ['guest@example.com'])).toBe(false)
    expect(isSessionAllowed(null, ['lindsay@example.com'])).toBe(false)
  })
})
