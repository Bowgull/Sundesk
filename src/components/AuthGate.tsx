import { getAuthStateLabel } from '../data/authAccess'

export type AuthGateProps = {
  allowed: boolean
  loading: boolean
  onContinue: () => void
  onSignIn: () => void
  onSignOut: () => void
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
            <button type="button" disabled>
              {label.actionLabel}
            </button>
          )}
          {isSignedOut && (
            <button className="primary" type="button" onClick={onSignIn}>
              {label.actionLabel}
            </button>
          )}
          {isDenied && (
            <>
              <button className="primary" type="button" onClick={onSignIn}>
                {label.actionLabel}
              </button>
              <button type="button" onClick={onSignOut}>
                Sign out
              </button>
            </>
          )}
          {isSignedIn && (
            <>
              <button className="primary" type="button" onClick={onContinue}>
                {label.actionLabel}
              </button>
              <button type="button" onClick={onSignOut}>
                Sign out
              </button>
            </>
          )}
        </div>
      </article>
    </section>
  )
}
