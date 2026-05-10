import { getAuthStateLabel } from '../data/authAccess'
import { getCopyModeText, type CopyEntryId } from '../data/copyMode'

export type AuthGateProps = {
  allowed: boolean
  loading: boolean
  onContinue: () => void
  onSignIn: () => void
  onSignOut: () => void
  rupaulMode: boolean
  userAvatarUrl?: string | null
  userEmail?: string | null
  userName?: string | null
}

export function AuthGate({
  allowed,
  loading,
  onContinue,
  onSignIn,
  onSignOut,
  rupaulMode,
  userAvatarUrl,
  userEmail,
  userName,
}: AuthGateProps) {
  const label = getAuthStateLabel({ allowed, loading, userEmail })
  const displayName = userName || userEmail || 'Google account'
  const showAccount = Boolean(userEmail || userName)
  const isSignedIn = label.state === 'signedIn'
  const isDenied = label.state === 'denied'
  const isSignedOut = label.state === 'signedOut'
  const accessStatus = loading ? 'Checking' : isSignedIn ? 'Approved' : isDenied ? 'Blocked' : 'Google'
  const actionCopyId = getAuthActionCopyId(label.actionLabel)
  const actionLabel = getCopyModeText(actionCopyId, rupaulMode)
  const signOutLabel = getCopyModeText('button.signOut', rupaulMode)
  const actionButtonProps = {
    'aria-label': label.actionLabel,
    'data-copy-plain': label.actionLabel,
    title: label.actionLabel,
  }
  const signOutButtonProps = {
    'aria-label': 'Sign out',
    'data-copy-plain': 'Sign out',
    title: 'Sign out',
  }

  return (
    <section className={`auth-gate auth-gate-${label.state}`} data-testid="auth-gate" aria-busy={loading}>
      <article className="auth-gate-panel">
        <div className="panel-title compact">
          <div>
            <span className="eyebrow">{label.eyebrow}</span>
            <h2>{label.title}</h2>
          </div>
          <span className="metric-pill">{accessStatus}</span>
        </div>

        <p className="panel-lede">{label.detail}</p>
        <p className="auth-disclaimer">Google handles sign-in. Firestore opens after access is approved.</p>

        {showAccount && (
          <div className="auth-account" aria-label="Signed-in account">
            {userAvatarUrl ? (
              <img src={userAvatarUrl} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="auth-account-avatar" aria-hidden="true">
                {displayName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div>
              <strong>{displayName}</strong>
              {userEmail && userName && <span>{userEmail}</span>}
            </div>
          </div>
        )}

        <div className="auth-actions">
          {loading && (
            <button type="button" disabled {...actionButtonProps}>
              {actionLabel}
            </button>
          )}
          {isSignedOut && (
            <button className="primary" type="button" {...actionButtonProps} onClick={onSignIn}>
              {actionLabel}
            </button>
          )}
          {isDenied && (
            <>
              <button className="primary" type="button" {...actionButtonProps} onClick={onSignIn}>
                {actionLabel}
              </button>
              <button type="button" {...signOutButtonProps} onClick={onSignOut}>
                {signOutLabel}
              </button>
            </>
          )}
          {isSignedIn && (
            <>
              <button className="primary" type="button" {...actionButtonProps} onClick={onContinue}>
                {actionLabel}
              </button>
              <button type="button" {...signOutButtonProps} onClick={onSignOut}>
                {signOutLabel}
              </button>
            </>
          )}
        </div>
      </article>
    </section>
  )
}

function getAuthActionCopyId(actionLabel: string): CopyEntryId {
  if (actionLabel === 'Continue with Google') {
    return 'button.continueGoogle'
  }

  if (actionLabel === 'Use another account') {
    return 'button.useAnotherAccount'
  }

  if (actionLabel === 'Open Sundesk') {
    return 'button.openSundesk'
  }

  return 'button.checkingAccess'
}
