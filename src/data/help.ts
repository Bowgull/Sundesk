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
    body: 'Build holds tables, fields, records, views, rules, and the grid. Daily work sees the result before the machinery.',
    routeLabel: 'Build',
    synonyms: ['tables', 'database', 'setup', 'structure'],
  },
  {
    id: 'tables',
    title: 'Tables, records, fields',
    body: 'Tables hold records. Records are rows. Fields tell Sundesk how to treat each piece of information.',
    routeLabel: 'Build',
    synonyms: ['spreadsheet', 'Airtable', 'rows', 'columns'],
  },
  {
    id: 'fields',
    title: 'Field types',
    body: 'Use dates for pressure, status for stage, checkbox for yes/no, tags for labels, and links for relationships.',
    routeLabel: 'Lab fields',
    synonyms: ['date', 'status', 'checkbox', 'tags', 'link'],
  },
  {
    id: 'tags',
    title: 'Tags and labels',
    body: 'Tags are reusable labels. One record can carry several tags, then those tags can route and filter work.',
    routeLabel: 'Lab tags',
    synonyms: ['label', 'waiting', 'Steph', 'filter', 'multi tag', 'multi-tag'],
  },
  {
    id: 'links',
    title: 'Linked records',
    body: 'Linked records connect work to communities, people, meetings, approvals, and backlinks.',
    routeLabel: 'Lab links',
    synonyms: ['relationship', 'connected', 'backlinks', 'link'],
  },
  {
    id: 'views',
    title: 'Views',
    body: 'Views save useful filter, sort, group, colour, and density choices for a table.',
    routeLabel: 'Lab views',
    synonyms: ['filter', 'sort', 'group', 'save'],
  },
  {
    id: 'meetings',
    title: 'Meeting notes and PDFs',
    body: 'Meetings gather source records into prep, agendas, weekly notes, and PDF exports.',
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
    id: 'privacy',
    title: 'Privacy and at-your-own-risk note',
    body: 'Use Sundesk for sensitive information at your own risk. You choose what belongs in the app.',
    routeLabel: 'Settings',
    synonyms: ['settings', 'data', 'disclaimer', 'sensitive'],
  },
  {
    id: 'rupaul',
    title: 'RuPaul Mode',
    body: 'RuPaul Mode is an alternate copy layer. Long hover shows plain version.',
    routeLabel: 'Settings',
    synonyms: ['voice', 'copy', 'plain version', 'mode'],
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
