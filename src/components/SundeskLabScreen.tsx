import type { SundeskEducationState } from '../data/educationState'
import type { SundeskLabModule } from '../data/sundeskLab'

type SundeskLabScreenProps = {
  educationState: SundeskEducationState
  modules: SundeskLabModule[]
  onContinueModule: (moduleId: string) => void
  onResetLabProgress: () => void
  onStartModuleOver: (moduleId: string) => void
}

const progressLabels = {
  notStarted: 'Not started',
  inProgress: 'In progress',
  completed: 'Completed',
}

export function SundeskLabScreen({
  educationState,
  modules,
  onContinueModule,
  onResetLabProgress,
  onStartModuleOver,
}: SundeskLabScreenProps) {
  const activeModule = modules.find((module) => module.id === educationState.lab.activeModuleId)
  const activeProgress = activeModule ? educationState.lab.modules[activeModule.id] : null

  return (
    <section className="sundesk-lab-screen" data-testid="sundesk-lab-screen" id="lab">
      <article className="screen-panel lab-hero">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Sandbox</span>
            <h1>Sundesk Lab</h1>
            <p className="panel-lede">Fake GTA chaos. Real Sundesk moves. Your workspace stays untouched.</p>
          </div>
          <button type="button" onClick={onResetLabProgress}>Reset sample data</button>
        </div>
        <div className="lab-sandbox-strip">
          <span>Sample workspace</span>
          <strong>GTA practice set.</strong>
          <small>Scarborough, Brampton, Toronto, Oakville, Hamilton. No real private records.</small>
        </div>
      </article>

      {activeModule && (
        <article className="screen-panel lab-active-module" data-testid="lab-active-module">
          <div>
            <span className="eyebrow">Continue</span>
            <h2>{activeModule.title}</h2>
            <p>{activeModule.requiredPractice}</p>
          </div>
          <div className="lab-step-list">
            {activeModule.steps.map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
          <small>{activeProgress?.currentStepId || `${activeModule.id}-start`}</small>
        </article>
      )}

      <section className="lab-module-list" aria-label="Lab modules" data-onboarding-target="lab-module-list" data-testid="lab-module-list">
        {modules.map((module) => {
          const progress = educationState.lab.modules[module.id]
          const status = progress?.status || 'notStarted'

          return (
            <article className="lab-module-card" data-testid={`lab-module-${module.id}`} key={module.id}>
              <div className="lab-module-top">
                <span>{progressLabels[status]}</span>
                <strong>{module.title}</strong>
              </div>
              <p>{module.teaches}</p>
              <small>{module.sampleData}</small>
              <div className="lab-practice">
                <span>Practice</span>
                <strong>{module.requiredPractice}</strong>
              </div>
              <div className="drawer-actions">
                <button type="button" onClick={() => onContinueModule(module.id)}>Continue</button>
                <button className="ghost" type="button" onClick={() => onStartModuleOver(module.id)}>Start over</button>
              </div>
            </article>
          )
        })}
      </section>
    </section>
  )
}
