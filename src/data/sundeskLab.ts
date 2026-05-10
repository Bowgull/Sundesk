import type { SundeskEducationProgress, SundeskEducationState } from './educationState'

export type SundeskLabModule = {
  id: string
  title: string
  teaches: string
  requiredPractice: string
  sampleData: string
  steps: string[]
}

export const sundeskLabModules: SundeskLabModule[] = [
  {
    id: 'first-look',
    title: 'First look',
    teaches: 'Today, Build, Meetings, Lab',
    requiredPractice: 'Navigate each surface',
    sampleData: 'Scarborough night-market prep, North York vendor calls, and one fake sponsor named Mina.',
    steps: ['Open Today', 'Open Build', 'Open Meetings', 'Return to Lab'],
  },
  {
    id: 'tables',
    title: 'Tables',
    teaches: 'What tables are',
    requiredPractice: 'Switch tables and open table menu',
    sampleData: 'Mississauga venues, Etobicoke vendors, and a table for fake approval lanes.',
    steps: ['Switch the sample table', 'Open table options', 'Read the table purpose'],
  },
  {
    id: 'records',
    title: 'Records',
    teaches: 'What records are',
    requiredPractice: 'Open, edit, and close one record',
    sampleData: 'One Brampton stage riser, one Toronto food truck, one very calm fake coordinator.',
    steps: ['Open a sample row', 'Change one field', 'Close the record'],
  },
  {
    id: 'fields',
    title: 'Fields',
    teaches: 'Field types',
    requiredPractice: 'Add one field in sample data',
    sampleData: 'Add a field for weather risk before the fake Lake Shore setup gets loud.',
    steps: ['Open field controls', 'Pick a field type', 'Add the field'],
  },
  {
    id: 'tags',
    title: 'Tags',
    teaches: 'Multi-label work',
    requiredPractice: 'Add several custom tags to one record',
    sampleData: 'Tag Steph, vendor, waiting, and needs-eyes on the fake Scarborough permit row.',
    steps: ['Open a tag cell', 'Add 2 tags', 'Filter by one tag'],
  },
  {
    id: 'links',
    title: 'Links',
    teaches: 'Relationships',
    requiredPractice: 'Link a task to a community',
    sampleData: 'Connect the fake Liberty Village AV task to the fake Liberty Village community.',
    steps: ['Open link control', 'Choose a community', 'Check the backlink'],
  },
  {
    id: 'views',
    title: 'Views',
    teaches: 'Filter, sort, group, colour, save',
    requiredPractice: 'Create or modify one sample view',
    sampleData: 'Build a view for West End work that is waiting, dated, or carrying heat.',
    steps: ['Filter sample rows', 'Group by status', 'Save the view'],
  },
  {
    id: 'today',
    title: 'Today',
    teaches: 'Surfacing work',
    requiredPractice: 'Route from Today into Build',
    sampleData: 'A fake Vaughan delivery issue bubbles up because the date is too close.',
    steps: ['Open Today', 'Read the reason', 'Route into Build'],
  },
  {
    id: 'meetings',
    title: 'Meetings',
    teaches: 'Meeting prep and PDF',
    requiredPractice: 'Build and export a sample meeting PDF',
    sampleData: 'Prep a fake Monday check-in for Oakville vendors and Toronto production.',
    steps: ['Open meeting prep', 'Read linked work', 'Export sample PDF'],
  },
  {
    id: 'timeline',
    title: 'Timeline',
    teaches: 'Time-based work',
    requiredPractice: 'Inspect a dated record route',
    sampleData: 'A dated Hamilton pickup has to land before the fake weekend setup.',
    steps: ['Open Timeline', 'Find a dated row', 'Open the source record'],
  },
  {
    id: 'safety',
    title: 'Safety',
    teaches: 'Backup, import, privacy disclaimer',
    requiredPractice: 'Find the settings disclaimer',
    sampleData: 'Practice with fake files only. Real workspace data stays out of the Lab.',
    steps: ['Open Settings', 'Find backup controls', 'Read the local data note'],
  },
  {
    id: 'iphone',
    title: 'iPhone',
    teaches: 'PWA habits',
    requiredPractice: 'Practice the mobile navigation pattern',
    sampleData: 'Move through the same fake GTA setup from a small screen.',
    steps: ['Open mobile nav', 'Switch screens', 'Return to Lab'],
  },
]

export function startSundeskLabModule(
  educationState: SundeskEducationState,
  moduleId: string,
  now = new Date().toISOString(),
): SundeskEducationState {
  const existingProgress = educationState.lab.modules[moduleId]
  const nextProgress: SundeskEducationProgress = {
    status: 'inProgress',
    currentStepId: existingProgress?.currentStepId || `${moduleId}-start`,
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

export function resetSundeskLabModuleProgress(
  educationState: SundeskEducationState,
  moduleId: string,
): SundeskEducationState {
  const { [moduleId]: _removedModule, ...remainingModules } = educationState.lab.modules

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
