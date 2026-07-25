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
    expect(getCopyModeText('settings.disclaimer', true)).toBe('Sensitive data enters at your own risk. The wig is tall. The secret is still a secret')
    expect(getCopyModeText('help.noResults', true)).toBe('No help result found. The judges need a better keyword')
    expect(getCopyModeText('nav.lab', false)).toBe('Sundesk Lab')
    expect(getCopyModeText('nav.lab', true)).toBe('Sundesk Lab. Rehearse the chaos')
    expect(getCopyModeText('nav.build', true)).toBe('Build. Werkroom for the messy work era')
    expect(getCopyModeText('button.exportPdf', true)).toBe('Export PDF. Make it runway-ready')
    expect(getCopyModeText('button.copyNote', false)).toBe('Copy note')
    expect(getCopyModeText('button.copyNote', true)).toBe('Copy note. Receipts in heels')
    expect(getCopyModeText('button.copyAgenda', true)).toBe('Copy agenda. No improv in the werkroom')
    expect(getCopyModeText('button.exportAgendaPdf', true)).toBe('Export agenda PDF. Receipts for the judging panel')
    expect(getCopyModeText('button.previewSummary', true)).toBe('Preview summary. Read the room first')
    expect(getCopyModeText('button.addTable', true)).toBe('Add table. New category')
    expect(getCopyModeText('button.addField', true)).toBe('Add column. Give it a talent')
    expect(getCopyModeText('button.saveView', true)).toBe('Save view. Lock the camera angle')
    expect(getCopyModeText('button.addRecord', true)).toBe('Add row. Another queen enters')
    expect(getCopyModeText('button.resetLab', true)).toBe('Reset sample data. Untuck the fake mess')
    expect(getCopyModeText('button.restartOnboarding', true)).toBe('Restart onboarding. Back to the entrance look')
    expect(getCopyModeText('button.close', true)).toBe('Close. Curtain down')
    expect(getCopyModeText('button.cancel', true)).toBe('Cancel. Sashay away from this edit')
    expect(getCopyModeText('button.saveTable', true)).toBe('Save table. Category confirmed')
    expect(getCopyModeText('button.deleteTable', true)).toBe('Delete table. No local undo')
    expect(getCopyModeText('button.resetLocalData', true)).toBe('Reset local data. Werkroom back to day one')
    expect(getCopyModeText('button.deleteField', true)).toBe('Delete column. Cut the shaky runway')
    expect(getCopyModeText('button.done', true)).toBe('Done. She is pinned')
    expect(getCopyModeText('button.continueGoogle', true)).toBe('Continue with Google. Check the guest list')
    expect(getCopyModeText('button.useAnotherAccount', true)).toBe('Use another account. Different entrance package')
    expect(getCopyModeText('button.openSundesk', true)).toBe('Open Sundesk. Lights up')
    expect(getCopyModeText('button.signOut', true)).toBe('Sign out. Exit the main stage')
    expect(getCopyModeText('button.checkingAccess', true)).toBe('Checking access. Reading the door list')
  })

  it('keeps camp copy short and plain-copy revealable', () => {
    copyEntries.forEach((entry) => {
      expect(entry.rupaul).not.toMatch(/[—–!]/)
      expect(entry.rupaul.length).toBeLessThanOrEqual(88)
    })

    expect(copyEntries.filter((entry) => entry.revealPlain).length).toBeGreaterThan(0)
    expect(copyEntries.find((entry) => entry.id === 'button.copyNote')?.revealPlain).toBe(true)
  })
})
