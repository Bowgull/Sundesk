import { describe, expect, it } from 'vitest'
import { mainScreens } from './appConfig'

describe('app screen configuration', () => {
  it('keeps the Lab route id while showing Sundesk Lab in navigation', () => {
    expect(mainScreens.find((screen) => screen.id === 'lab')).toMatchObject({
      id: 'lab',
      label: 'Sundesk Lab',
      shortLabel: 'Lab',
      group: 'Work',
    })
  })
})
