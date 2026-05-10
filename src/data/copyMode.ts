export type CopyEntryId =
  | 'nav.today'
  | 'nav.build'
  | 'nav.meetings'
  | 'nav.settings'
  | 'nav.lab'
  | 'button.copyNote'
  | 'button.exportPdf'
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
