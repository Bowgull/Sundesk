export type AuthAccessState = 'loading' | 'signedOut' | 'denied' | 'signedIn'

export type AuthStateLabel = {
  actionLabel: string
  detail: string
  eyebrow: string
  state: AuthAccessState
  title: string
}

export type AuthStateLabelInput = {
  allowed: boolean
  loading: boolean
  userEmail?: string | null
}

export function normalizeEmail(email: string | null | undefined) {
  return (email || '').trim().toLowerCase()
}

export function normalizeEmailAllowlist(emails: readonly (string | null | undefined)[]) {
  return Array.from(new Set(emails.map(normalizeEmail).filter(Boolean)))
}

export function isAllowedEmail(email: string | null | undefined, allowedEmails: readonly string[]) {
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    return false
  }

  return normalizeEmailAllowlist(allowedEmails).includes(normalizedEmail)
}

export function getAuthStateLabel({
  allowed,
  loading,
  userEmail,
}: AuthStateLabelInput): AuthStateLabel {
  if (loading) {
    return {
      actionLabel: 'Checking access',
      detail: 'Checking the current browser session.',
      eyebrow: 'Sundesk access',
      state: 'loading',
      title: 'Checking sign-in.',
    }
  }

  if (!normalizeEmail(userEmail)) {
    return {
      actionLabel: 'Continue with Google',
      detail: 'Sign in with an approved Google account. This browser will remember the session.',
      eyebrow: 'Sundesk access',
      state: 'signedOut',
      title: 'Sign in required.',
    }
  }

  if (!allowed) {
    return {
      actionLabel: 'Use another account',
      detail: 'Access is limited to approved Sundesk users.',
      eyebrow: 'Access limited',
      state: 'denied',
      title: 'This account is not approved.',
    }
  }

  return {
    actionLabel: 'Open Sundesk',
    detail: 'Signed in with an approved account.',
    eyebrow: 'Signed in',
    state: 'signedIn',
    title: 'Ready to continue.',
  }
}
