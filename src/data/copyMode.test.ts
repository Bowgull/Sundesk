import { describe, expect, it } from 'vitest'
import { copyEntries, getCopyModeText } from './copyMode'

describe('copy mode text', () => {
  it('includes the first wired copy map entries from the build-ready spec', () => {
    expect(copyEntries.map((entry) => entry.id)).toEqual(expect.arrayContaining([
      'nav.today',
      'nav.build',
      'nav.meetings',
      'nav.settings',
      'nav.lab',
      'button.exportPdf',
      'button.copyNote',
      'button.copyAgenda',
      'button.exportAgendaPdf',
      'button.previewSummary',
      'button.addTable',
      'button.addField',
      'button.saveView',
      'button.addRecord',
      'button.resetLab',
      'button.restartOnboarding',
      'button.close',
      'button.cancel',
      'button.saveTable',
      'button.deleteTable',
      'button.resetLocalData',
      'button.deleteField',
      'button.done',
      'button.continueGoogle',
      'button.useAnotherAccount',
      'button.openSundesk',
      'button.signOut',
      'button.checkingAccess',
      'help.noResults',
      'settings.disclaimer',
    ]))
  })

  it('returns plain copy by default and RuPaul copy when requested', () => {
    expect(getCopyModeText('settings.disclaimer', false)).toBe('Use Sundesk for sensitive information at your own risk. Josh can help tune the setup, but you still choose what belongs in the app')
    expect(getCopyModeText('settings.disclaimer', true)).toBe('Put sensitive things in here at your own risk, my pookie. The system can organize the mess, but it cannot make a secret less secret')
    expect(getCopyModeText('help.noResults', true)).toBe('No help found for that. Try a messier word')
    expect(getCopyModeText('nav.build', true)).toBe('Build. Give the chaos a backbone')
    expect(getCopyModeText('button.exportPdf', true)).toBe('Export the PDF, darling')
    expect(getCopyModeText('button.copyNote', false)).toBe('Copy note')
    expect(getCopyModeText('button.copyAgenda', true)).toBe('Copy the agenda before somebody freestyles')
    expect(getCopyModeText('button.exportAgendaPdf', true)).toBe('Export the agenda PDF. Receipts for the room')
    expect(getCopyModeText('button.previewSummary', true)).toBe('Preview the morning read')
    expect(getCopyModeText('button.addTable', true)).toBe('Add another bucket')
    expect(getCopyModeText('button.addField', true)).toBe('Add a new little rule')
    expect(getCopyModeText('button.saveView', true)).toBe('Save this angle')
    expect(getCopyModeText('button.addRecord', true)).toBe('Add the next problem')
    expect(getCopyModeText('button.resetLab', true)).toBe('Reset the fake chaos')
    expect(getCopyModeText('button.restartOnboarding', true)).toBe('Run the tour again')
    expect(getCopyModeText('button.close', true)).toBe('Close the curtain')
    expect(getCopyModeText('button.cancel', true)).toBe('Cancel. Leave it alone')
    expect(getCopyModeText('button.saveTable', true)).toBe('Save table. The bucket has a name')
    expect(getCopyModeText('button.deleteTable', true)).toBe('Delete table. No local undo')
    expect(getCopyModeText('button.resetLocalData', true)).toBe('Reset local data. Back to starter chaos')
    expect(getCopyModeText('button.deleteField', true)).toBe('Delete field. Cut the column')
    expect(getCopyModeText('button.done', true)).toBe('Done. Park it')
    expect(getCopyModeText('button.continueGoogle', true)).toBe('Continue with Google. Check the list')
    expect(getCopyModeText('button.useAnotherAccount', true)).toBe('Use another account. This one is not on the list')
    expect(getCopyModeText('button.openSundesk', true)).toBe('Open Sundesk. The door is clear')
    expect(getCopyModeText('button.signOut', true)).toBe('Sign out. Swap the account')
    expect(getCopyModeText('button.checkingAccess', true)).toBe('Checking access. Reading the room')
  })
})
