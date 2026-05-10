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
  })
})
