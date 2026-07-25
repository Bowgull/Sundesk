import type { SundeskEducationProgress, SundeskEducationState, SundeskLabRecord } from './educationState'

export type SundeskLabSurface =
  | 'start'
  | 'build'
  | 'fields'
  | 'tags'
  | 'links'
  | 'communities'
  | 'today'
  | 'meetings'
  | 'timeline'
  | 'data'

export type SundeskLabModule = {
  id: string
  title: string
  teaches: string
  requiredPractice: string
  sampleData: string
  steps: SundeskLabModuleStep[]
  deckSlide: number
  sourceTruth: string
  scenarioBrief: string
  taskInstruction: string
  expectedReceipt: string
  surface: SundeskLabSurface
}

export type SundeskLabModuleStep = {
  id: string
  title: string
  guidance: string
  scenario: string
  actionId: string
  sourceTruth: string
  expectedReceipt: string
}

type LessonSeed = Omit<SundeskLabModule, 'deckSlide' | 'sourceTruth'>

const lessons: LessonSeed[] = [
  {
    id: 'start',
    title: 'Start with the map',
    teaches: 'Source material, command center, practice boundary',
    requiredPractice: 'Open the map and name what belongs in each surface',
    sampleData: 'GTA event notes, permit risk memo, vendor COI chase, site map cleanup, sponsor deck, and weekly readiness meeting.',
    scenarioBrief: 'GTA event planning starts with scattered fake source material. The Lab turns it into one visible operating map.',
    taskInstruction: 'Read the source list, open the command map, and confirm the practice boundary before editing records.',
    expectedReceipt: 'Source material mapped. Practice records only. Real workspace untouched.',
    surface: 'start',
    steps: [
      {
        id: 'start-open-map',
        title: 'Open the command map',
        guidance: 'Read the fake source list and open the map.',
        scenario: 'GTA source material needs one place to land.',
        actionId: 'open-command-map',
        sourceTruth: 'Start. Map source material before editing records.',
        expectedReceipt: 'Command map opened.',
      },
      {
        id: 'start-confirm-boundary',
        title: 'Confirm the boundary',
        guidance: 'Confirm that this Lab uses fake practice records only.',
        scenario: 'Lindsay needs a safe place to learn without touching real work.',
        actionId: 'confirm-practice-boundary',
        sourceTruth: 'Start. Fake records only.',
        expectedReceipt: 'Practice boundary confirmed.',
      },
    ],
  },
  {
    id: 'build-grid',
    title: 'Build the first grid',
    teaches: 'Paste-first Build, inline edits, added rows',
    requiredPractice: 'Paste rows, edit one cell, and add one missing row',
    sampleData: 'Permit risk, vendor COI replies, site map cleanup, sponsor deck, volunteer roster, and weather comms rows.',
    scenarioBrief: 'GTA planning begins as a pasted grid. Sundesk should keep the spreadsheet move, then show what changed.',
    taskInstruction: 'Paste the starter rows, edit one status, and add the missing weather comms row.',
    expectedReceipt: 'Starter grid exists with one edited status and one added row.',
    surface: 'build',
    steps: [
      {
        id: 'build-grid-paste-rows',
        title: 'Paste starter rows',
        guidance: 'Paste the fake GTA event rows into the Lab grid.',
        scenario: 'The first move is paste. No import wizard.',
        actionId: 'paste-lab-rows',
        sourceTruth: 'Build. Paste first.',
        expectedReceipt: 'Starter rows pasted.',
      },
      {
        id: 'build-grid-edit-row',
        title: 'Edit one cell',
        guidance: 'Mark the permit row as blocked.',
        scenario: 'Rows should look saved after editing.',
        actionId: 'edit-permit-status',
        sourceTruth: 'Build. Edit inline.',
        expectedReceipt: 'Permit status changed.',
      },
      {
        id: 'build-grid-add-row',
        title: 'Add the missing row',
        guidance: 'Add weather comms as a new row.',
        scenario: 'A late source note needs a visible row.',
        actionId: 'add-weather-row',
        sourceTruth: 'Build. Add row stays visible.',
        expectedReceipt: 'Weather comms row added.',
      },
    ],
  },
  {
    id: 'fields',
    title: 'Give columns behaviour',
    teaches: 'Field type, helper suggestion, typed values',
    requiredPractice: 'Convert one plain column into a typed field',
    sampleData: 'Status, owner, due date, tags, and connected place columns.',
    scenarioBrief: 'GTA event rows need fields that behave like records, not loose text.',
    taskInstruction: 'Open the field helper and convert the due column into a date field.',
    expectedReceipt: 'Due column behaves like a date field. Other fields stay optional.',
    surface: 'fields',
    steps: [
      {
        id: 'fields-open-helper',
        title: 'Open the helper',
        guidance: 'Read the helper suggestion on the due column.',
        scenario: 'Helpers appear after there is context.',
        actionId: 'open-field-helper',
        sourceTruth: 'Fields. Helpers after context.',
        expectedReceipt: 'Date helper read.',
      },
      {
        id: 'fields-set-date',
        title: 'Set the date field',
        guidance: 'Convert Due into a date field.',
        scenario: 'Date pressure should be computable.',
        actionId: 'set-due-date-field',
        sourceTruth: 'Fields. Choose type.',
        expectedReceipt: 'Due field typed as date.',
      },
    ],
  },
  {
    id: 'tags',
    title: 'Make tags route work',
    teaches: 'Tags as grouping, surfacing, routing, and blocker markers',
    requiredPractice: 'Tag one row and filter the Lab by that tag',
    sampleData: 'Permit risk, COI, site map, sponsor, meeting prep, waiting, and weather tags.',
    scenarioBrief: 'GTA event planning uses tags to surface real work without hand sorting.',
    taskInstruction: 'Add the Permit risk tag to a row, then filter the Lab by that tag.',
    expectedReceipt: 'Permit risk route visible.',
    surface: 'tags',
    steps: [
      {
        id: 'tags-tag-risk-row',
        title: 'Tag the risk row',
        guidance: 'Add Permit risk to the permit memo.',
        scenario: 'The tag should change where the row appears.',
        actionId: 'tag-risk-row',
        sourceTruth: 'Tags. Mark blockers.',
        expectedReceipt: 'Permit risk tag applied.',
      },
      {
        id: 'tags-filter-risk-tag',
        title: 'Open the route',
        guidance: 'Filter by Permit risk and read the routed result.',
        scenario: 'Tags are signals. They should route work.',
        actionId: 'filter-risk-tag',
        sourceTruth: 'Tags. Group, surface, route.',
        expectedReceipt: 'Permit risk route visible.',
      },
    ],
  },
  {
    id: 'links',
    title: 'Link rows to places',
    teaches: 'Linked records, communities, backlinks',
    requiredPractice: 'Connect a work row to a place and read the backlink',
    sampleData: 'Kensington Market, Danforth Night Market, Scarborough Pop-Up, Liberty Village, and connected work rows.',
    scenarioBrief: 'GTA event planning needs place records to show their work without retyping facts.',
    taskInstruction: 'Link the permit memo to Kensington Market, then read the place backlink.',
    expectedReceipt: 'Permit row linked to Kensington Market. Backlink visible.',
    surface: 'links',
    steps: [
      {
        id: 'links-connect-place',
        title: 'Choose the place',
        guidance: 'Connect the permit memo to Kensington Market.',
        scenario: 'One fact should not be retyped.',
        actionId: 'link-permit-to-dock',
        sourceTruth: 'Links. Choose community.',
        expectedReceipt: 'Permit memo linked.',
      },
      {
        id: 'links-read-backlink',
        title: 'Read the backlink',
        guidance: 'Open the place read and confirm the permit row appears.',
        scenario: 'Backlinks prove the connection.',
        actionId: 'read-dock-backlink',
        sourceTruth: 'Links. Backlink appears.',
        expectedReceipt: 'Backlink visible.',
      },
    ],
  },
  {
    id: 'communities',
    title: 'Read place readiness',
    teaches: 'Community command center, local state, linked work',
    requiredPractice: 'Open one place and explain what is ready, waiting, and blocked',
    sampleData: 'Kensington Market, Danforth Night Market, Scarborough Pop-Up, Liberty Village, Parkdale vendor lane.',
    scenarioBrief: 'GTA event planning treats each place as a command-center record.',
    taskInstruction: 'Open Kensington Market and read its linked work.',
    expectedReceipt: 'Kensington Market shows blocked, waiting, and next work.',
    surface: 'communities',
    steps: [
      {
        id: 'communities-open-place',
        title: 'Open Kensington Market',
        guidance: 'Open the place with the highest risk.',
        scenario: 'The place record should explain local state.',
        actionId: 'open-island-dock',
        sourceTruth: 'Communities. Open one.',
        expectedReceipt: 'Kensington Market opened.',
      },
      {
        id: 'communities-read-state',
        title: 'Read the state',
        guidance: 'Confirm the blocker, waiting item, and next move.',
        scenario: 'A command center answers what matters now.',
        actionId: 'read-place-state',
        sourceTruth: 'Communities. Read local state.',
        expectedReceipt: 'Place state read.',
      },
    ],
  },
  {
    id: 'today-waiting',
    title: 'Separate now from waiting',
    teaches: 'Today lanes, waiting receipts, slip risk',
    requiredPractice: 'Move one item into Today and write one chase receipt',
    sampleData: 'Vendor COI replies waiting, permit follow-up now, weather comms next.',
    scenarioBrief: 'GTA event planning needs Today to show what can slip before the schedule lies.',
    taskInstruction: 'Route the permit follow-up into Now and write the waiting receipt for vendor COIs.',
    expectedReceipt: 'Now, Waiting, and Next are separated with a chase reason.',
    surface: 'today',
    steps: [
      {
        id: 'today-waiting-route-now',
        title: 'Route the now item',
        guidance: 'Move the permit follow-up into Now.',
        scenario: 'Due work should surface first.',
        actionId: 'route-water-now',
        sourceTruth: 'Today. Now, Waiting, Next.',
        expectedReceipt: 'Permit follow-up routed to Now.',
      },
      {
        id: 'today-waiting-chase-receipt',
        title: 'Write the chase receipt',
        guidance: 'Write who owes vendor COIs, age, and consequence.',
        scenario: 'Waiting needs a reason, not a vague status.',
        actionId: 'write-catering-chase',
        sourceTruth: 'Waiting On. Who owes it.',
        expectedReceipt: 'Vendor COI chase receipt written.',
      },
    ],
  },
  {
    id: 'meetings',
    title: 'Generate the weekly note',
    teaches: 'Meeting templates, generated notes, editable receipts',
    requiredPractice: 'Generate and edit the weekly readiness note',
    sampleData: 'Blocked permits, waiting COIs, site map cleanup, sponsor deck, and weather comms.',
    scenarioBrief: 'GTA event meetings should pull linked work into one note instead of asking someone to remember the plan.',
    taskInstruction: 'Generate the weekly note, then edit it into a planning receipt.',
    expectedReceipt: 'Weekly note generated and edited.',
    surface: 'meetings',
    steps: [
      {
        id: 'meetings-generate-note',
        title: 'Generate the note',
        guidance: 'Build the weekly note from connected fake rows.',
        scenario: 'Meetings should pull from work already in the system.',
        actionId: 'generate-weekly-note',
        sourceTruth: 'Meetings. Generated recap.',
        expectedReceipt: 'Weekly note generated.',
      },
      {
        id: 'meetings-edit-note',
        title: 'Edit the receipt',
        guidance: 'Add the next move to the generated note.',
        scenario: 'Generated notes stay editable.',
        actionId: 'edit-weekly-note',
        sourceTruth: 'Meetings. Edit notes.',
        expectedReceipt: 'Weekly note edited.',
      },
    ],
  },
  {
    id: 'timeline',
    title: 'Switch timeline views',
    teaches: 'Grid, kanban, calendar, readiness, graph',
    requiredPractice: 'Switch view modes and read the same work differently',
    sampleData: 'Permit deadline, COI chase, site map cleanup, sponsor review, weather comms.',
    scenarioBrief: 'GTA event planning needs different reads for the same event pressure.',
    taskInstruction: 'Open kanban, calendar, and graph views for the fake plan.',
    expectedReceipt: 'Same work read as movement, date pressure, and risk.',
    surface: 'timeline',
    steps: [
      {
        id: 'timeline-open-kanban',
        title: 'Open kanban',
        guidance: 'Switch to kanban to read movement.',
        scenario: 'Status needs movement.',
        actionId: 'view-kanban',
        sourceTruth: 'Timeline. Kanban is movement.',
        expectedReceipt: 'Kanban view opened.',
      },
      {
        id: 'timeline-open-calendar',
        title: 'Open calendar',
        guidance: 'Switch to calendar to read date pressure.',
        scenario: 'Dates need a calendar read.',
        actionId: 'view-calendar',
        sourceTruth: 'Timeline. Calendar is date pressure.',
        expectedReceipt: 'Calendar view opened.',
      },
      {
        id: 'timeline-open-graph',
        title: 'Open graph',
        guidance: 'Switch to graph to read linked risk.',
        scenario: 'Risk needs visible connections.',
        actionId: 'view-graph',
        sourceTruth: 'Timeline. Graph explains risk.',
        expectedReceipt: 'Graph view opened.',
      },
    ],
  },
  {
    id: 'data-routine',
    title: 'Run the routine',
    teaches: 'Data boundary, morning read, meeting prep, end-of-day receipt',
    requiredPractice: 'Confirm the fake-data boundary and write the end-of-day receipt',
    sampleData: 'Morning slip read, weekly meeting prep, and end-of-day updates for COIs, permits, site maps, sponsor review, and weather.',
    scenarioBrief: 'GTA event planning becomes useful only if the routine repeats.',
    taskInstruction: 'Confirm the data boundary, then write the end-of-day receipt.',
    expectedReceipt: 'Practice boundary confirmed. End-of-day receipt written.',
    surface: 'data',
    steps: [
      {
        id: 'data-routine-boundary',
        title: 'Confirm data boundary',
        guidance: 'Confirm fake records only.',
        scenario: 'Practice data must never be confused with Lindsay data.',
        actionId: 'confirm-data-boundary',
        sourceTruth: 'Data. Records only.',
        expectedReceipt: 'Data boundary confirmed.',
      },
      {
        id: 'data-routine-receipt',
        title: 'Write end-of-day receipt',
        guidance: 'Write what changed, what waits, and what opens tomorrow.',
        scenario: 'The routine closes with a receipt.',
        actionId: 'write-end-day-receipt',
        sourceTruth: 'Routine. End of day.',
        expectedReceipt: 'End-of-day receipt written.',
      },
    ],
  },
]

export const sundeskLabModules: SundeskLabModule[] = lessons.map((lesson, index) => ({
  ...lesson,
  deckSlide: index + 1,
  sourceTruth: `${String(index + 1).padStart(2, '0')} ${lesson.title}. ${lesson.teaches}.`,
  steps: lesson.steps.map((step) => ({
    ...step,
    sourceTruth: step.sourceTruth || `${String(index + 1).padStart(2, '0')} ${lesson.title}.`,
    scenario: step.scenario || lesson.scenarioBrief,
  })),
}))

const legacyLessonAliases: Record<string, string> = {
  'slide-01-start-here': 'start',
  'slide-02-product-map': 'start',
  'slide-03-blank-grid': 'build-grid',
  'slide-04-after-paste': 'build-grid',
  'slide-05-fields': 'fields',
  'slide-06-tags': 'tags',
  'slide-07-links': 'links',
  'slide-08-communities': 'communities',
  'slide-09-today': 'today-waiting',
  'slide-10-waiting-on': 'today-waiting',
  'slide-11-meetings': 'meetings',
  'slide-12-timeline-views': 'timeline',
  'slide-13-kanban': 'timeline',
  'slide-14-calendar': 'timeline',
  'slide-15-readiness-timeline': 'timeline',
  'slide-16-risk-graph': 'timeline',
  'slide-17-freeform-build': 'build-grid',
  'slide-18-context-helpers': 'fields',
  'slide-19-data-access': 'data-routine',
  'slide-20-routine': 'data-routine',
}

export function normalizeSundeskLabLessonId(moduleId: string | null | undefined) {
  if (!moduleId) {
    return null
  }

  return legacyLessonAliases[moduleId] || moduleId
}

function getLesson(moduleId: string | null | undefined) {
  const lessonId = normalizeSundeskLabLessonId(moduleId)

  return sundeskLabModules.find((module) => module.id === lessonId) || sundeskLabModules[0] || null
}

export function startSundeskLabModule(
  educationState: SundeskEducationState,
  moduleId: string,
  now = new Date().toISOString(),
): SundeskEducationState {
  const module = getLesson(moduleId)

  if (!module) {
    return educationState
  }

  const existingProgress = educationState.lab.modules[module.id]
  const firstStepId = module.steps[0]?.id || `${module.id}-start`
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
      activeModuleId: module.id,
      sampleWorkspaceVersion: 3,
      modules: {
        ...educationState.lab.modules,
        [module.id]: nextProgress,
      },
      sandbox: {
        ...educationState.lab.sandbox,
        version: 1,
        activeLessonId: module.id,
        activeSurface: module.surface,
        sampleWorkspaceVersion: 3,
        selectedView: module.surface === 'timeline' ? educationState.lab.sandbox.selectedView : 'grid',
        selectedFilterTag: module.surface === 'tags' ? educationState.lab.sandbox.selectedFilterTag : null,
        updatedAt: now,
      },
    },
  }
}

export function getSundeskLabCurrentStep(
  modules: SundeskLabModule[],
  moduleId: string,
  progress?: SundeskEducationProgress,
): SundeskLabModuleStep | null {
  const lessonId = normalizeSundeskLabLessonId(moduleId)
  const module = modules.find((item) => item.id === lessonId)

  if (!module) {
    return null
  }

  return module.steps.find((step) => step.id === progress?.currentStepId) || module.steps[0] || null
}

export function applySundeskLabAction(
  educationState: SundeskEducationState,
  modules: SundeskLabModule[],
  moduleId: string,
  actionId: string,
  now = new Date().toISOString(),
): SundeskEducationState {
  const module = modules.find((item) => item.id === normalizeSundeskLabLessonId(moduleId))

  if (!module || !module.steps.some((step) => step.actionId === actionId)) {
    return educationState
  }

  const started = startSundeskLabModule(educationState, module.id, now)
  const sandbox = started.lab.sandbox
  const completedTaskIds = sandbox.completedTaskIds.includes(actionId)
    ? [...sandbox.completedTaskIds]
    : [...sandbox.completedTaskIds, actionId]
  const records = applyRecordAction(sandbox.records, actionId)
  const generatedReceipts = {
    ...sandbox.generatedReceipts,
    [module.id]: getActionReceipt(module, actionId, completedTaskIds),
  }

  return {
    ...started,
    lab: {
      ...started.lab,
      sandbox: {
        ...sandbox,
        completedTaskIds,
        generatedReceipts,
        records,
        selectedFilterTag: actionId === 'filter-risk-tag' ? 'Permit risk' : sandbox.selectedFilterTag,
        selectedView: getSelectedViewForAction(actionId, sandbox.selectedView),
        updatedAt: now,
      },
    },
  }
}

export function canCompleteSundeskLabLesson(
  educationState: SundeskEducationState,
  modules: SundeskLabModule[],
  moduleId: string,
) {
  const module = modules.find((item) => item.id === normalizeSundeskLabLessonId(moduleId))

  if (!module) {
    return false
  }

  return module.steps.every((step) => educationState.lab.sandbox.completedTaskIds.includes(step.actionId))
}

export function completeSundeskLabModuleStep(
  educationState: SundeskEducationState,
  modules: SundeskLabModule[],
  moduleId: string,
  now = new Date().toISOString(),
): SundeskEducationState {
  const module = modules.find((item) => item.id === normalizeSundeskLabLessonId(moduleId))

  if (!module) {
    return educationState
  }

  const started = startSundeskLabModule(educationState, module.id, now)
  const progress = started.lab.modules[module.id]

  if (!canCompleteSundeskLabLesson(started, modules, module.id)) {
    return started
  }

  const completedActionIds = module.steps.map((step) => step.actionId)
  const completedStepIds = module.steps.map((step) => step.id)
  const nextProgress: SundeskEducationProgress = {
    ...progress,
    status: 'completed',
    currentStepId: null,
    completedStepIds,
    completedActionIds,
    completedAt: now,
    lastSeenAt: now,
  }

  return {
    ...started,
    lab: {
      ...started.lab,
      activeModuleId: module.id,
      modules: {
        ...started.lab.modules,
        [module.id]: nextProgress,
      },
      sandbox: {
        ...started.lab.sandbox,
        generatedReceipts: {
          ...started.lab.sandbox.generatedReceipts,
          [module.id]: module.expectedReceipt,
        },
        updatedAt: now,
      },
    },
  }
}

export function resetSundeskLabModuleProgress(
  educationState: SundeskEducationState,
  moduleId: string,
  now = new Date().toISOString(),
): SundeskEducationState {
  const normalizedModuleId = normalizeSundeskLabLessonId(moduleId)
  const remainingModules = { ...educationState.lab.modules }

  if (normalizedModuleId) {
    delete remainingModules[normalizedModuleId]
  }

  const activeModuleId = educationState.lab.activeModuleId === normalizedModuleId ? null : educationState.lab.activeModuleId

  return {
    ...educationState,
    lab: {
      ...educationState.lab,
      activeModuleId,
      modules: remainingModules,
      sandbox: {
        ...educationState.lab.sandbox,
        activeLessonId: activeModuleId || educationState.lab.sandbox.activeLessonId,
        completedTaskIds: educationState.lab.sandbox.completedTaskIds.filter((taskId) =>
          !sundeskLabModules.find((module) => module.id === normalizedModuleId)?.steps.some((step) => step.actionId === taskId),
        ),
        updatedAt: now,
      },
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
      sampleWorkspaceVersion: 3,
      sampleWorkspaceResetAt: now,
      modules: {},
      sandbox: {
        ...educationState.lab.sandbox,
        activeLessonId: null,
        activeSurface: 'start',
        selectedView: 'grid',
        selectedFilterTag: null,
        completedTaskIds: [],
        generatedReceipts: {},
        records: getResetLabRecords(),
        updatedAt: now,
      },
    },
  }
}

function applyRecordAction(records: SundeskLabRecord[], actionId: string): SundeskLabRecord[] {
  if (actionId === 'paste-lab-rows') {
    return records.map((record) => record.id === 'gta-permit-risk'
      ? { ...record, notes: replaceOrAppendLabNote(record.notes, 'Starter rows pasted into the Lab grid.') }
      : record)
  }

  if (actionId === 'tag-risk-row') {
    return records.map((record) => record.id === 'gta-permit-risk'
      ? { ...record, tags: Array.from(new Set([...record.tags, 'Permit risk'])) }
      : record)
  }

  if (actionId === 'edit-permit-status') {
    return records.map((record) => record.id === 'gta-permit-risk' ? { ...record, status: 'Blocked' } : record)
  }

  if (actionId === 'route-water-now') {
    return records.map((record) => record.id === 'gta-permit-risk'
      ? { ...record, status: 'Now', tags: Array.from(new Set([...record.tags, 'Now'])) }
      : record)
  }

  if (actionId === 'add-weather-row' && !records.some((record) => record.id === 'gta-weather-comms')) {
    return [
      ...records,
      {
        id: 'gta-weather-comms',
        table: 'work',
        title: 'Weather comms update',
        status: 'Open',
        owner: 'Comms lead',
        due: '2026-06-15',
        tags: ['Weather'],
        communityId: 'gta-kensington-market',
        notes: 'Late source note added from the Lab.',
        fake: true,
      },
    ]
  }

  if (actionId === 'link-permit-to-dock') {
    return records.map((record) => record.id === 'gta-permit-risk' ? { ...record, communityId: 'gta-kensington-market' } : record)
  }

  if (actionId === 'set-due-date-field') {
    return records.map((record) => record.id === 'gta-permit-risk'
      ? { ...record, notes: replaceOrAppendLabNote(record.notes, 'Due is typed as date.') }
      : record)
  }

  if (actionId === 'write-catering-chase') {
    return records.map((record) => record.id === 'gta-vendor-cois'
      ? {
          ...record,
          notes: 'Vendor lead owes 2 COIs. 3 days old. Missing certificates block vendor confirmation.',
        }
      : record)
  }

  if (actionId === 'generate-weekly-note') {
    return records.map((record) => record.id === 'gta-weekly-meeting'
      ? {
          ...record,
          notes: 'Generated: permit blocked, vendor COIs waiting, site map moving, sponsor deck open.',
        }
      : record)
  }

  if (actionId === 'edit-weekly-note') {
    return records.map((record) => record.id === 'gta-weekly-meeting'
      ? {
          ...record,
          status: 'Edited',
          notes: 'Edited receipt: assign permit owner, chase 2 vendor COIs, review site map before Friday.',
        }
      : record)
  }

  return records
}

function replaceOrAppendLabNote(notes: string, nextNote: string) {
  return notes.includes(nextNote) ? notes : `${notes} ${nextNote}`
}

function getSelectedViewForAction(actionId: string, currentView: string) {
  const viewByAction: Record<string, string> = {
    'view-kanban': 'kanban',
    'view-calendar': 'calendar',
    'view-graph': 'graph',
  }

  return viewByAction[actionId] || currentView
}

function getActionReceipt(module: SundeskLabModule, actionId: string, completedTaskIds: string[]) {
  if (module.id === 'tags' && completedTaskIds.includes('tag-risk-row') && completedTaskIds.includes('filter-risk-tag')) {
    return 'Permit risk route visible.'
  }

  const step = module.steps.find((item) => item.actionId === actionId)

  return step?.expectedReceipt || module.expectedReceipt
}

function getResetLabRecords(): SundeskLabRecord[] {
  return [
    {
      id: 'gta-permit-risk',
      table: 'work',
      title: 'Kensington permit follow-up',
      status: 'Blocked',
      owner: 'Operations',
      due: '2026-06-11',
      tags: ['Permit risk'],
      communityId: 'gta-kensington-market',
      notes: 'Permit status needs a visible owner before the weekly meeting.',
      fake: true,
    },
    {
      id: 'gta-vendor-cois',
      table: 'work',
      title: 'Vendor COI replies',
      status: 'Waiting',
      owner: 'Vendor lead',
      due: '2026-06-12',
      tags: ['COI', 'Waiting'],
      communityId: 'gta-danforth-night-market',
      notes: 'Two vendor certificates are still missing.',
      fake: true,
    },
    {
      id: 'gta-site-map',
      table: 'work',
      title: 'Site map cleanup',
      status: 'In progress',
      owner: 'Site lead',
      due: '2026-06-13',
      tags: ['Site map'],
      communityId: 'gta-scarborough-popup',
      notes: 'Vendor row spacing needs one final pass.',
      fake: true,
    },
    {
      id: 'gta-sponsor-deck',
      table: 'work',
      title: 'Sponsor deck review',
      status: 'Open',
      owner: 'Partnerships',
      due: '2026-06-14',
      tags: ['Sponsor'],
      communityId: 'gta-liberty-village',
      notes: 'Deck needs the latest booth package and logo row.',
      fake: true,
    },
    {
      id: 'gta-weekly-meeting',
      table: 'meetings',
      title: 'Weekly event readiness',
      status: 'Draft',
      owner: 'Lindsay',
      due: '2026-06-10',
      tags: ['Meeting prep'],
      communityId: 'gta-kensington-market',
      notes: 'Prep from blocked work, waiting work, and readiness notes.',
      fake: true,
    },
  ]
}
