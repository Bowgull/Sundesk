import './App.css'
import { useEffect, useState } from 'react'
import {
  automationRules,
  buildFieldTypes,
  communities,
  linkedRecords,
  priorityItems,
  savedViews,
  selectedFields,
  tables,
  taskDependencies,
  type Priority,
} from './data/demoData'

const themes = [
  { label: 'Sunrise Soft', value: 'sunrise-soft' },
  { label: 'Sunset Bold', value: 'sunset-bold' },
  { label: 'Cloud Light', value: 'cloud-light' },
  { label: 'Focus Dark', value: 'focus-dark' },
  { label: 'Light', value: 'light' },
]

const starterTaskFields = [
  'Title',
  'Table',
  'Community',
  'Status',
  'Due date',
  'Priority',
  'Depends on',
  'Linked records',
]

const selectOptions = ['Missing', 'Requested', 'Received', 'Not needed']

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
  const [selectedTheme, setSelectedTheme] = useState(
    () => localStorage.getItem('sundesk-theme') || 'sunrise-soft',
  )

  useEffect(() => {
    localStorage.setItem('sundesk-theme', selectedTheme)
  }, [selectedTheme])

  return (
    <main className="app" data-theme={selectedTheme}>
      <aside className="rail" aria-label="Sundesk navigation">
        <div className="brand">
          <img src="/brand/sundesk-icon.png" alt="Sundesk logo" />
          <div>
            <strong>Sundesk</strong>
            <span>private workbase</span>
          </div>
        </div>

        <nav className="main-nav">
          <span>Work</span>
          <a className="active" href="#today">Today</a>
          <a href="#communities">Communities</a>
          <a href="#followups">Follow-ups</a>
          <a href="#meetings">Meetings</a>
          <a href="#timeline">Timeline</a>
          <span>System</span>
          <a href="#build">Build</a>
          <a href="#settings">Settings</a>
        </nav>

        <section className="privacy-card">
          <span>Privacy boundary</span>
          <strong>Track status. Not files.</strong>
          <p>Upload sensitive information at your own risk. Sundesk is built for metadata, not files.</p>
        </section>
      </aside>

      <section className="desk">
        <section className="onboarding-callout" aria-label="Onboarding status">
          <div>
            <span className="eyebrow">First run</span>
            <strong>Setup is required before real data.</strong>
            <p>Review privacy, choose a theme, set digest time, check starter tables, then add the first communities.</p>
          </div>
          <button>Run setup</button>
        </section>

        <header className="hero" id="today">
          <div>
            <span className="eyebrow">Today</span>
            <h1>4 items need attention. 1 is a fire.</h1>
            <p>
              The queue reads due dates, blockers, dependencies, follow-ups, event dates, and saved rules.
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
              <button className="ghost">Adjust rules</button>
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

            <article className="next-meeting" id="meetings">
              <span className="eyebrow">Next meeting</span>
              <strong>Charlottetown. Tomorrow.</strong>
              <p>Agenda can be generated from 2 tasks, 1 risk, and 1 follow-up.</p>
              <button>Generate prep</button>
            </article>
          </aside>
        </section>

        <section className="task-zone" id="tasks">
          <article className="task-creator">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Tasks</span>
                <h2>Create work. Link it to the base.</h2>
              </div>
              <button className="primary">New task</button>
            </div>
            <div className="task-form-preview" aria-label="Task creation fields">
              {starterTaskFields.map((field) => (
                <div key={field}>
                  <span>{field}</span>
                  <strong>{field === 'Depends on' ? 'Pick another record' : 'Ready'}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="dependency-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Dependencies</span>
                <h2>What blocks what.</h2>
              </div>
              <button>Add dependency</button>
            </div>
            <div className="dependency-list">
              {taskDependencies.map((dependency) => (
                <article key={dependency.id}>
                  <strong>{dependency.task}</strong>
                  <span>Depends on {dependency.dependsOn}</span>
                  <small>{dependency.linkedTable}. {dependency.reason}</small>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className="record-drawer" id="record">
          <div className="drawer-header">
            <div>
                <span className="eyebrow">Community</span>
              <h2>Halifax community record.</h2>
            </div>
            <div className="drawer-actions">
              <button>+ Add detail</button>
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
            <section id="followups">
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
                <strong>Move work across statuses.</strong>
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
                <strong>See meetings and deadlines by date.</strong>
            </div>
            <div className="calendar-preview">
              <div>12<span>COI</span></div>
              <div>13<span>Permit</span></div>
              <div>14<span>Prep</span></div>
              <div>15<span>Status</span></div>
            </div>
          </article>

          <article className="mode-card wide" id="timeline">
            <div className="mode-head">
              <span>Gantt</span>
              <strong>See what blocks what.</strong>
            </div>
            <div className="gantt-preview">
              <div><span>Halifax</span><i className="bar firebar" /><em>COI blocks venue readiness</em></div>
              <div><span>Moncton</span><i className="bar waitbar" /><em>Permit gates site map review</em></div>
              <div><span>Charlottetown</span><i className="bar prepbar" /><em>Meeting prep feeds action list</em></div>
            </div>
          </article>
        </section>

        <section className="build-zone" id="build">
          <article className="builder-panel wide">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Build</span>
                <h2>Tables Lindsay can create and change.</h2>
              </div>
              <button className="primary">New table</button>
            </div>
            <p className="panel-copy">Build is where the system changes. Today stays for the work.</p>
            <div className="table-list">
              {tables.map((table) => (
                <article key={table.id}>
                  <div>
                    <strong>{table.name}</strong>
                    <p>{table.purpose}</p>
                  </div>
                  <span>{table.records} records</span>
                </article>
              ))}
            </div>
          </article>

          <article className="builder-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Fields</span>
                <h2>Airtable-like field types.</h2>
              </div>
              <button>New field</button>
            </div>
            <div className="build-grid field-grid">
              {buildFieldTypes.map((fieldType) => (
                <button key={fieldType}>{fieldType}</button>
              ))}
            </div>
            <div className="select-builder">
              <span className="eyebrow">Dropdown example</span>
              <strong>COI status</strong>
              <div>
                {selectOptions.map((option) => (
                  <small key={option}>{option}</small>
                ))}
              </div>
            </div>
          </article>

          <article className="builder-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Views</span>
                <h2>Saved ways to work.</h2>
              </div>
              <button>New view</button>
            </div>
            <div className="view-list">
              {savedViews.map((view) => (
                <article key={view.id}>
                  <span>{view.type}</span>
                  <strong>{view.name}</strong>
                  <p>{view.rule}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="automation-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Automations</span>
                <h2>Plain rules she can edit.</h2>
              </div>
              <button className="primary">New rule</button>
            </div>
            <div className="rules">
              {automationRules.map((rule) => (
                <p key={rule.id}>
                  <span>When</span> {rule.when}. <span>Then</span> {rule.then}.
                </p>
              ))}
            </div>
          </article>

          <article className="onboarding-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Templates</span>
                <h2>Starts she can reuse.</h2>
              </div>
            </div>
            <div className="setup-steps">
              <p><strong>Community setup.</strong> Starter checklist for each location.</p>
              <p><strong>Weekly meeting.</strong> Agenda from open work and risks.</p>
              <p><strong>Approval chase.</strong> Follow-up path for permits and confirmations.</p>
              <p><strong>Event readiness.</strong> Final status check before event week.</p>
            </div>
          </article>

          <article className="onboarding-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Exports</span>
                <h2>Take out the current view.</h2>
              </div>
            </div>
            <div className="setup-steps">
              <p><strong>Current view.</strong> Export the records on screen.</p>
              <p><strong>Meeting prep.</strong> Export agenda text from linked work.</p>
              <p><strong>Digest text.</strong> Export the daily summary before it sends.</p>
            </div>
          </article>
        </section>

        <section className="settings-zone" id="settings">
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
                  className={theme.value === selectedTheme ? 'selected' : ''}
                  onClick={() => setSelectedTheme(theme.value)}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </article>

          <article className="settings-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Digest</span>
                <h2>Morning summary.</h2>
              </div>
            </div>
            <div className="settings-list">
              <p><strong>Status.</strong> On</p>
              <p><strong>Recipient.</strong> lindsaybelldesign@gmail.com</p>
              <p><strong>Time.</strong> 7:30 AM</p>
              <p><strong>Timezone.</strong> America/Toronto</p>
              <p><strong>Includes.</strong> Today queue, overdue follow-ups, at-risk communities, meeting prep.</p>
              <p><strong>Actions.</strong> Preview digest. Send test digest.</p>
            </div>
          </article>

          <article className="settings-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Privacy</span>
                <h2>Upload at your own risk.</h2>
              </div>
            </div>
            <div className="settings-list">
              <p><strong>Boundary.</strong> Sundesk is for status, dates, owners, links, and short notes.</p>
              <p><strong>Sensitive information.</strong> Files, document contents, private numbers, permits, COI files, and contract text are your responsibility if added.</p>
              <p><strong>Bridge.</strong> Obsidian later is allowed only as an opt-in export of safe metadata.</p>
            </div>
          </article>

          <article className="settings-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Setup</span>
                <h2>Run setup again.</h2>
              </div>
              <button>Run setup again</button>
            </div>
            <div className="settings-list">
              <p><strong>Review privacy.</strong> Show the warning again.</p>
              <p><strong>Choose theme.</strong> Keep or change the saved theme.</p>
              <p><strong>Check digest.</strong> Recipient, time, timezone, and included items.</p>
              <p><strong>Review starter tables.</strong> No data will be deleted.</p>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default App
