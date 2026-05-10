import type { AppScreen, ThemeId } from '../appConfig'
import type { ChangeEvent } from 'react'
import type {
  FirestoreReadShadowComparison,
  FirestoreReadShadowState,
  FirestoreWriteGateState,
} from '../data/firestoreReadShadow'
import type { FirebaseSetupState } from '../data/firebaseSetup'
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

export type SettingsLaunchReadinessItem = {
  label: string
  status: string
  detail: string
}

export type SettingsScreenProps = {
  authAllowed: boolean
  authRequired: boolean
  authUserEmail?: string | null
  firebaseSetupState: FirebaseSetupState
  firestoreReadShadowComparison: readonly FirestoreReadShadowComparison[]
  firestoreReadShadowState: FirestoreReadShadowState
  firestoreWriteGateState: FirestoreWriteGateState
  launchReadinessItems?: readonly SettingsLaunchReadinessItem[]
  localEngineStats: readonly SettingsLocalEngineStat[]
  localRules: readonly LocalRule[]
  migrationMessages: readonly string[]
  onExportBackup?: () => void
  onImportBackup?: (file: File) => void
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
  firebaseSetupState,
  firestoreReadShadowComparison,
  firestoreReadShadowState,
  firestoreWriteGateState,
  launchReadinessItems = [],
  localEngineStats,
  localRules,
  migrationMessages,
  onExportBackup,
  onImportBackup,
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
  const canExportBackup = Boolean(onExportBackup)
  const canImportBackup = Boolean(onImportBackup)
  const importBackupInputId = 'settings-import-backup-input'

  function handleImportBackupChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]

    if (file) {
      onImportBackup?.(file)
    }

    event.currentTarget.value = ''
  }

  function getReadinessStatusLabel(status: string) {
    return status.replace(/-/g, ' ')
  }

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

      <article className="settings-panel settings-command-send-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Command send</span>
            <h2>Morning summary.</h2>
          </div>
          <span className="metric-pill">Local only</span>
        </div>
        <div className="command-send-status" aria-label="Command send local status">
          <div className="command-send-row">
            <span>Preview</span>
            <strong>Local only.</strong>
            <p>No email is sent from Settings.</p>
          </div>
          <div className="command-send-row">
            <span>Recipient</span>
            <strong>Private deploy environment.</strong>
            <p>Settings shows the boundary. It does not store or send the address.</p>
          </div>
          <div className="command-send-row command-send-schedule">
            <span>Schedule</span>
            <strong>7:30 AM</strong>
            <p>America/Toronto.</p>
          </div>
          <div className="command-send-includes">
            <span>Included</span>
            <ul>
              <li>Today queue</li>
              <li>Waiting items</li>
              <li>At-risk communities</li>
              <li>Meeting prep</li>
            </ul>
          </div>
        </div>
      </article>

      <article className="settings-panel settings-privacy-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Privacy</span>
            <h2>Data boundary.</h2>
          </div>
        </div>
        <div className="settings-list settings-quiet-list">
          <p><strong>Use.</strong> Status, dates, owners, links, and short notes.</p>
          <p><strong>Storage.</strong> You choose what to enter. Sensitive details are stored at your own risk.</p>
        </div>
        <p className="settings-risk-note">
          Avoid files, document contents, private numbers, permit details, COI contents, and contract text unless you intend to store them here.
        </p>
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
          <p><strong>Firebase setup.</strong> {firebaseSetupState.statusLabel}. {firebaseSetupState.configComplete ? 'Config present.' : `${firebaseSetupState.missingConfigKeys.length} config fields missing.`} {firebaseSetupState.allowlistCount} approved accounts in local config.</p>
          <p><strong>Next setup step.</strong> {firebaseSetupState.nextAction}</p>
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

      <article className="settings-panel settings-launch-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Launch</span>
            <h2>Readiness.</h2>
          </div>
          <span className="metric-pill">{launchReadinessItems.length} checks</span>
        </div>
        <div className="launch-readiness-list" aria-label="Launch readiness checks">
          {launchReadinessItems.length > 0 ? launchReadinessItems.map((item) => (
            <div className="launch-readiness-item" data-status={item.status.toLowerCase()} key={`${item.label}-${item.status}`}>
              <span className="launch-readiness-mark" aria-hidden="true" />
              <strong>{item.label}</strong>
              <span className="launch-readiness-status">{getReadinessStatusLabel(item.status)}</span>
              <p>{item.detail}</p>
            </div>
          )) : (
            <p className="launch-readiness-empty">No launch readiness items connected.</p>
          )}
        </div>
      </article>

      <article className="settings-panel settings-web-app-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Install</span>
            <h2>Open as a web app.</h2>
          </div>
          <span className="metric-pill">Manual</span>
        </div>
        <div className="settings-web-app-layout" aria-label="Install and bookmark readiness">
          <div className="settings-web-app-icon" aria-hidden="true">
            <img src="/brand/sundesk-icon.png" alt="" />
          </div>
          <div className="settings-web-app-copy">
            <div className="settings-web-app-steps">
              <p><strong>Hosted URL.</strong> Open Sundesk from the hosted web address used for daily work.</p>
              <p><strong>Mobile.</strong> Add to Home Screen. Use the Sundesk icon to confirm the saved app.</p>
              <p><strong>Desktop.</strong> Bookmark the hosted URL in the work browser. Today stays home.</p>
            </div>
            <p className="settings-web-app-readiness">
              <strong>Before hosted use.</strong> Check Launch readiness for Firebase config, deploy approval, write approval, and no Firebase writes.
            </p>
            <p className="settings-web-app-note">
              This install surface is manual. It does not deploy, change Firebase setup, or write remote data.
            </p>
          </div>
        </div>
      </article>

      <article className="settings-panel settings-backup-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Backup</span>
            <h2>Local copy.</h2>
          </div>
          <span className="metric-pill">Manual</span>
        </div>
        <div className="settings-backup-layout">
          <div className="settings-backup-copy">
            <p>
              Export a backup before large edits. Import only from a Sundesk backup you trust.
            </p>
            <p className="settings-backup-note" id="settings-backup-note">
              Backup controls are local commands. They do not change Firebase setup or write remote data.
            </p>
          </div>
          <div className="settings-backup-actions" aria-describedby="settings-backup-note">
            <button type="button" className="primary" disabled={!canExportBackup} onClick={onExportBackup}>
              Export backup
            </button>
            <input
              accept="application/json,.json"
              aria-label="Import Sundesk backup JSON file"
              className="settings-backup-file-input"
              disabled={!canImportBackup}
              id={importBackupInputId}
              onChange={handleImportBackupChange}
              type="file"
            />
            <label
              aria-disabled={!canImportBackup}
              className={`settings-backup-import-label ${!canImportBackup ? 'disabled' : ''}`}
              htmlFor={importBackupInputId}
            >
              Import backup
            </label>
          </div>
        </div>
        {(!canExportBackup || !canImportBackup) && (
          <p className="settings-backup-disabled">
            Backup handlers are not connected in this build.
          </p>
        )}
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
