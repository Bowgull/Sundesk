export type CopyEntryId =
  | 'nav.today'
  | 'nav.build'
  | 'nav.meetings'
  | 'nav.settings'
  | 'nav.lab'
  | 'button.copyNote'
  | 'button.exportPdf'
  | 'button.copyAgenda'
  | 'button.exportAgendaPdf'
  | 'button.previewSummary'
  | 'button.addTable'
  | 'button.addField'
  | 'button.saveView'
  | 'button.addRecord'
  | 'button.resetLab'
  | 'button.restartOnboarding'
  | 'settings.disclaimer'
  | 'help.noResults'

type CopyEntry = {
  id: CopyEntryId
  plain: string
  rupaul: string
  scope: 'navigation' | 'button' | 'help' | 'settings'
  revealPlain?: boolean
}

export const copyEntries: readonly CopyEntry[] = [
  {
    id: 'nav.today',
    plain: 'Today',
    rupaul: 'Today. The mess has been called to the stage',
    scope: 'navigation',
    revealPlain: true,
  },
  {
    id: 'nav.build',
    plain: 'Build',
    rupaul: 'Build. Give the chaos a backbone',
    scope: 'navigation',
    revealPlain: true,
  },
  {
    id: 'nav.meetings',
    plain: 'Meetings',
    rupaul: 'Meetings. Bring receipts',
    scope: 'navigation',
    revealPlain: true,
  },
  {
    id: 'nav.settings',
    plain: 'Settings',
    rupaul: 'Settings. Touch things with intention',
    scope: 'navigation',
    revealPlain: true,
  },
  {
    id: 'nav.lab',
    plain: 'Sundesk Lab',
    rupaul: 'Sundesk Lab. Practice the drama safely',
    scope: 'navigation',
    revealPlain: true,
  },
  {
    id: 'button.copyNote',
    plain: 'Copy note',
    rupaul: 'Copy the receipts',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.exportPdf',
    plain: 'Export PDF',
    rupaul: 'Export the PDF, darling',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.copyAgenda',
    plain: 'Copy agenda',
    rupaul: 'Copy the agenda before somebody freestyles',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.exportAgendaPdf',
    plain: 'Export agenda PDF',
    rupaul: 'Export the agenda PDF. Receipts for the room',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.previewSummary',
    plain: 'Preview summary',
    rupaul: 'Preview the morning read',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.addTable',
    plain: 'Add table',
    rupaul: 'Add another bucket',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.addField',
    plain: 'Add field',
    rupaul: 'Add a new little rule',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.saveView',
    plain: 'Save view',
    rupaul: 'Save this angle',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.addRecord',
    plain: 'Add record',
    rupaul: 'Add the next problem',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.resetLab',
    plain: 'Reset sample data',
    rupaul: 'Reset the fake chaos',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.restartOnboarding',
    plain: 'Restart onboarding',
    rupaul: 'Run the tour again',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'settings.disclaimer',
    plain: 'Use Sundesk for sensitive information at your own risk. Josh can help tune the setup, but you still choose what belongs in the app',
    rupaul: 'Put sensitive things in here at your own risk, my pookie. The system can organize the mess, but it cannot make a secret less secret',
    scope: 'settings',
  },
  {
    id: 'help.noResults',
    plain: 'No help results found.',
    rupaul: 'No help found for that. Try a messier word',
    scope: 'help',
  },
]

export function getCopyModeText(id: CopyEntryId, rupaulMode: boolean) {
  const entry = copyEntries.find((copyEntry) => copyEntry.id === id)

  if (!entry) {
    return ''
  }

  return rupaulMode ? entry.rupaul : entry.plain
}
