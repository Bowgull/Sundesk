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
  })
})
