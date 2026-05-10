import type { AppScreen } from '../appConfig'
import type { SundeskEducationState } from './educationState'

export type OnboardingRequiredAction = 'routeMounted' | 'targetClick' | 'manual'

export type OnboardingStep = {
  id: string
  title: string
  body: string
  targetId: string
  requiredAction: OnboardingRequiredAction
  screen?: AppScreen
  actionId: string
  actionHint?: string
  primaryLabel?: string
}

type OnboardingStepProgress = {
  current: number
  total: number
  label: string
}

export const onboardingSteps: readonly OnboardingStep[] = [
  {
    id: 'today',
    title: 'Today',
    body: 'Today is the look-at-this-first screen, because the chaos has to stand in one line eventually.',
    targetId: 'nav-today',
    requiredAction: 'routeMounted',
    screen: 'today',
    actionId: 'view-today',
    actionHint: 'Opening Today confirms this step.',
  },
  {
    id: 'build-nav',
    title: 'Build',
    body: 'Build is where tables live. Tables are the buckets, records are the stuff inside them, and this is the bit that makes Sundesk make sense.',
    targetId: 'nav-build',
    requiredAction: 'targetClick',
    screen: 'build',
    actionId: 'click-build',
    actionHint: 'Click Build in the sidebar.',
  },
  {
    id: 'table-tabs',
    title: 'Tables',
    body: 'A table is one kind of thing you track, like communities, work, approvals, people, meetings, or risks.',
    targetId: 'build-table-tabs',
    requiredAction: 'targetClick',
    screen: 'build',
    actionId: 'select-table',
    actionHint: 'Click a table tab.',
  },
  {
    id: 'table-meaning',
    title: 'Active table',
    body: 'This is the table you are working in now. Records underneath belong to this kind of thing.',
    targetId: 'build-active-table',
    requiredAction: 'routeMounted',
    screen: 'build',
    actionId: 'view-active-table',
    actionHint: 'The active table is mounted.',
  },
  {
    id: 'record-meaning',
    title: 'Records',
    body: 'A record is one actual item in a table: one task, one person, one meeting, one community.',
    targetId: 'build-record-row',
    requiredAction: 'targetClick',
    screen: 'build',
    actionId: 'open-record',
    actionHint: 'Click a record row.',
  },
  {
    id: 'field-meaning',
    title: 'Fields',
    body: 'Fields tell Sundesk how to treat information, so a date can land in Today, a link can connect work, and tags can help you find the weird little things later.',
    targetId: 'build-add-field',
    requiredAction: 'targetClick',
    screen: 'build',
    actionId: 'open-field-controls',
    actionHint: 'Click Add field.',
  },
  {
    id: 'field-types',
    title: 'Field types',
    body: [
      'Text: Short labels, names, titles, and quick details.',
      'Long text: Notes, context, updates, and anything that needs room.',
      'Number: Counts, amounts, percentages, square footage, budget numbers, and scores.',
      'Date: Due dates, meetings, follow-ups, expiry dates, renewal dates, and timelines.',
      'Status: One current stage, like Not started, Waiting, In review, or Done.',
      'Checkbox: Yes or no tracking, like sent, approved, received, urgent, or needs follow-up.',
      'Tags: Multiple labels on one record, so a task can be Waiting, COI, Steph, and Friday all at once.',
      'Link: A connection to another table, like a task connected to a community, person, meeting, or document.',
      'Lookup: Information pulled from a linked record so she does not retype it.',
      'Rollup: A calculated summary from linked records, like count, total, earliest date, latest date, or open items.',
    ].join('\n'),
    targetId: 'field-type-menu',
    requiredAction: 'targetClick',
    screen: 'build',
    actionId: 'open-type-menu',
    actionHint: 'Open or change the type menu.',
  },
  {
    id: 'tags',
    title: 'Tags',
    body: 'Tags are your own labels. Add more than one when one label is not enough, because obviously one label is never enough.',
    targetId: 'field-tags-cell',
    requiredAction: 'targetClick',
    screen: 'build',
    actionId: 'inspect-tags',
    actionHint: 'Click a tags cell or picker.',
  },
  {
    id: 'linked-records',
    title: 'Linked records',
    body: 'Links are how one record points to another, so a task can belong to a community and still show up in the places that need it.',
    targetId: 'linked-record-cell',
    requiredAction: 'targetClick',
    screen: 'build',
    actionId: 'inspect-linked-records',
    actionHint: 'Click a linked-record cell or picker.',
  },
  {
    id: 'views',
    title: 'Views',
    body: 'Views are different ways to look at the same table, so you can filter, sort, group, colour, save, and pin the angle that helps.',
    targetId: 'build-view-controls',
    requiredAction: 'targetClick',
    screen: 'build',
    actionId: 'open-view-controls',
    actionHint: 'Click the view controls.',
  },
  {
    id: 'meetings',
    title: 'Meetings',
    body: 'Meetings pull the work, waiting items, risks, and linked source records into one prep surface.',
    targetId: 'nav-meetings',
    requiredAction: 'targetClick',
    screen: 'meetings',
    actionId: 'open-meetings',
    actionHint: 'Click Meetings in the sidebar.',
  },
  {
    id: 'meeting-pdf',
    title: 'Meeting PDF',
    body: 'Export your meeting note PDF, and remember to send Josh your template to fine tune this better for you my pookie.',
    targetId: 'meeting-export-pdf',
    requiredAction: 'targetClick',
    screen: 'meetings',
    actionId: 'export-meeting-pdf',
    actionHint: 'Click Export PDF.',
  },
  {
    id: 'lab',
    title: 'Sundesk Lab',
    body: 'Sundesk Lab is the practice room. Fake GTA chaos, real Sundesk moves, no risk to your actual workspace.',
    targetId: 'nav-sundesk-lab',
    requiredAction: 'targetClick',
    screen: 'lab',
    actionId: 'view-lab-placeholder',
    actionHint: 'Click Sundesk Lab in the sidebar.',
  },
  {
    id: 'done',
    title: 'Done',
    body: 'Tour complete. Today stays home. Build stays visible. The system shows its work.',
    targetId: 'lab-module-list',
    requiredAction: 'manual',
    actionId: 'finish-tour',
    actionHint: 'Finish when the Lab list is visible.',
    primaryLabel: 'Finish',
  },
]

export function getOnboardingStep(stepId: string | null | undefined) {
  return onboardingSteps.find((step) => step.id === stepId)
}

export function getFirstOnboardingStep() {
  return onboardingSteps[0]
}

export function getNextOnboardingStep(stepId: string) {
  const index = onboardingSteps.findIndex((step) => step.id === stepId)

  return index >= 0 ? onboardingSteps[index + 1] : undefined
}

export function getPreviousOnboardingStep(stepId: string) {
  const index = onboardingSteps.findIndex((step) => step.id === stepId)

  return index > 0 ? onboardingSteps[index - 1] : undefined
}

export function getOnboardingStepProgress(stepId: string | null | undefined): OnboardingStepProgress {
  const index = onboardingSteps.findIndex((step) => step.id === stepId)
  const current = index >= 0 ? index + 1 : 0
  const total = onboardingSteps.length

  return {
    current,
    total,
    label: `${current} of ${total}`,
  }
}

export function startOnboarding(state: SundeskEducationState, timestamp = new Date().toISOString()): SundeskEducationState {
  return {
    ...state,
    onboarding: {
      status: 'inProgress',
      currentStepId: getFirstOnboardingStep().id,
      completedStepIds: ['welcome'],
      completedActionIds: ['start-tour'],
      startedAt: timestamp,
      completedAt: null,
      lastSeenAt: timestamp,
    },
  }
}

export function restartOnboarding(state: SundeskEducationState, timestamp = new Date().toISOString()) {
  return startOnboarding(state, timestamp)
}

export function dismissOnboarding(state: SundeskEducationState, timestamp = new Date().toISOString()): SundeskEducationState {
  return {
    ...state,
    onboarding: {
      ...state.onboarding,
      status: 'dismissed',
      currentStepId: null,
      lastSeenAt: timestamp,
    },
  }
}

export function advanceOnboarding(
  state: SundeskEducationState,
  stepId: string,
  actionId: string,
  timestamp = new Date().toISOString(),
): SundeskEducationState {
  if (state.onboarding.status !== 'inProgress' || state.onboarding.currentStepId !== stepId) {
    return state
  }

  const nextStep = getNextOnboardingStep(stepId)
  const completedStepIds = Array.from(new Set([...state.onboarding.completedStepIds, stepId]))
  const completedActionIds = Array.from(new Set([...state.onboarding.completedActionIds, actionId]))

  return {
    ...state,
    onboarding: {
      ...state.onboarding,
      status: nextStep ? 'inProgress' : 'completed',
      currentStepId: nextStep?.id || null,
      completedStepIds,
      completedActionIds,
      completedAt: nextStep ? null : timestamp,
      lastSeenAt: timestamp,
    },
  }
}

export function goBackOnboarding(
  state: SundeskEducationState,
  timestamp = new Date().toISOString(),
): SundeskEducationState {
  if (state.onboarding.status !== 'inProgress' || !state.onboarding.currentStepId) {
    return state
  }

  const previousStep = getPreviousOnboardingStep(state.onboarding.currentStepId)

  if (!previousStep) {
    return state
  }

  return {
    ...state,
    onboarding: {
      ...state.onboarding,
      currentStepId: previousStep.id,
      completedStepIds: state.onboarding.completedStepIds.filter((stepId) => stepId !== previousStep.id),
      completedActionIds: state.onboarding.completedActionIds.filter((actionId) => actionId !== previousStep.actionId),
      lastSeenAt: timestamp,
    },
  }
}
