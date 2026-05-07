import './App.css'
import {
  automationRules,
  buildFieldTypes,
  communities,
  linkedRecords,
  priorityItems,
  selectedFields,
  type Priority,
} from './data/demoData'

const themes = ['Sunrise Soft', 'Sunset Bold', 'Cloud Light', 'Focus Dark', 'Light']

function priorityLabel(priority: Priority) {
  const labels: Record<Priority, string> = {
    fire: 'Fire',
    urgent: 'Urgent',
    waiting: 'Waiting',
    prep: 'Prep',
    routine: 'Routine',
  }

  return labels[priority]
}

function App() {
  return (
    <main className="app">
      <aside className="rail" aria-label="Sundesk navigation">
        <div className="brand">
          <img src="/brand/sundesk-icon.png" alt="Sundesk logo" />
          <div>
            <strong>Sundesk</strong>
            <span>private workbase</span>
          </div>
        </div>

        <nav className="main-nav">
          <a className="active" href="#today">Today</a>
          <a href="#communities">Communities</a>
          <a href="#record">Record</a>
          <a href="#views">Views</a>
          <a href="#build">Build</a>
        </nav>

        <section className="theme-card">
          <span>Theme</span>
          <div>
            {themes.map((theme) => (
              <button key={theme} className={theme === 'Sunrise Soft' ? 'selected' : ''}>
                {theme}
              </button>
            ))}
          </div>
        </section>

        <section className="privacy-card">
          <span>Privacy boundary</span>
          <strong>Track status. Not files.</strong>
          <p>No uploads. No pasted document contents. Sensitive contact data only when permitted.</p>
        </section>
      </aside>

      <section className="desk">
        <header className="hero" id="today">
          <div>
            <span className="eyebrow">Today</span>
            <h1>4 items need attention. 1 is a fire.</h1>
            <p>
              The queue is built from due dates, blockers, dependencies, follow-ups, event dates,
              and saved rules.
            </p>
          </div>
          <article className="digest-card">
            <span>Daily digest</span>
            <strong>7:30 AM</strong>
            <p>Next send goes to lindsaybelldesign@gmail.com.</p>
            <button>Preview digest</button>
          </article>
        </header>

        <section className="command-grid">
          <article className="queue-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Priority queue</span>
                <h2>Start here.</h2>
              </div>
              <button className="ghost">Tune rules</button>
            </div>

            <div className="priority-list">
              {priorityItems.map((item, index) => (
                <article className={`priority-card ${item.priority}`} key={item.id}>
                  <div className="priority-rank">{index + 1}</div>
                  <div className="priority-main">
                    <div className="priority-top">
                      <strong>{item.title}</strong>
                      <span className={`pill ${item.priority}`}>{priorityLabel(item.priority)}</span>
                    </div>
                    <p>{item.summary}</p>
                    <div className="reason-chain">
                      {item.reasons.map((reason, reasonIndex) => (
                        <span key={reason}>
                          {reasonIndex > 0 && <i aria-hidden="true" />}
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button>Open</button>
                </article>
              ))}
            </div>
          </article>

          <aside className="focus-stack">
            <article className="insight-card">
              <span>System read</span>
              <strong>Halifax is the only fire.</strong>
              <p>Everything else can move after the COI status is handled.</p>
            </article>

            <article className="community-signal" id="communities">
              <div className="panel-title compact">
                <div>
                  <span className="eyebrow">Communities</span>
                  <h2>Risk map</h2>
                </div>
              </div>
              <div className="signal-grid">
                {communities.map((community) => (
                  <button className={community.status} key={community.id}>
                    {community.name}
                    <span>{community.readiness}%</span>
                  </button>
                ))}
              </div>
            </article>

            <article className="next-meeting">
              <span className="eyebrow">Next meeting</span>
              <strong>Charlottetown. Tomorrow.</strong>
              <p>Agenda can be generated from 2 tasks, 1 risk, and 1 follow-up.</p>
              <button>Generate prep</button>
            </article>
          </aside>
        </section>

        <section className="record-drawer" id="record">
          <div className="drawer-header">
            <div>
              <span className="eyebrow">Selected record</span>
              <h2>Halifax community record.</h2>
            </div>
            <div className="drawer-actions">
              <button>+ Field</button>
              <button className="primary">Add linked record</button>
            </div>
          </div>

          <div className="drawer-grid">
            {selectedFields.map((field) => (
              <article className="field-strip" key={field.label}>
                <span>{field.label}</span>
                <strong>{field.value}</strong>
                <small>{field.type}</small>
              </article>
            ))}
          </div>

          <div className="linked-layout">
            <section>
              <div className="mini-title">
                <strong>Linked records</strong>
                <button>Open table</button>
              </div>
              <div className="linked-list">
                {linkedRecords.map((record) => (
                  <article key={record.id}>
                    <span className={`pill ${record.priority}`}>{record.type}</span>
                    <strong>{record.title}</strong>
                    <small>{record.detail}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="why-card">
              <div className="mini-title">
                <strong>Why surfaced</strong>
              </div>
              <ol>
                <li>COI status is missing.</li>
                <li>COI blocks venue readiness.</li>
                <li>Event is within 7 days.</li>
                <li>Follow-up is overdue.</li>
              </ol>
            </section>
          </div>
        </section>

        <section className="mode-grid" id="views">
          <article className="mode-card">
            <div className="mode-head">
              <span>Kanban</span>
              <strong>Drag status. Trigger rules.</strong>
            </div>
            <div className="kanban-preview">
              <div><b>Waiting</b><p>Permit update</p></div>
              <div><b>Blocked</b><p>COI status</p></div>
              <div><b>In progress</b><p>Meeting prep</p></div>
            </div>
          </article>

          <article className="mode-card">
            <div className="mode-head">
              <span>Calendar</span>
              <strong>Every date becomes visible.</strong>
            </div>
            <div className="calendar-preview">
              <div>12<span>COI</span></div>
              <div>13<span>Permit</span></div>
              <div>14<span>Prep</span></div>
              <div>15<span>Status</span></div>
            </div>
          </article>

          <article className="mode-card wide">
            <div className="mode-head">
              <span>Gantt</span>
              <strong>Dependencies show the critical path.</strong>
            </div>
            <div className="gantt-preview">
              <div><span>Halifax</span><i className="bar firebar" /><em>COI blocks venue readiness</em></div>
              <div><span>Moncton</span><i className="bar waitbar" /><em>Permit gates site map review</em></div>
              <div><span>Charlottetown</span><i className="bar prepbar" /><em>Meeting prep feeds action list</em></div>
            </div>
          </article>
        </section>

        <section className="build-zone" id="build">
          <article className="builder-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Build mode</span>
                <h2>Customize without breaking the base.</h2>
              </div>
            </div>
            <div className="build-grid">
              {buildFieldTypes.map((fieldType) => (
                <button key={fieldType}>{fieldType}</button>
              ))}
            </div>
          </article>

          <article className="automation-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Automations</span>
                <h2>Rules she can edit.</h2>
              </div>
              <button className="primary">New rule</button>
            </div>
            <div className="rules">
              {automationRules.map((rule) => (
                <p key={rule.id}>
                  <span>When</span> {rule.when} <span>Then</span> {rule.then}.
                </p>
              ))}
            </div>
          </article>

          <article className="onboarding-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Onboarding</span>
                <h2>First run sets the guardrails.</h2>
              </div>
            </div>
            <div className="setup-steps">
              <p><strong>1.</strong> Confirm privacy boundary.</p>
              <p><strong>2.</strong> Choose starter tables.</p>
              <p><strong>3.</strong> Pick fields and templates.</p>
              <p><strong>4.</strong> Set digest time.</p>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default App
