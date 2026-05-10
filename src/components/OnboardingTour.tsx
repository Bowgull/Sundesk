import { useEffect, useMemo, useState } from 'react'
import type { OnboardingStep } from '../data/onboarding'

type TargetRect = {
  height: number
  left: number
  top: number
  width: number
}

type OnboardingTourProps = {
  step: OnboardingStep | undefined
  status: 'notStarted' | 'inProgress' | 'completed' | 'dismissed'
  onAdvance: (step: OnboardingStep) => void
  onDismiss: () => void
  onSkip: () => void
  onStart: () => void
}

export function OnboardingTour({
  step,
  status,
  onAdvance,
  onDismiss,
  onSkip,
  onStart,
}: OnboardingTourProps) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const targetSelector = useMemo(() => step ? `[data-onboarding-target="${step.targetId}"]` : '', [step])

  useEffect(() => {
    if (status !== 'inProgress' || !step) {
      setTargetRect(null)
      return
    }

    function updateTargetRect() {
      const target = document.querySelector<HTMLElement>(targetSelector)

      if (!target) {
        setTargetRect(null)
        return
      }

      const rect = target.getBoundingClientRect()

      setTargetRect({
        height: rect.height,
        left: rect.left,
        top: rect.top,
        width: rect.width,
      })
    }

    updateTargetRect()
    window.addEventListener('resize', updateTargetRect)
    window.addEventListener('scroll', updateTargetRect, true)

    return () => {
      window.removeEventListener('resize', updateTargetRect)
      window.removeEventListener('scroll', updateTargetRect, true)
    }
  }, [status, step, targetSelector])

  useEffect(() => {
    if (status !== 'inProgress' || !step || step.requiredAction !== 'targetClick') {
      return
    }

    function completeFromExactTargetClick(event: MouseEvent) {
      if (!step) {
        return
      }

      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(targetSelector)
        : null

      if (target) {
        onAdvance(step)
      }
    }

    document.addEventListener('click', completeFromExactTargetClick, true)

    return () => document.removeEventListener('click', completeFromExactTargetClick, true)
  }, [onAdvance, status, step, targetSelector])

  if (status === 'notStarted') {
    return (
      <div className="onboarding-tour-layer choice" data-testid="onboarding-choice">
        <div className="onboarding-choice-card" data-onboarding-target="onboarding-welcome">
          <span>Welcome</span>
          <h2>Meep, this is Sundesk.</h2>
          <p>Today is where the day starts, Build is where the structure lives, and we are going to make the whole thing click without turning this into homework.</p>
          <div>
            <button type="button" onClick={onStart}>Start the tour</button>
            <button className="ghost" type="button" onClick={onDismiss}>Start on my own</button>
          </div>
        </div>
      </div>
    )
  }

  if (status !== 'inProgress' || !step) {
    return null
  }

  const canAdvanceManually = step.requiredAction === 'manual'

  return (
    <div className="onboarding-tour-layer active" data-testid="onboarding-tour">
      {targetRect && (
        <div
          aria-hidden="true"
          className="onboarding-target-ring"
          style={{
            height: targetRect.height + 12,
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
          }}
        />
      )}
      <article className="onboarding-annotation-card">
        <span>{step.title}</span>
        <p>{step.body}</p>
        <div className="onboarding-actions">
          {canAdvanceManually && (
            <button type="button" onClick={() => onAdvance(step)}>
              {step.primaryLabel || 'Next'}
            </button>
          )}
          <button className="ghost" type="button" onClick={onSkip}>Skip tour</button>
        </div>
      </article>
    </div>
  )
}
