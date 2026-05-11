type ThemeSwatch = {
  background: string
  panel: string
  text: string
  accent: string
  status: string
  primary: string
}

export type ThemeId = 'command-center' | 'sunset' | 'coast' | 'dusk' | 'graphite' | 'night-shift'

type ThemeOption = {
  label: string
  value: ThemeId
  swatch: ThemeSwatch
}

// Theme values are persisted ids. Keep them stable.
export const themes = [
  {
    label: 'Command Center',
    value: 'command-center',
    swatch: {
      background: 'linear-gradient(135deg, #eef7fb, #fff8e8)',
      panel: '#ffffff',
      text: '#142838',
      accent: '#2d83bc',
      status: '#f8dbd8',
      primary: '#183346',
    },
  },
  {
    label: 'Sunset',
    value: 'sunset',
    swatch: {
      background: 'linear-gradient(135deg, #ffe19a, #ff8f6f 46%, #593e68)',
      panel: '#fff8ec',
      text: '#2b2330',
      accent: '#f55a01',
      status: '#f4a83f',
      primary: '#593e68',
    },
  },
  {
    label: 'Moss Paper',
    value: 'coast',
    swatch: {
      background: 'linear-gradient(135deg, #f5ecd8, #d9dfbd 52%, #5f7a4a)',
      panel: '#fff8e6',
      text: '#22301d',
      accent: '#6f7f3f',
      status: '#c9824b',
      primary: '#314a2c',
    },
  },
  {
    label: 'Dusk',
    value: 'dusk',
    swatch: {
      background: 'linear-gradient(135deg, #f1d7e8, #b9c3df 52%, #765d85)',
      panel: '#fffafd',
      text: '#26213a',
      accent: '#84485f',
      status: '#f05a4e',
      primary: '#593e68',
    },
  },
  {
    label: 'Graphite',
    value: 'graphite',
    swatch: {
      background: 'linear-gradient(135deg, #f5f6f7, #dde3e8)',
      panel: '#ffffff',
      text: '#1f2933',
      accent: '#53639a',
      status: '#df741b',
      primary: '#263340',
    },
  },
  {
    label: 'Night Shift',
    value: 'night-shift',
    swatch: {
      background: 'linear-gradient(135deg, #0d1420, #1c2840 58%, #593e68)',
      panel: '#1f2b3a',
      text: '#edf4f8',
      accent: '#fda839',
      status: '#eb3a3b',
      primary: '#f3d08d',
    },
  },
] as const satisfies readonly ThemeOption[]

// Screen order defines the sidebar hierarchy. Today stays home. Build stays visible.
type ScreenGroup = 'Work' | 'System' | 'Hidden'

type ScreenOption = {
  id: string
  label: string
  shortLabel: string
  group: ScreenGroup
}

export const mainScreens = [
  { id: 'today', label: 'Today', shortLabel: 'Today', group: 'Work' },
  { id: 'communities', label: 'Communities', shortLabel: 'Places', group: 'Work' },
  { id: 'followups', label: 'Waiting On', shortLabel: 'Waiting', group: 'Work' },
  { id: 'meetings', label: 'Meetings', shortLabel: 'Meet', group: 'Work' },
  { id: 'timeline', label: 'Timeline', shortLabel: 'Time', group: 'Work' },
  { id: 'lab', label: 'Sundesk Lab', shortLabel: 'Lab', group: 'Work' },
  { id: 'build', label: 'Build', shortLabel: 'Build', group: 'System' },
  { id: 'settings', label: 'Settings', shortLabel: 'Set', group: 'System' },
  { id: 'tasks', label: 'Work', shortLabel: 'Work', group: 'Hidden' },
] as const satisfies readonly ScreenOption[]

export type AppScreen = (typeof mainScreens)[number]['id']
export type TimelineView = 'grid' | 'kanban' | 'calendar' | 'timeline' | 'graph'

export const timelineViewOptions: { label: string; value: TimelineView }[] = [
  { label: 'Grid', value: 'grid' },
  { label: 'Kanban', value: 'kanban' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Timeline', value: 'timeline' },
  { label: 'Graph', value: 'graph' },
]
