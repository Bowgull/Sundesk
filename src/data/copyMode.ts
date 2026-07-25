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
  | 'button.close'
  | 'button.cancel'
  | 'button.saveTable'
  | 'button.deleteTable'
  | 'button.resetLocalData'
  | 'button.deleteField'
  | 'button.done'
  | 'button.continueGoogle'
  | 'button.useAnotherAccount'
  | 'button.openSundesk'
  | 'button.signOut'
  | 'button.checkingAccess'
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
    rupaul: 'Today. Main stage for the mess',
    scope: 'navigation',
    revealPlain: true,
  },
  {
    id: 'nav.build',
    plain: 'Build',
    rupaul: 'Build. Werkroom for the messy work era',
    scope: 'navigation',
    revealPlain: true,
  },
  {
    id: 'nav.meetings',
    plain: 'Meetings',
    rupaul: 'Meetings. Bring receipts and posture',
    scope: 'navigation',
    revealPlain: true,
  },
  {
    id: 'nav.settings',
    plain: 'Settings',
    rupaul: 'Settings. Adjust the lighting',
    scope: 'navigation',
    revealPlain: true,
  },
  {
    id: 'nav.lab',
    plain: 'Sundesk Lab',
    rupaul: 'Sundesk Lab. Rehearse the chaos',
    scope: 'navigation',
    revealPlain: true,
  },
  {
    id: 'button.copyNote',
    plain: 'Copy note',
    rupaul: 'Copy note. Receipts in heels',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.exportPdf',
    plain: 'Export PDF',
    rupaul: 'Export PDF. Make it runway-ready',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.copyAgenda',
    plain: 'Copy agenda',
    rupaul: 'Copy agenda. No improv in the werkroom',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.exportAgendaPdf',
    plain: 'Export agenda PDF',
    rupaul: 'Export agenda PDF. Receipts for the judging panel',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.previewSummary',
    plain: 'Preview summary',
    rupaul: 'Preview summary. Read the room first',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.addTable',
    plain: 'Add table',
    rupaul: 'Add table. New category',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.addField',
    plain: 'Add column',
    rupaul: 'Add column. Give it a talent',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.saveView',
    plain: 'Save view',
    rupaul: 'Save view. Lock the camera angle',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.addRecord',
    plain: 'Add row',
    rupaul: 'Add row. Another queen enters',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.resetLab',
    plain: 'Reset sample data',
    rupaul: 'Reset sample data. Untuck the fake mess',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.restartOnboarding',
    plain: 'Restart onboarding',
    rupaul: 'Restart onboarding. Back to the entrance look',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.close',
    plain: 'Close',
    rupaul: 'Close. Curtain down',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.cancel',
    plain: 'Cancel',
    rupaul: 'Cancel. Sashay away from this edit',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.saveTable',
    plain: 'Save table',
    rupaul: 'Save table. Category confirmed',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.deleteTable',
    plain: 'Delete table',
    rupaul: 'Delete table. No local undo',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.resetLocalData',
    plain: 'Reset local data',
    rupaul: 'Reset local data. Werkroom back to day one',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.deleteField',
    plain: 'Delete column',
    rupaul: 'Delete column. Cut the shaky runway',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.done',
    plain: 'Done',
    rupaul: 'Done. She is pinned',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.continueGoogle',
    plain: 'Continue with Google',
    rupaul: 'Continue with Google. Check the guest list',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.useAnotherAccount',
    plain: 'Use another account',
    rupaul: 'Use another account. Different entrance package',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.openSundesk',
    plain: 'Open Sundesk',
    rupaul: 'Open Sundesk. Lights up',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.signOut',
    plain: 'Sign out',
    rupaul: 'Sign out. Exit the main stage',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'button.checkingAccess',
    plain: 'Checking access',
    rupaul: 'Checking access. Reading the door list',
    scope: 'button',
    revealPlain: true,
  },
  {
    id: 'settings.disclaimer',
    plain: 'Use Sundesk for sensitive information at your own risk. Josh can help tune the setup, but you still choose what belongs in the app',
    rupaul: 'Sensitive data enters at your own risk. The wig is tall. The secret is still a secret',
    scope: 'settings',
  },
  {
    id: 'help.noResults',
    plain: 'No help results found.',
    rupaul: 'No help result found. The judges need a better keyword',
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
