import { describe, expect, it } from 'vitest'
import {
  getAuthStateLabel,
  isAllowedEmail,
  normalizeEmail,
  normalizeEmailAllowlist,
} from './authAccess'

describe('auth access helpers', () => {
  it('normalizes email input before comparison', () => {
    expect(normalizeEmail('  Lindsay.Example@GMAIL.COM  ')).toBe('lindsay.example@gmail.com')
    expect(normalizeEmail(null)).toBe('')
    expect(normalizeEmail(undefined)).toBe('')
  })

  it('builds a clean allowlist from configuration input', () => {
    expect(normalizeEmailAllowlist([
      '  owner@example.com ',
      '',
      null,
      'OWNER@example.com',
      'partner@example.com',
    ])).toEqual(['owner@example.com', 'partner@example.com'])
  })

  it('checks allowed emails with trimmed, case-insensitive values', () => {
    const allowlist = ['owner@example.com', 'partner@example.com']

    expect(isAllowedEmail(' OWNER@example.com ', allowlist)).toBe(true)
    expect(isAllowedEmail('guest@example.com', allowlist)).toBe(false)
    expect(isAllowedEmail('', allowlist)).toBe(false)
  })

  it('labels loading, signed-out, denied, and signed-in states', () => {
    expect(getAuthStateLabel({ loading: true, userEmail: null, allowed: false })).toEqual({
      actionLabel: 'Checking access',
      detail: 'Reading the current browser session.',
      eyebrow: 'Sundesk access',
      state: 'loading',
      title: 'Checking sign-in.',
    })
    expect(getAuthStateLabel({ loading: false, userEmail: null, allowed: false })).toEqual({
      actionLabel: 'Continue with Google',
      detail: 'Use the Google account approved for this build. The browser can keep the session.',
      eyebrow: 'Sundesk access',
      state: 'signedOut',
      title: 'Sign in required.',
    })
    expect(getAuthStateLabel({ loading: false, userEmail: 'guest@example.com', allowed: false })).toEqual({
      actionLabel: 'Use another account',
      detail: 'This Google account is signed in, but it is not on the Sundesk allowlist.',
      eyebrow: 'Access limited',
      state: 'denied',
      title: 'This account is not approved.',
    })
    expect(getAuthStateLabel({ loading: false, userEmail: 'owner@example.com', allowed: true })).toEqual({
      actionLabel: 'Open Sundesk',
      detail: 'Approved account connected. Shared workspace can load here. Remote writes still need the write gate.',
      eyebrow: 'Signed in',
      state: 'signedIn',
      title: 'Ready to continue.',
    })
  })
})
