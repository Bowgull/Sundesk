import { describe, expect, it } from 'vitest'
import { helpArticles, searchHelpArticles } from './help'

describe('local Help search', () => {
  it('keeps authored articles for onboarding readiness topics', () => {
    expect(helpArticles.map((article) => article.id)).toEqual(expect.arrayContaining([
      'tags',
      'meetings',
      'lab',
      'iphone',
      'shared-access',
      'install-bookmark',
      'restart-onboarding',
      'privacy',
      'rupaul',
      'backup',
    ]))
  })

  it('searches title, body, synonyms, and route labels without chat framing', () => {
    expect(searchHelpArticles('Steph label')[0]?.id).toBe('tags')
    expect(searchHelpArticles('PDF boss')[0]?.id).toBe('meetings')
    expect(searchHelpArticles('iPhone home screen')[0]?.id).toBe('iphone')
    expect(searchHelpArticles('plain version')[0]?.id).toBe('rupaul')
    expect(searchHelpArticles('Settings disclaimer')[0]?.id).toBe('privacy')
    expect(searchHelpArticles('Sundesk Lab')[0]?.id).toBe('lab')
    expect(searchHelpArticles('login shared data')[0]?.id).toBe('shared-access')
    expect(searchHelpArticles('desktop bookmark icon')[0]?.id).toBe('install-bookmark')
    expect(searchHelpArticles('start over tutorial')[0]?.id).toBe('restart-onboarding')
  })

  it('returns suggested defaults for an empty query and no results for unmatched local search', () => {
    expect(searchHelpArticles('').map((article) => article.id)).toEqual(['start', 'build', 'tags', 'meetings', 'privacy'])
    expect(searchHelpArticles('zebra launch fog')).toEqual([])
  })
})
