export type CopyEntryId =
  | 'settings.disclaimer'
  | 'help.noResults'

type CopyEntry = {
  id: CopyEntryId
  plain: string
  rupaul: string
}

export const copyEntries: readonly CopyEntry[] = [
  {
    id: 'settings.disclaimer',
    plain: 'Use Sundesk for sensitive information at your own risk. Josh can help tune the setup, but you still choose what belongs in the app',
    rupaul: 'Put sensitive things in here at your own risk, my pookie. The system can organize the mess, but it cannot make a secret less secret',
  },
  {
    id: 'help.noResults',
    plain: 'No help results found.',
    rupaul: 'No help found for that. Try a messier word',
  },
]

export function getCopyModeText(id: CopyEntryId, rupaulMode: boolean) {
  const entry = copyEntries.find((copyEntry) => copyEntry.id === id)

  if (!entry) {
    return ''
  }

  return rupaulMode ? entry.rupaul : entry.plain
}
