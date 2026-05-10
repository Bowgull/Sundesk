import { describe, expect, it } from 'vitest'
import { getCopyModeText } from './copyMode'

describe('copy mode text', () => {
  it('returns plain copy by default and RuPaul copy when requested', () => {
    expect(getCopyModeText('settings.disclaimer', false)).toBe('Use Sundesk for sensitive information at your own risk. Josh can help tune the setup, but you still choose what belongs in the app')
    expect(getCopyModeText('settings.disclaimer', true)).toBe('Put sensitive things in here at your own risk, my pookie. The system can organize the mess, but it cannot make a secret less secret')
    expect(getCopyModeText('help.noResults', true)).toBe('No help found for that. Try a messier word')
  })
})
