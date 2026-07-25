import type { SundeskEducationState, SundeskLabRecord } from '../data/educationState'
import { getCopyModeText } from '../data/copyMode'
import { canCompleteSundeskLabLesson, getSundeskLabCurrentStep, type SundeskLabModule } from '../data/sundeskLab'

type SundeskLabScreenProps = {
  educationState: SundeskEducationState
  modules: SundeskLabModule[]
  onApplyAction: (moduleId: string, actionId: string) => void
  onCompleteStep: (moduleId: string) => void
  onContinueModule: (moduleId: string) => void
  onResetLabProgress: () => void
  onStartModuleOver: (moduleId: string) => void
  rupaulMode: boolean
}

type StageAction = {
  actionId: string
  label: string
  variant?: 'primary' | 'quiet'
}

const progressLabels = {
  notStarted: 'Not started',
  inProgress: 'In progress',
  completed: 'Done',
}

const surfaceLabels: Record<string, string> = {
  start: 'Map',
  build: 'Build',
  fields: 'Fields',
  tags: 'Tags',
  links: 'Links',
  communities: 'Places',
  today: 'Today',
  meetings: 'Meetings',
  timeline: 'Timeline',
  data: 'Routine',
}

export function SundeskLabScreen({
  educationState,
  modules,
  onApplyAction,
  onCompleteStep,
  onContinueModule,
  onResetLabProgress,
  onStartModuleOver,
  rupaulMode,
}: SundeskLabScreenProps) {
  const activeModule = modules.find((module) => module.id === educationState.lab.activeModuleId)
  const displayModule = activeModule || modules[0] || null
  const activeProgress = displayModule ? educationState.lab.modules[displayModule.id] : null
  const activeStep = displayModule ? getSundeskLabCurrentStep(modules, displayModule.id, activeProgress || undefined) : null
  const completedModuleCount = modules.filter((module) => educationState.lab.modules[module.id]?.status === 'completed').length
  const completedTaskIds = educationState.lab.sandbox.completedTaskIds
  const canComplete = displayModule ? canCompleteSundeskLabLesson(educationState, modules, displayModule.id) : false
  const receipt = displayModule ? educationState.lab.sandbox.generatedReceipts[displayModule.id] : ''
  const visibleRecords = getVisibleLabRecords(educationState.lab.sandbox.records, educationState.lab.sandbox.selectedFilterTag)

  return (
    <section className="sundesk-lab-screen" data-testid="sundesk-lab-screen" id="lab">
      <article className="screen-panel lab-hero">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Sandbox</span>
            <h1>Sundesk Lab</h1>
            <p className="panel-lede">Fake GTA event work. Real Sundesk moves. Practice state ready for sync.</p>
          </div>
          <button
            aria-label="Reset sample data"
            data-copy-plain="Reset sample data"
            title="Reset sample data"
            type="button"
            onClick={onResetLabProgress}
          >
            {getCopyModeText('button.resetLab', rupaulMode)}
          </button>
        </div>
        <div className="lab-status-strip">
          <div>
            <span>Progress</span>
            <strong>{completedModuleCount} of {modules.length}</strong>
          </div>
          <div>
            <span>Write gate</span>
            <strong>Sync-ready. Writes gated.</strong>
          </div>
          <div>
            <span>Data</span>
            <strong>Fake practice records.</strong>
          </div>
        </div>
      </article>

      <section className="screen-panel lab-simulator-shell" data-testid="lab-active-module">
        <nav className="lab-mission-rail" aria-label="Practice path" data-onboarding-target="lab-module-list" data-testid="lab-module-list">
          <div className="lab-rail-heading">
            <span>Practice path</span>
            <strong>{completedModuleCount} of {modules.length}</strong>
          </div>
          <div className="lab-rail-list">
            {modules.map((module) => {
              const progress = educationState.lab.modules[module.id]
              const status = progress?.status || 'notStarted'
              const isActive = displayModule?.id === module.id

              return (
                <article
                  className={`lab-rail-item ${isActive ? 'active' : ''} ${status}`}
                  data-testid={`lab-module-${module.id}`}
                  key={module.id}
                >
                  <button
                    aria-current={isActive ? 'step' : undefined}
                    type="button"
                    onClick={() => onContinueModule(module.id)}
                  >
                    <span>{String(module.deckSlide).padStart(2, '0')}</span>
                    <strong>{module.title}</strong>
                    <small>{progressLabels[status]}</small>
                  </button>
                </article>
              )
            })}
          </div>
        </nav>

        {displayModule && (
          <main className="lab-simulator" aria-label="Lab simulator">
            <header className="lab-simulator-header">
              <div>
                <span>{surfaceLabels[displayModule.surface]} simulator</span>
                <h2>{displayModule.title}</h2>
                <p>{displayModule.scenarioBrief}</p>
              </div>
              <div className="lab-view-pills" aria-label="Lab view state">
                <span>{educationState.lab.sandbox.selectedView}</span>
                <span>{educationState.lab.sandbox.selectedFilterTag || 'All fake rows'}</span>
              </div>
            </header>

            <section className="lab-stage-and-coach">
              <section className="lab-stage" aria-label="Practice workspace" data-testid="lab-practice-stage">
                <div className="lab-stage-topline">
                  <div>
                    <span>Practice workspace</span>
                    <strong>GTA readiness room</strong>
                  </div>
                  <small>{displayModule.sampleData}</small>
                </div>
                {renderSandboxSurface({
                  module: displayModule,
                  records: visibleRecords,
                  selectedView: educationState.lab.sandbox.selectedView,
                  completedTaskIds,
                  onApplyAction,
                })}
              </section>

              <aside className="lab-coach-panel" aria-label="Coach">
                <div className="lab-card-kicker">
                  <span>Current check</span>
                  <small>{activeProgress?.status === 'completed' ? 'Done' : 'Practice data only'}</small>
                </div>
                <h3>{activeStep?.title || displayModule.requiredPractice}</h3>
                <p>{activeStep?.guidance || displayModule.taskInstruction}</p>

                <div className="lab-check-list" aria-label="Lesson checks">
                  {displayModule.steps.map((step) => {
                    const isDone = completedTaskIds.includes(step.actionId)

                    return (
                      <article className={isDone ? 'done' : ''} key={step.id}>
                        <span>{isDone ? 'Recorded' : 'Waiting'}</span>
                        <strong>{step.title}</strong>
                        <small>{isDone ? step.expectedReceipt : step.guidance}</small>
                      </article>
                    )
                  })}
                </div>

                <div className="lab-done-when">
                  <span>Done when</span>
                  <strong>{displayModule.expectedReceipt}</strong>
                </div>

                <div className="lab-practice-actions">
                  <button type="button" disabled={!canComplete || activeProgress?.status === 'completed'} onClick={() => onCompleteStep(displayModule.id)}>
                    Complete lesson
                  </button>
                  <button className="ghost" type="button" onClick={() => onStartModuleOver(displayModule.id)}>Start over</button>
                </div>
              </aside>
            </section>

            <section className="lab-inspector" aria-label="Lab state inspector">
              <article>
                <span>Receipt</span>
                <strong>{receipt || 'No receipt yet. Use the stage controls.'}</strong>
              </article>
              <article>
                <span>Sync state</span>
                <strong>Education snapshot. Version {educationState.lab.sandbox.version}. Sample {educationState.lab.sandbox.sampleWorkspaceVersion}.</strong>
              </article>
              <article>
                <span>Boundary</span>
                <strong>{educationState.lab.sandbox.records.length} fake records. Real workspace untouched.</strong>
              </article>
            </section>
          </main>
        )}
      </section>
    </section>
  )
}

function getVisibleLabRecords(records: SundeskLabRecord[], selectedFilterTag: string | null) {
  if (!selectedFilterTag) {
    return records
  }

  return records.filter((record) => record.tags.includes(selectedFilterTag))
}

function renderSandboxSurface({
  module,
  records,
  selectedView,
  completedTaskIds,
  onApplyAction,
}: {
  module: SundeskLabModule
  records: SundeskLabRecord[]
  selectedView: string
  completedTaskIds: string[]
  onApplyAction: (moduleId: string, actionId: string) => void
}) {
  const action = (actionId: string, label: string, variant?: StageAction['variant']) => ({
    actionId,
    label,
    variant,
  })
  const apply = (actionId: string) => onApplyAction(module.id, actionId)

  if (module.surface === 'start') {
    return (
      <section className="lab-command-map" aria-label="Command map">
        <div className="lab-map-grid">
          <StageCard title="Build" detail="Paste source rows into a working table." tone="build" action={action('open-command-map', 'Open map', 'primary')} completedTaskIds={completedTaskIds} onApply={apply} />
          <StageCard title="Today" detail="Separate now, waiting, and next." tone="today" action={action('confirm-practice-boundary', 'Confirm boundary')} completedTaskIds={completedTaskIds} onApply={apply} />
          <StageCard title="Meetings" detail="Generate the weekly receipt from linked work." tone="meeting" completedTaskIds={completedTaskIds} onApply={apply} />
        </div>
        {renderRecordGrid(records.slice(0, 4), completedTaskIds, apply, module)}
      </section>
    )
  }

  if (module.surface === 'build') {
    return (
      <section className="lab-build-surface" aria-label="Build practice grid">
        <div className="lab-workbench-row">
          <label className="lab-practice-control wide">
            <span>Paste source rows</span>
            <textarea
              aria-label="Paste fake source rows"
              defaultValue={'Kensington permit follow-up\tBlocked\t2026-06-11\nVendor COI replies\tWaiting\t2026-06-12\nSite map cleanup\tIn progress\t2026-06-13'}
            />
          </label>
          <label className="lab-practice-control">
            <span>Permit status</span>
            <select
              aria-label="Permit status editor"
              defaultValue={completedTaskIds.includes('edit-permit-status') ? 'Blocked' : 'Open'}
              onChange={(event) => {
                if (event.currentTarget.value === 'Blocked') {
                  apply('edit-permit-status')
                }
              }}
            >
              <option value="Open">Open</option>
              <option value="Blocked">Blocked</option>
            </select>
          </label>
        </div>
        <div className="lab-stage-actions">
          <ActionButton action={action('paste-lab-rows', 'Paste starter rows', 'primary')} completedTaskIds={completedTaskIds} onApply={apply} />
          <ActionButton action={action('add-weather-row', 'Add weather row')} completedTaskIds={completedTaskIds} onApply={apply} />
        </div>
        {renderRecordGrid(records, completedTaskIds, apply, module)}
      </section>
    )
  }

  if (module.surface === 'fields') {
    return (
      <section className="lab-field-surface" aria-label="Field practice surface">
        <article>
          <span>Plain column</span>
          <strong>Due</strong>
          <small>Text dates cannot route work cleanly.</small>
          <ActionButton action={action('open-field-helper', 'Open helper', 'primary')} completedTaskIds={completedTaskIds} onApply={apply} />
        </article>
        <article>
          <span>Field type</span>
          <strong>Date</strong>
          <small>Due dates can land records in Today and Timeline.</small>
          <label className="lab-practice-control inline">
            <span>Due field</span>
            <select
              aria-label="Due field type"
              defaultValue={completedTaskIds.includes('set-due-date-field') ? 'date' : 'text'}
              onChange={(event) => {
                if (event.currentTarget.value === 'date') {
                  apply('set-due-date-field')
                }
              }}
            >
              <option value="text">Text</option>
              <option value="date">Date</option>
            </select>
          </label>
          <ActionButton action={action('set-due-date-field', 'Set date field')} completedTaskIds={completedTaskIds} onApply={apply} />
        </article>
        <article>
          <span>Result</span>
          <strong>{completedTaskIds.includes('set-due-date-field') ? 'Date behaviour active.' : 'Waiting for field type.'}</strong>
          <small>Same row. Better behaviour.</small>
        </article>
      </section>
    )
  }

  if (module.surface === 'tags') {
    return (
      <section className="lab-tags-surface" aria-label="Tags practice surface">
        <div className="lab-tag-builder">
          <article>
            <span>Row</span>
            <strong>Kensington permit follow-up</strong>
            <small>Tags should change where the record appears.</small>
          </article>
          <div className="lab-tag-chip-row" aria-label="Tag picker">
            <button
              aria-label="Add tag"
              type="button"
              disabled={completedTaskIds.includes('tag-risk-row')}
              onClick={() => apply('tag-risk-row')}
            >
              Permit risk
            </button>
            <button type="button" disabled={completedTaskIds.includes('filter-risk-tag')} onClick={() => apply('filter-risk-tag')}>Filter tag</button>
          </div>
        </div>
        {renderRecordGrid(records, completedTaskIds, apply, module)}
      </section>
    )
  }

  if (module.surface === 'communities' || module.surface === 'links') {
    const placeRecords = records.filter((record) => record.communityId === 'gta-kensington-market')
    const blockedRecord = placeRecords.find((record) => record.status === 'Blocked')
    const nextRecord = placeRecords.find((record) => record.id === 'gta-weekly-meeting') || placeRecords[0] || null

    return (
      <section className="lab-links-surface" aria-label="Place practice surface">
        <article className="lab-place-card">
          <span>Place</span>
          <strong>Kensington Market</strong>
          <small>{blockedRecord ? `${blockedRecord.title} is ${blockedRecord.status.toLowerCase()}.` : 'No blocker linked yet.'}</small>
          {module.surface === 'links' && (
            <label className="lab-practice-control inline">
              <span>Linked place</span>
              <select
                aria-label="Linked place picker"
                defaultValue={completedTaskIds.includes('link-permit-to-dock') ? 'gta-kensington-market' : ''}
                onChange={(event) => {
                  if (event.currentTarget.value === 'gta-kensington-market') {
                    apply('link-permit-to-dock')
                  }
                }}
              >
                <option value="">No place</option>
                <option value="gta-kensington-market">Kensington Market</option>
                <option value="gta-danforth-night-market">Danforth Night Market</option>
              </select>
            </label>
          )}
          <div className="lab-stage-actions">
            {module.surface === 'links' && <ActionButton action={action('link-permit-to-dock', 'Link permit row', 'primary')} completedTaskIds={completedTaskIds} onApply={apply} />}
            {module.surface === 'links' && <ActionButton action={action('read-dock-backlink', 'Read backlink')} completedTaskIds={completedTaskIds} onApply={apply} />}
            {module.surface === 'communities' && <ActionButton action={action('open-island-dock', 'Open place', 'primary')} completedTaskIds={completedTaskIds} onApply={apply} />}
            {module.surface === 'communities' && <ActionButton action={action('read-place-state', 'Read state')} completedTaskIds={completedTaskIds} onApply={apply} />}
          </div>
        </article>
        <article>
          <span>Place state</span>
          <strong>{placeRecords.length} linked rows. {blockedRecord ? '1 blocker.' : '0 blockers.'}</strong>
          <small>{nextRecord ? `Next read: ${nextRecord.title}. ${nextRecord.notes}` : 'Link a row before reading the place.'}</small>
        </article>
        {renderRecordGrid(placeRecords, completedTaskIds, apply, module, true)}
      </section>
    )
  }

  if (module.surface === 'today') {
    const nowRecords = records.filter((record) => record.id === 'gta-permit-risk')
    const waitingRecords = records.filter((record) => record.status === 'Waiting')
    const nextRecords = records
      .filter((record) => record.status !== 'Waiting' && record.id !== 'gta-permit-risk')
      .slice(0, 3)

    return (
      <section className="lab-today-surface" aria-label="Today practice surface">
        <TodayLane title="Now" records={nowRecords} action={action('route-water-now', 'Route now', 'primary')} completedTaskIds={completedTaskIds} onApply={apply} />
        <TodayLane title="Waiting" records={waitingRecords} action={action('write-catering-chase', 'Write chase receipt')} completedTaskIds={completedTaskIds} onApply={apply} />
        <TodayLane title="Next" records={nextRecords} completedTaskIds={completedTaskIds} onApply={apply} />
        <article>
          <span>Today read</span>
          <strong>{nowRecords.length} now. {waitingRecords.length} waiting. {nextRecords.length} next.</strong>
          <small>Waiting keeps the reason visible before the meeting note.</small>
        </article>
      </section>
    )
  }

  if (module.surface === 'meetings') {
    const blockedRecords = records.filter((record) => record.status === 'Blocked')
    const waitingRecords = records.filter((record) => record.status === 'Waiting')
    const movingRecords = records.filter((record) => record.status === 'In progress')
    const meetingRecord = records.find((record) => record.id === 'gta-weekly-meeting')

    return (
      <section className="lab-meeting-surface" aria-label="Meeting practice surface">
        <article>
          <span>Generated note</span>
          <strong>Weekly event readiness</strong>
          <p>{blockedRecords.length} blocked. {waitingRecords.length} waiting. {movingRecords.length} moving. Next move: assign one owner before the meeting.</p>
          <label className="lab-practice-control wide">
            <span>Editable meeting note</span>
            <textarea
              aria-label="Weekly note editor"
              defaultValue={meetingRecord?.notes || 'Generate the note from connected fake work.'}
            />
          </label>
          <div className="lab-stage-actions">
            <ActionButton action={action('generate-weekly-note', 'Generate note', 'primary')} completedTaskIds={completedTaskIds} onApply={apply} />
            <ActionButton action={action('edit-weekly-note', 'Edit receipt')} completedTaskIds={completedTaskIds} onApply={apply} />
          </div>
        </article>
        <div className="lab-record-grid compact" aria-label="Meeting source rows">
          <div className="lab-record-grid-head">
            <span>Agenda line</span>
            <span>Source</span>
            <span>Owner</span>
            <span>Receipt</span>
          </div>
          {records.slice(0, 4).map((record) => (
            <div key={record.id}>
              <span>{record.title}</span>
              <span>{record.status}</span>
              <span>{record.owner || 'Unassigned'}</span>
              <span>{record.notes}</span>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (module.surface === 'timeline') {
    const datedRecords = records.filter((record) => record.due)
    const blockedRecords = records.filter((record) => record.status === 'Blocked')

    return (
      <section className={`lab-timeline-surface ${selectedView}`} aria-label="Timeline practice surface">
        <div className="lab-stage-actions">
          <ActionButton action={action('view-kanban', 'Kanban', 'primary')} completedTaskIds={completedTaskIds} onApply={apply} />
          <ActionButton action={action('view-calendar', 'Calendar')} completedTaskIds={completedTaskIds} onApply={apply} />
          <ActionButton action={action('view-graph', 'Graph')} completedTaskIds={completedTaskIds} onApply={apply} />
        </div>
        <div className="lab-record-grid compact" aria-label="Timeline state">
          <div className="lab-record-grid-head">
            <span>View</span>
            <span>Reads</span>
            <span>Rows</span>
            <span>Current state</span>
          </div>
          <div>
            <span>Kanban</span>
            <span>Status movement</span>
            <span>{records.length}</span>
            <span>{selectedView === 'kanban' ? 'Open' : 'Ready'}</span>
          </div>
          <div>
            <span>Calendar</span>
            <span>Date pressure</span>
            <span>{datedRecords.length}</span>
            <span>{selectedView === 'calendar' ? 'Open' : 'Ready'}</span>
          </div>
          <div>
            <span>Graph</span>
            <span>Linked risk</span>
            <span>{blockedRecords.length}</span>
            <span>{selectedView === 'graph' ? 'Open' : 'Ready'}</span>
          </div>
        </div>
        {selectedView === 'graph' ? renderRiskGraph() : renderTimelineRecords(records, selectedView)}
      </section>
    )
  }

  if (module.surface === 'data') {
    const waitingCount = records.filter((record) => record.status === 'Waiting').length
    const blockedCount = records.filter((record) => record.status === 'Blocked').length
    const openTomorrowCount = records.filter((record) => record.due && record.due > '2026-06-11').length

    return (
      <section className="lab-boundary-surface" aria-label="Data boundary">
        <article>
          <span>Write gate</span>
          <strong>No Firebase writes without approval.</strong>
          <ActionButton action={action('confirm-data-boundary', 'Confirm boundary', 'primary')} completedTaskIds={completedTaskIds} onApply={apply} />
        </article>
        <article>
          <span>End of day</span>
          <strong>What changed. What waits. What opens tomorrow.</strong>
          <ActionButton action={action('write-end-day-receipt', 'Write receipt')} completedTaskIds={completedTaskIds} onApply={apply} />
        </article>
        <article>
          <span>Practice state</span>
          <strong>{records.length} fake rows. {blockedCount} blocked. {waitingCount} waiting.</strong>
          <small>{openTomorrowCount} dated rows open after Jun 11.</small>
        </article>
        <div className="lab-record-grid compact" aria-label="End-of-day state">
          <div className="lab-record-grid-head">
            <span>Routine line</span>
            <span>Count</span>
            <span>Source</span>
            <span>Next action</span>
          </div>
          <div>
            <span>Changed</span>
            <span>{completedTaskIds.length}</span>
            <span>Lab actions</span>
            <span>Write receipt</span>
          </div>
          <div>
            <span>Waits</span>
            <span>{waitingCount}</span>
            <span>Fake records</span>
            <span>Keep owner visible</span>
          </div>
          <div>
            <span>Tomorrow</span>
            <span>{openTomorrowCount}</span>
            <span>Due dates</span>
            <span>Read before meetings</span>
          </div>
        </div>
      </section>
    )
  }

  return renderRecordGrid(records, completedTaskIds, apply, module)
}

function StageCard({
  title,
  detail,
  tone,
  action,
  completedTaskIds,
  onApply,
}: {
  title: string
  detail: string
  tone: string
  action?: StageAction
  completedTaskIds: string[]
  onApply: (actionId: string) => void
}) {
  return (
    <article className={`lab-stage-card ${tone}`}>
      <span>{title}</span>
      <strong>{detail}</strong>
      {action && <ActionButton action={action} completedTaskIds={completedTaskIds} onApply={onApply} />}
    </article>
  )
}

function TodayLane({
  title,
  records,
  action,
  completedTaskIds,
  onApply,
}: {
  title: string
  records: SundeskLabRecord[]
  action?: StageAction
  completedTaskIds: string[]
  onApply: (actionId: string) => void
}) {
  return (
    <article>
      <span>{title}</span>
      {records.length ? records.map((record) => <strong key={record.id}>{record.title}</strong>) : <strong>No fake rows.</strong>}
      {action && <ActionButton action={action} completedTaskIds={completedTaskIds} onApply={onApply} />}
    </article>
  )
}

function ActionButton({
  action,
  completedTaskIds,
  onApply,
}: {
  action: StageAction
  completedTaskIds: string[]
  onApply: (actionId: string) => void
}) {
  const isDone = completedTaskIds.includes(action.actionId)

  return (
    <button
      className={`lab-stage-action ${action.variant === 'primary' ? 'primary' : ''}`}
      type="button"
      disabled={isDone}
      onClick={() => onApply(action.actionId)}
    >
      {isDone ? 'Recorded' : action.label}
    </button>
  )
}

function renderRecordGrid(
  records: SundeskLabRecord[],
  completedTaskIds: string[],
  onApply: (actionId: string) => void,
  module: SundeskLabModule,
  compact = false,
) {
  return (
    <section className={`lab-record-grid ${compact ? 'compact' : ''}`} aria-label="Build practice grid">
      <div className="lab-record-grid-head">
        <span>Item</span>
        <span>Status</span>
        <span>Due</span>
        <span>Tags</span>
        <span>Place</span>
        <span>Action</span>
      </div>
      {records.map((record) => (
        <div key={record.id}>
          <span>{record.title}</span>
          <span>{record.status}</span>
          <span>{record.due || 'No date'}</span>
          <span>{record.tags.join(', ') || 'No tags'}</span>
          <span>{record.communityId ? record.communityId.replace('gta-', '').replaceAll('-', ' ') : 'No place'}</span>
          <span>{renderRowAction(record, completedTaskIds, onApply, module)}</span>
        </div>
      ))}
    </section>
  )
}

function renderRowAction(
  record: SundeskLabRecord,
  completedTaskIds: string[],
  onApply: (actionId: string) => void,
  module: SundeskLabModule,
) {
  const validActionIds = new Set(module.steps.map((step) => step.actionId))

  if (record.id === 'gta-permit-risk' && validActionIds.has('edit-permit-status')) {
    return <ActionButton action={{ actionId: 'edit-permit-status', label: 'Mark blocked' }} completedTaskIds={completedTaskIds} onApply={onApply} />
  }

  if (record.id === 'gta-permit-risk' && validActionIds.has('route-water-now')) {
    return <ActionButton action={{ actionId: 'route-water-now', label: 'Route now' }} completedTaskIds={completedTaskIds} onApply={onApply} />
  }

  return <small>Read only</small>
}

function renderTimelineRecords(records: SundeskLabRecord[], selectedView: string) {
  return (
    <div className="lab-timeline-records">
      {records.slice(0, 5).map((record) => (
        <article key={record.id}>
          <span>{selectedView === 'kanban' ? record.status : record.due || 'No date'}</span>
          <strong>{record.title}</strong>
          <small>{record.tags.join(', ') || 'No tags'}</small>
        </article>
      ))}
    </div>
  )
}

function renderRiskGraph() {
  return (
    <div className="lab-risk-graph">
      <span>Permit risk</span>
      <strong>Kensington Market</strong>
      <span>Vendor COIs</span>
      <span>Site map</span>
    </div>
  )
}
