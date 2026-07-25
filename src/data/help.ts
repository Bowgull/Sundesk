export type HelpRouteLabel =
  | 'Today'
  | 'Build'
  | 'Lab fields'
  | 'Lab tags'
  | 'Lab links'
  | 'Lab views'
  | 'Meetings'
  | 'Sundesk Lab'
  | 'Help'
  | 'Settings'

export type HelpArticle = {
  id: string
  title: string
  body: string
  routeLabel: HelpRouteLabel
  synonyms: string[]
  troubleshooting?: string
}

export const helpArticles: readonly HelpArticle[] = [
  {
    id: 'start',
    title: 'Start with Today',
    body: 'Today is home. It shows what needs attention, why it surfaced, and what opens next.',
    routeLabel: 'Today',
    synonyms: ['home', 'dashboard', 'where do I begin', 'morning brief'],
  },
  {
    id: 'build',
    title: 'Build is where structure lives',
    body: 'Build is where you shape the work area. Daily work sees only what needs attention.',
    routeLabel: 'Build',
    synonyms: ['tables', 'database', 'setup', 'structure'],
  },
  {
    id: 'tables',
    title: 'Areas, items, columns',
    body: 'Areas hold work. Items are the things you act on. Columns hold the details.',
    routeLabel: 'Sundesk Lab',
    synonyms: ['spreadsheet', 'Airtable', 'rows', 'columns'],
  },
  {
    id: 'fields',
    title: 'Column behavior',
    body: 'Use dates for pressure, status for stage, checkboxes for yes/no, tags for labels, and connections for relationships.',
    routeLabel: 'Lab fields',
    synonyms: ['date', 'status', 'checkbox', 'tags', 'link'],
  },
  {
    id: 'tags',
    title: 'Tags and labels',
    body: 'Tags are reusable labels. One item can carry several tags, then those tags can route and filter work.',
    routeLabel: 'Lab tags',
    synonyms: ['label', 'waiting', 'Steph', 'filter', 'multi tag', 'multi-tag'],
  },
  {
    id: 'links',
    title: 'Connections',
    body: 'Connections tie work to communities, people, meetings, and approvals.',
    routeLabel: 'Lab links',
    synonyms: ['relationship', 'connected', 'backlinks', 'link'],
  },
  {
    id: 'views',
    title: 'Saved scans',
    body: 'Saved scans keep useful ways of looking at work.',
    routeLabel: 'Lab views',
    synonyms: ['filter', 'sort', 'group', 'save'],
  },
  {
    id: 'meetings',
    title: 'Meeting notes and PDFs',
    body: 'Meetings gather work into prep, agendas, weekly notes, and PDF exports.',
    routeLabel: 'Meetings',
    synonyms: ['agenda', 'export', 'boss', 'PDF', 'note'],
  },
  {
    id: 'lab',
    title: 'Sundesk Lab',
    body: 'The Lab is the practice lane. It uses sample data so you can learn without touching the real workspace.',
    routeLabel: 'Sundesk Lab',
    synonyms: ['sandbox', 'practice', 'sample'],
  },
  {
    id: 'iphone',
    title: 'Use Sundesk on iPhone',
    body: 'Open the hosted Sundesk URL, add it to Home Screen, and use the saved Sundesk icon.',
    routeLabel: 'Help',
    synonyms: ['mobile', 'home screen', 'PWA', 'install'],
  },
  {
    id: 'shared-access',
    title: 'Shared workspace access',
    body: 'Use the approved hosted address for shared daily work. Google sign-in gates shared data for approved accounts.',
    routeLabel: 'Settings',
    synonyms: ['login', 'sign in', 'Google', 'shared', 'sync', 'desktop', 'mobile', 'another device'],
  },
  {
    id: 'install-bookmark',
    title: 'Install and bookmark Sundesk',
    body: 'On iPhone, open the approved address in Safari and Add to Home Screen. On desktop, bookmark the approved address. Today still opens first.',
    routeLabel: 'Settings',
    synonyms: ['bookmark', 'desktop bookmark', 'icon', 'Safari', 'approved address', 'home screen'],
  },
  {
    id: 'restart-onboarding',
    title: 'Run onboarding again',
    body: 'Settings has Restart onboarding. It starts the guided tour again without deleting work, Lab progress, or workspace data.',
    routeLabel: 'Settings',
    synonyms: ['start over', 'tour', 'tutorial', 'guided', 'onboarding', 'restart'],
  },
  {
    id: 'privacy',
    title: 'Privacy and at-your-own-risk note',
    body: 'Use Sundesk for sensitive information at your own risk. You choose what belongs in the app.',
    routeLabel: 'Settings',
    synonyms: ['settings', 'data', 'disclaimer', 'sensitive'],
  },
  {
    id: 'rupaul',
    title: 'RuPaul Mode',
    body: 'RuPaul Mode is the showtime voice layer. It adds diva-coded copy while long hover keeps the plain version available.',
    routeLabel: 'Settings',
    synonyms: ['voice', 'copy', 'plain version', 'mode', 'showtime', 'diva', 'camp', 'runway', 'werkroom'],
  },
  {
    id: 'backup',
    title: 'Backup and restore',
    body: 'Export a local backup before large edits. Import only from a Sundesk backup you trust.',
    routeLabel: 'Settings',
    synonyms: ['export', 'import', 'local copy', 'restore'],
  },
]

const defaultHelpArticleIds = ['start', 'build', 'tags', 'meetings', 'privacy']

export function searchHelpArticles(query: string): HelpArticle[] {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return defaultHelpArticleIds
      .map((id) => helpArticles.find((article) => article.id === id))
      .filter(Boolean) as HelpArticle[]
  }

  const terms = normalizedQuery.split(' ').filter(Boolean)

  return helpArticles
    .map((article) => ({
      article,
      score: getArticleSearchScore(article, terms, normalizedQuery),
    }))
    .filter((result) => result.score > 0 && articleContainsAllTerms(result.article, terms))
    .sort((first, second) => second.score - first.score || first.article.title.localeCompare(second.article.title))
    .map((result) => result.article)
}

function articleContainsAllTerms(article: HelpArticle, terms: string[]) {
  const fullText = normalizeSearchText([
    article.title,
    article.routeLabel,
    article.synonyms.join(' '),
    article.body,
    article.troubleshooting || '',
  ].join(' '))

  return terms.every((term) => fullText.includes(term))
}

function getArticleSearchScore(article: HelpArticle, terms: string[], normalizedQuery: string) {
  const title = normalizeSearchText(article.title)
  const routeLabel = normalizeSearchText(article.routeLabel)
  const synonyms = normalizeSearchText(article.synonyms.join(' '))
  const body = normalizeSearchText(article.body)
  const fullText = `${title} ${routeLabel} ${synonyms} ${body}`
  let score = 0

  if (title.includes(normalizedQuery)) score += 12
  if (synonyms.includes(normalizedQuery)) score += 10
  if (routeLabel.includes(normalizedQuery)) score += 8
  if (body.includes(normalizedQuery)) score += 5

  terms.forEach((term) => {
    if (title.includes(term)) score += 4
    if (synonyms.includes(term)) score += 3
    if (routeLabel.includes(term)) score += 2
    if (body.includes(term)) score += 1
    if (!fullText.includes(term)) score -= 1
  })

  return score
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}
