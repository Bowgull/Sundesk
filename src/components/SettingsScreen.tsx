import type { AppScreen, ThemeId } from '../appConfig'
import type {
  FirestoreReadShadowComparison,
  FirestoreReadShadowState,
  FirestoreWriteGateState,
} from '../data/firestoreReadShadow'
import type { LocalRule } from '../data/rules'

type ThemeSwatch = {
  background: string
  panel: string
  text: string
  accent: string
  status: string
  primary: string
}

export type SettingsThemeOption = {
  label: string
  value: ThemeId
  swatch: ThemeSwatch
}

export type SettingsLocalEngineStat = {
  label: string
  value: string | number
}

export type SettingsRuleDestinationStat = {
  label: string
  rules: number
  matches: number
}

export type SettingsScreenProps = {
  authAllowed: boolean
  authRequired: boolean
  authUserEmail?: string | null
  firestoreReadShadowComparison: readonly FirestoreReadShadowComparison[]
  firestoreReadShadowState: FirestoreReadShadowState
  firestoreWriteGateState: FirestoreWriteGateState
  localEngineStats: readonly SettingsLocalEngineStat[]
  localRules: readonly LocalRule[]
  migrationMessages: readonly string[]
  onThemeChange: (theme: ThemeId) => void
  openScreen: (screen: AppScreen) => void
  ruleDestinationStats: readonly SettingsRuleDestinationStat[]
  selectedTheme: ThemeId
  themes: readonly SettingsThemeOption[]
  workspaceHydrated: boolean
  workspaceStatus: string
}

export function SettingsScreen({
  authAllowed,
  authRequired,
  authUserEmail,
  firestoreReadShadowComparison,
  firestoreReadShadowState,
  firestoreWriteGateState,
  localEngineStats,
  localRules,
  migrationMessages,
  onThemeChange,
  openScreen,
  ruleDestinationStats,
  selectedTheme,
  themes,
  workspaceHydrated,
  workspaceStatus,
}: SettingsScreenProps) {
  const dataAccessTitle = authRequired ? 'Shared workspace.' : 'Local workspace.'
  const dataAccessPill = authRequired
    ? authAllowed && workspaceHydrated ? 'Shared ready' : 'Sign-in gated'
    : 'Local only'
  const accessLine = authRequired
    ? authAllowed ? `Approved${authUserEmail ? ` as ${authUserEmail}` : ''}.` : 'Waiting for an approved Google account.'
    : 'Local browser mode. No sign-in required.'
  const workspaceLine = workspaceStatus || (authRequired ? 'Shared workspace status is pending.' : 'Local workspace active.')

  return (
    <section className="settings-zone" data-testid="settings-screen" id="settings">
      <article className="settings-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Settings</span>
            <h2>Appearance.</h2>
          </div>
        </div>
        <div className="theme-grid">
          {themes.map((theme) => (
            <button
              key={theme.value}
              aria-pressed={theme.value === selectedTheme}
              className={`theme-swatch ${theme.value === selectedTheme ? 'selected' : ''}`}
              onClick={() => onThemeChange(theme.value)}
            >
              <span className="theme-swatch-preview" aria-hidden="true" style={{ background: theme.swatch.background }}>
                <span className="theme-swatch-panel" style={{ background: theme.swatch.panel }}>
                  <i style={{ color: theme.swatch.text }} />
                  <b style={{ background: theme.swatch.accent }} />
                </span>
                <span className="theme-swatch-row">
                  <i style={{ background: theme.swatch.status, borderColor: theme.swatch.accent }} />
                  <b style={{ background: theme.swatch.primary }} />
                </span>
                {theme.value === selectedTheme && <span className="theme-check">✓</span>}
              </span>
              <strong>{theme.label}</strong>
            </button>
          ))}
        </div>
      </article>

      <article className="settings-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Command send</span>
            <h2>Morning summary.</h2>
          </div>
        </div>
        <div className="settings-list">
          <p><strong>Status.</strong> On</p>
          <p><strong>Recipient.</strong> lindsaybelldesign@gmail.com</p>
          <p><strong>Time.</strong> 7:30 AM</p>
          <p><strong>Timezone.</strong> America/Toronto</p>
          <p><strong>Includes.</strong> Today queue, waiting items, at-risk communities, meeting prep.</p>
          <p><strong>Actions.</strong> Preview command send. Send test summary.</p>
        </div>
      </article>

      <article className="settings-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Privacy</span>
            <h2>Data boundary.</h2>
          </div>
        </div>
        <div className="settings-list">
          <p><strong>Boundary.</strong> Sundesk is for status, dates, owners, links, and short notes.</p>
          <p><strong>Discretion.</strong> You choose what to enter. You are responsible for any sensitive details you add.</p>
          <p><strong>Sensitive information.</strong> Files, document contents, private numbers, permits, COI files, and contract text are your responsibility if added.</p>
          <p><strong>Build notes.</strong> Obsidian is for session memory only. No product data goes there.</p>
        </div>
      </article>

      <article className="settings-panel data-access-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Data and access</span>
            <h2>{dataAccessTitle}</h2>
          </div>
          <span className="metric-pill">{dataAccessPill}</span>
        </div>
        <div className="settings-list">
          <p><strong>Access.</strong> {accessLine}</p>
          <p><strong>Workspace.</strong> {workspaceLine}</p>
          <p><strong>Storage.</strong> Tables, fields, records, dependencies, rules, and Build views are saved locally and can sync to Firestore when the write gate is enabled.</p>
          <p><strong>Read shadow.</strong> {firestoreReadShadowState.label}. {firestoreReadShadowState.detail}</p>
          <p><strong>Write gate.</strong> {firestoreWriteGateState.label}. {firestoreWriteGateState.detail}</p>
          <p><strong>Repair.</strong> {migrationMessages.length > 0 ? migrationMessages.join(' ') : 'No local repair was needed on this load.'}</p>
        </div>
        <details className="settings-details">
          <summary>Show workspace counts</summary>
          <div className="engine-stat-grid">
            {localEngineStats.map((stat) => (
              <div key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
          {firestoreReadShadowState.collections && (
            <>
              <p className="settings-detail-note"><strong>Remote counts.</strong> {firestoreReadShadowState.collections.map((item) => `${item.name}: ${item.count}`).join('. ')}.</p>
              <div className="read-shadow-compare" aria-label="Read shadow comparison">
                {firestoreReadShadowComparison.map((item) => (
                  <div className={item.status} key={item.name}>
                    <span>{item.name}</span>
                    <strong>{item.local} local / {item.remote} remote</strong>
                    <small>{item.delta === 0 ? 'Matched' : `${item.delta > 0 ? '+' : ''}${item.delta} remote delta`}</small>
                  </div>
                ))}
              </div>
            </>
          )}
        </details>
        <details className="settings-details">
          <summary>Show command routing</summary>
          <div className="rule-destination-grid" data-testid="rule-destination-grid">
            {ruleDestinationStats.map((stat) => (
              <div key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.matches}</strong>
                <small>{stat.rules} rules</small>
              </div>
            ))}
          </div>
          <p className="settings-detail-note">{localRules.length} rules route records into command surfaces.</p>
        </details>
      </article>

      <article className="settings-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Setup</span>
            <h2>Run setup again.</h2>
          </div>
          <button type="button" onClick={() => openScreen('today')}>Review setup prompt</button>
        </div>
        <div className="settings-list">
          <p><strong>Review privacy.</strong> Show the warning again.</p>
          <p><strong>Choose theme.</strong> Keep or change the saved theme.</p>
          <p><strong>Check summary.</strong> Recipient, time, timezone, and included items.</p>
          <p><strong>Review starter tables.</strong> No data will be deleted.</p>
        </div>
      </article>
    </section>
  )
}
