import type { SundeskEducationState } from '../data/educationState'
import { getCopyModeText } from '../data/copyMode'
import { getSundeskLabCurrentStep, type SundeskLabModule } from '../data/sundeskLab'

type SundeskLabScreenProps = {
  educationState: SundeskEducationState
  modules: SundeskLabModule[]
  onCompleteStep: (moduleId: string) => void
  onContinueModule: (moduleId: string) => void
  onResetLabProgress: () => void
  onStartModuleOver: (moduleId: string) => void
  rupaulMode: boolean
}

const progressLabels = {
  notStarted: 'Not started',
  inProgress: 'In progress',
  completed: 'Completed',
}

export function SundeskLabScreen({
  educationState,
  modules,
  onCompleteStep,
  onContinueModule,
  onResetLabProgress,
  onStartModuleOver,
  rupaulMode,
}: SundeskLabScreenProps) {
  const activeModule = modules.find((module) => module.id === educationState.lab.activeModuleId)
  const activeProgress = activeModule ? educationState.lab.modules[activeModule.id] : null
  const activeStep = activeModule ? getSundeskLabCurrentStep(modules, activeModule.id, activeProgress || undefined) : null
  const completedStepCount = activeProgress?.completedStepIds.length || 0
  const totalStepCount = activeModule?.steps.length || 0

  return (
    <section className="sundesk-lab-screen" data-testid="sundesk-lab-screen" id="lab">
      <article className="screen-panel lab-hero">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Sandbox</span>
            <h1>Sundesk Lab</h1>
            <p className="panel-lede">Fake GTA chaos. Real Sundesk moves. Your workspace stays untouched.</p>
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
          <section className="lab-current-step" aria-label="Current Lab step">
            <span>{activeProgress?.status === 'completed' ? 'Module complete' : 'Where you left off'}</span>
            <strong>{activeStep?.title || 'Complete.'}</strong>
            <p>{activeStep?.guidance || 'This module is done. Start over to practice it again.'}</p>
            <small>{activeStep?.scenario || activeModule.sampleData}</small>
            <div className="lab-progress-meter" aria-label={`${completedStepCount} of ${totalStepCount} steps complete`}>
              <span style={{ width: `${totalStepCount ? (completedStepCount / totalStepCount) * 100 : 0}%` }} />
            </div>
            <em>{completedStepCount} of {totalStepCount} done</em>
          </section>
          <div className="lab-step-list">
            {activeModule.steps.map((step) => (
              <span className={activeProgress?.completedStepIds.includes(step.id) ? 'done' : ''} key={step.id}>
                {step.title}
              </span>
            ))}
          </div>
          <button disabled={activeProgress?.status === 'completed'} type="button" onClick={() => onCompleteStep(activeModule.id)}>
            Mark step done
          </button>
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
