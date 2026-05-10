import type { SundeskEducationProgress, SundeskEducationState } from './educationState'

export type SundeskLabModule = {
  id: string
  title: string
  teaches: string
  requiredPractice: string
  sampleData: string
  steps: SundeskLabModuleStep[]
}

export type SundeskLabModuleStep = {
  id: string
  title: string
  guidance: string
  scenario: string
  actionId: string
}

export const sundeskLabModules: SundeskLabModule[] = [
  {
    id: 'first-look',
    title: 'First look',
    teaches: 'Today, Build, Meetings, Lab',
    requiredPractice: 'Navigate each surface',
    sampleData: 'Scarborough night-market prep, North York vendor calls, and one fake sponsor named Mina.',
    steps: [
      {
        id: 'first-look-today',
        title: 'Open Today',
        guidance: 'Start where the day starts. Today shows what can slip first.',
        scenario: 'Scarborough night-market setup has 3 moving pieces and one calm fake sponsor named Mina.',
        actionId: 'view-today',
      },
      {
        id: 'first-look-build',
        title: 'Open Build',
        guidance: 'Build is where the structure lives. Tables, records, fields.',
        scenario: 'North York vendor calls need a place to land before they become noise.',
        actionId: 'view-build',
      },
      {
        id: 'first-look-meetings',
        title: 'Open Meetings',
        guidance: 'Meetings pull linked work into one prep surface.',
        scenario: 'Mina wants the update without the spreadsheet archaeology.',
        actionId: 'view-meetings',
      },
      {
        id: 'first-look-return',
        title: 'Return to Lab',
        guidance: 'Come back here to keep the practice thread visible.',
        scenario: 'Fake chaos stays contained. The real workspace stays clean.',
        actionId: 'return-to-lab',
      },
    ],
  },
  {
    id: 'tables',
    title: 'Tables',
    teaches: 'What tables are',
    requiredPractice: 'Switch tables and open table menu',
    sampleData: 'Mississauga venues, Etobicoke vendors, and a table for fake approval lanes.',
    steps: [
      {
        id: 'tables-switch',
        title: 'Switch the sample table',
        guidance: 'A table is one kind of thing. Move between them before editing anything.',
        scenario: 'Mississauga venues and Etobicoke vendors belong in different buckets.',
        actionId: 'switch-table',
      },
      {
        id: 'tables-options',
        title: 'Open table options',
        guidance: 'Table controls change the bucket. Use them slowly.',
        scenario: 'The fake approval lane needs a name that says what it tracks.',
        actionId: 'open-table-options',
      },
      {
        id: 'tables-purpose',
        title: 'Read the table purpose',
        guidance: 'If the purpose is fuzzy, the table will collect junk.',
        scenario: 'Approvals are not vendors. That distinction saves the week later.',
        actionId: 'read-table-purpose',
      },
    ],
  },
  {
    id: 'records',
    title: 'Records',
    teaches: 'What records are',
    requiredPractice: 'Open, edit, and close one record',
    sampleData: 'One Brampton stage riser, one Toronto food truck, one very calm fake coordinator.',
    steps: [
      {
        id: 'records-open',
        title: 'Open a sample row',
        guidance: 'A record is one actual thing. Open it before judging the table.',
        scenario: 'The Brampton stage riser is one row, not a whole system.',
        actionId: 'open-record',
      },
      {
        id: 'records-edit',
        title: 'Change one field',
        guidance: 'Edit one field. Watch how the record stays the same object.',
        scenario: 'Toronto food truck status moves from waiting to booked.',
        actionId: 'edit-record-field',
      },
      {
        id: 'records-close',
        title: 'Close the record',
        guidance: 'Close the drawer and return to the table read.',
        scenario: 'The very calm fake coordinator can wait.',
        actionId: 'close-record',
      },
    ],
  },
  {
    id: 'fields',
    title: 'Fields',
    teaches: 'Field types',
    requiredPractice: 'Add one field in sample data',
    sampleData: 'Add a field for weather risk before the fake Lake Shore setup gets loud.',
    steps: [
      {
        id: 'fields-open-controls',
        title: 'Open field controls',
        guidance: 'Fields tell Sundesk what kind of information this is.',
        scenario: 'Lake Shore weather risk needs structure before it gets loud.',
        actionId: 'open-field-controls',
      },
      {
        id: 'fields-pick-type',
        title: 'Pick a field type',
        guidance: 'A date routes differently than text. Type matters.',
        scenario: 'Rain date is not a note. It has to land on the calendar.',
        actionId: 'pick-field-type',
      },
      {
        id: 'fields-add',
        title: 'Add the field',
        guidance: 'Add it to the sample data only. Real records are not involved.',
        scenario: 'The fake Lake Shore setup gets a risk field.',
        actionId: 'add-field',
      },
    ],
  },
  {
    id: 'tags',
    title: 'Tags',
    teaches: 'Multi-label work',
    requiredPractice: 'Add several custom tags to one record',
    sampleData: 'Tag Steph, vendor, waiting, and needs-eyes on the fake Scarborough permit row.',
    steps: [
      {
        id: 'tags-open-cell',
        title: 'Open a tag cell',
        guidance: 'Tags are labels you control. Open the cell before naming the mess.',
        scenario: 'Tag Steph, vendor, waiting, and needs-eyes on the fake Scarborough permit row.',
        actionId: 'open-tag-cell',
      },
      {
        id: 'tags-add-two',
        title: 'Add 2 tags',
        guidance: 'One label is rarely enough. Add the second one while the signal is fresh.',
        scenario: 'Steph is the person. Waiting is the state. Both can be true.',
        actionId: 'add-two-tags',
      },
      {
        id: 'tags-filter',
        title: 'Filter by one tag',
        guidance: 'Filtering turns tags from decoration into a working lane.',
        scenario: 'Show only the fake vendor rows before the call block.',
        actionId: 'filter-by-tag',
      },
    ],
  },
  {
    id: 'links',
    title: 'Links',
    teaches: 'Relationships',
    requiredPractice: 'Link a task to a community',
    sampleData: 'Connect the fake Liberty Village AV task to the fake Liberty Village community.',
    steps: [
      {
        id: 'links-open-control',
        title: 'Open link control',
        guidance: 'Links connect records without copying the same fact twice.',
        scenario: 'The Liberty Village AV task needs to point at the Liberty Village community.',
        actionId: 'open-link-control',
      },
      {
        id: 'links-choose-community',
        title: 'Choose a community',
        guidance: 'Pick the record this work belongs to.',
        scenario: 'The task belongs to Liberty Village, not the general Toronto bucket.',
        actionId: 'choose-community',
      },
      {
        id: 'links-check-backlink',
        title: 'Check the backlink',
        guidance: 'A good link reads both ways.',
        scenario: 'Open Liberty Village and the AV work should be visible from there.',
        actionId: 'check-backlink',
      },
    ],
  },
  {
    id: 'views',
    title: 'Views',
    teaches: 'Filter, sort, group, colour, save',
    requiredPractice: 'Create or modify one sample view',
    sampleData: 'Build a view for West End work that is waiting, dated, or carrying heat.',
    steps: [
      {
        id: 'views-filter',
        title: 'Filter sample rows',
        guidance: 'Start by narrowing the table.',
        scenario: 'West End work has enough noise. Filter for what is waiting.',
        actionId: 'filter-rows',
      },
      {
        id: 'views-group',
        title: 'Group by status',
        guidance: 'Grouping turns a flat list into lanes.',
        scenario: 'Waiting, blocked, and done should not sit in one pile.',
        actionId: 'group-by-status',
      },
      {
        id: 'views-save',
        title: 'Save the view',
        guidance: 'Save the angle that helps. Pin it if it earns the rail.',
        scenario: 'West End waiting work becomes a reusable read.',
        actionId: 'save-view',
      },
    ],
  },
  {
    id: 'today',
    title: 'Today',
    teaches: 'Surfacing work',
    requiredPractice: 'Route from Today into Build',
    sampleData: 'A fake Vaughan delivery issue bubbles up because the date is too close.',
    steps: [
      {
        id: 'today-open',
        title: 'Open Today',
        guidance: 'Today is not a dashboard. It is the first read.',
        scenario: 'A fake Vaughan delivery issue is too close to ignore.',
        actionId: 'open-today',
      },
      {
        id: 'today-read-reason',
        title: 'Read the reason',
        guidance: 'The receipt matters. Do not trust a surfaced item without a why.',
        scenario: 'The delivery issue surfaced because the date is near and status is waiting.',
        actionId: 'read-reason',
      },
      {
        id: 'today-route-build',
        title: 'Route into Build',
        guidance: 'When Today points at structure, Build is the next stop.',
        scenario: 'Open the fake task where the fields and links live.',
        actionId: 'route-into-build',
      },
    ],
  },
  {
    id: 'meetings',
    title: 'Meetings',
    teaches: 'Meeting prep and PDF',
    requiredPractice: 'Build and export a sample meeting PDF',
    sampleData: 'Prep a fake Monday check-in for Oakville vendors and Toronto production.',
    steps: [
      {
        id: 'meetings-open-prep',
        title: 'Open meeting prep',
        guidance: 'Meeting prep is the linked work, compressed.',
        scenario: 'Oakville vendors and Toronto production need one Monday read.',
        actionId: 'open-meeting-prep',
      },
      {
        id: 'meetings-read-linked-work',
        title: 'Read linked work',
        guidance: 'A meeting without linked work is just theatre.',
        scenario: 'The fake Oakville agenda pulls tasks instead of relying on memory.',
        actionId: 'read-linked-work',
      },
      {
        id: 'meetings-export-pdf',
        title: 'Export sample PDF',
        guidance: 'Export the sample note. Keep it fake.',
        scenario: 'The PDF is for practice, not a real send.',
        actionId: 'export-sample-pdf',
      },
    ],
  },
  {
    id: 'timeline',
    title: 'Timeline',
    teaches: 'Time-based work',
    requiredPractice: 'Inspect a dated record route',
    sampleData: 'A dated Hamilton pickup has to land before the fake weekend setup.',
    steps: [
      {
        id: 'timeline-open',
        title: 'Open Timeline',
        guidance: 'Timeline is for dated pressure.',
        scenario: 'The Hamilton pickup has a date that can slip.',
        actionId: 'open-timeline',
      },
      {
        id: 'timeline-find-dated-row',
        title: 'Find a dated row',
        guidance: 'Find the date before you chase the detail.',
        scenario: 'The fake weekend setup depends on that pickup landing first.',
        actionId: 'find-dated-row',
      },
      {
        id: 'timeline-open-source',
        title: 'Open the source record',
        guidance: 'The timeline is a route. The record is the source.',
        scenario: 'Open the pickup row and inspect the linked work.',
        actionId: 'open-source-record',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Safety',
    teaches: 'Backup, import, privacy disclaimer',
    requiredPractice: 'Find the settings disclaimer',
    sampleData: 'Practice with fake files only. Real workspace data stays out of the Lab.',
    steps: [
      {
        id: 'safety-open-settings',
        title: 'Open Settings',
        guidance: 'Safety work lives where the system explains itself.',
        scenario: 'Fake files only. No real permits, contracts, or private data.',
        actionId: 'open-settings',
      },
      {
        id: 'safety-find-backup',
        title: 'Find backup controls',
        guidance: 'Backup before risky work. Manual, visible, boring.',
        scenario: 'Export the practice shape before importing anything.',
        actionId: 'find-backup-controls',
      },
      {
        id: 'safety-read-local-note',
        title: 'Read the local data note',
        guidance: 'Know what is local before you trust it.',
        scenario: 'The Lab stays fake. The real workspace stays separate.',
        actionId: 'read-local-note',
      },
    ],
  },
  {
    id: 'iphone',
    title: 'iPhone',
    teaches: 'PWA habits',
    requiredPractice: 'Practice the mobile navigation pattern',
    sampleData: 'Move through the same fake GTA setup from a small screen.',
    steps: [
      {
        id: 'iphone-open-nav',
        title: 'Open mobile nav',
        guidance: 'Small screens need fewer choices at once.',
        scenario: 'Move through the fake GTA setup from the bottom rail.',
        actionId: 'open-mobile-nav',
      },
      {
        id: 'iphone-switch-screens',
        title: 'Switch screens',
        guidance: 'Use the short labels. Today, Lab, Build.',
        scenario: 'Check the same fake work without losing the thread.',
        actionId: 'switch-mobile-screens',
      },
      {
        id: 'iphone-return-lab',
        title: 'Return to Lab',
        guidance: 'Return here when the practice step is done.',
        scenario: 'The small-screen habit is the point.',
        actionId: 'return-lab-mobile',
      },
    ],
  },
]

export function startSundeskLabModule(
  educationState: SundeskEducationState,
  moduleId: string,
  now = new Date().toISOString(),
): SundeskEducationState {
  const existingProgress = educationState.lab.modules[moduleId]
  const module = sundeskLabModules.find((item) => item.id === moduleId)
  const firstStepId = module?.steps[0]?.id || `${moduleId}-start`
  const nextProgress: SundeskEducationProgress = {
    status: existingProgress?.status === 'completed' ? 'completed' : 'inProgress',
    currentStepId: existingProgress?.currentStepId || (existingProgress?.status === 'completed' ? null : firstStepId),
    completedStepIds: existingProgress?.completedStepIds ? [...existingProgress.completedStepIds] : [],
    completedActionIds: existingProgress?.completedActionIds ? [...existingProgress.completedActionIds] : [],
    startedAt: existingProgress?.startedAt || now,
    completedAt: existingProgress?.completedAt || null,
    lastSeenAt: now,
  }

  return {
    ...educationState,
    lab: {
      ...educationState.lab,
      activeModuleId: moduleId,
      modules: {
        ...educationState.lab.modules,
        [moduleId]: nextProgress,
      },
    },
  }
}

export function getSundeskLabCurrentStep(
  modules: SundeskLabModule[],
  moduleId: string,
  progress?: SundeskEducationProgress,
): SundeskLabModuleStep | null {
  const module = modules.find((item) => item.id === moduleId)

  if (!module) {
    return null
  }

  return module.steps.find((step) => step.id === progress?.currentStepId) || module.steps[0] || null
}

export function completeSundeskLabModuleStep(
  educationState: SundeskEducationState,
  modules: SundeskLabModule[],
  moduleId: string,
  now = new Date().toISOString(),
): SundeskEducationState {
  const module = modules.find((item) => item.id === moduleId)

  if (!module) {
    return educationState
  }

  const progress = educationState.lab.modules[moduleId] ||
    startSundeskLabModule(educationState, moduleId, now).lab.modules[moduleId]
  const currentStep = getSundeskLabCurrentStep(modules, moduleId, progress)

  if (!currentStep) {
    return educationState
  }

  const currentStepIndex = module.steps.findIndex((step) => step.id === currentStep.id)
  const nextStep = module.steps[currentStepIndex + 1]
  const completedStepIds = progress.completedStepIds.includes(currentStep.id)
    ? [...progress.completedStepIds]
    : [...progress.completedStepIds, currentStep.id]
  const completedActionIds = progress.completedActionIds.includes(currentStep.actionId)
    ? [...progress.completedActionIds]
    : [...progress.completedActionIds, currentStep.actionId]
  const nextProgress: SundeskEducationProgress = {
    ...progress,
    status: nextStep ? 'inProgress' : 'completed',
    currentStepId: nextStep?.id || null,
    completedStepIds,
    completedActionIds,
    completedAt: nextStep ? null : now,
    lastSeenAt: now,
  }

  return {
    ...educationState,
    lab: {
      ...educationState.lab,
      activeModuleId: moduleId,
      modules: {
        ...educationState.lab.modules,
        [moduleId]: nextProgress,
      },
    },
  }
}

export function resetSundeskLabModuleProgress(
  educationState: SundeskEducationState,
  moduleId: string,
): SundeskEducationState {
  const remainingModules = { ...educationState.lab.modules }

  delete remainingModules[moduleId]

  return {
    ...educationState,
    lab: {
      ...educationState.lab,
      activeModuleId: educationState.lab.activeModuleId === moduleId ? null : educationState.lab.activeModuleId,
      modules: remainingModules,
    },
  }
}

export function resetSundeskLabProgress(
  educationState: SundeskEducationState,
  now = new Date().toISOString(),
): SundeskEducationState {
  return {
    ...educationState,
    lab: {
      activeModuleId: null,
      sampleWorkspaceVersion: 1,
      sampleWorkspaceResetAt: now,
      modules: {},
    },
  }
}
