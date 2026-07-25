import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { CommunitiesScreen } from './CommunitiesScreen'
import { workbase, type BaseRecord, getRecordTitle } from '../data/workbase'
import { getTimelineSourceRecords, getWorkRecordGroups } from '../data/views'

const noop = vi.fn()

function renderCommunitiesScreen() {
  const groups = getWorkRecordGroups(workbase)
  const communityDetailRecord = groups.communityRecords[0]
  const timelineSourceRecords = getTimelineSourceRecords(workbase)
  const communityDetailRecords = timelineSourceRecords.filter((record) =>
    record.id !== communityDetailRecord.id &&
    workbase.fields.some((field) => {
      const value = record.values[field.id]

      return field.type === 'linkedRecord' && Array.isArray(value) && value.includes(communityDetailRecord.id)
    }),
  )

  return renderToStaticMarkup(
    createElement(CommunitiesScreen, {
      addCommunityLink: noop,
      atRiskCommunityRecords: groups.atRiskCommunityRecords,
      base: workbase,
      communityDetailBlockers: communityDetailRecords.filter((record) => ['Blocked', 'High'].includes(String(record.values.status || record.values.level || ''))),
      communityDetailMeetings: communityDetailRecords.filter((record) => record.tableId === 'meetings'),
      communityDetailNextAction: communityDetailRecords[0],
      communityDetailRecord,
      communityDetailRecords,
      communityDetailWaiting: communityDetailRecords.filter((record) => record.tableId === 'followups' || record.values.status === 'Waiting'),
      communityLinkableRecords: [],
      communityLinkRecordId: '',
      communityNewLinkDate: '',
      communityNewLinkDateField: null,
      communityNewLinkExtraFields: [],
      communityNewLinkExtraValues: {},
      communityNewLinkStatus: '',
      communityNewLinkStatusField: null,
      communityNewLinkTableId: 'tasks',
      communityNewLinkTitle: '',
      communityRecords: groups.communityRecords,
      createCommunityLinkedRecord: noop,
      getCommunityLinkField: () => undefined,
      getCommunityLinkedRowExtraSummary: () => '',
      getPickerRecordMeta: (record: BaseRecord) => getRecordTitle(workbase, record),
      onOpenCommunitySourceRoute: noop,
      onOpenDailyRecord: noop,
      onSelectCommunityDetail: noop,
      onUpdateRecordField: () => undefined,
      removeCommunityLink: noop,
      setCommunityLinkRecordId: noop,
      setCommunityNewLinkDate: noop,
      setCommunityNewLinkExtraValues: noop,
      setCommunityNewLinkStatus: noop,
      setCommunityNewLinkTableId: noop,
      setCommunityNewLinkTitle: noop,
      timelineSourceRecords,
    }),
  )
}

describe('CommunitiesScreen', () => {
  it('renders the deck-faithful four-place command board', () => {
    const html = renderCommunitiesScreen()

    expect(html).toContain('Scan every place')
    expect(html).toContain('Toronto')
    expect(html).toContain('Mississauga')
    expect(html).toContain('Brampton')
    expect(html).toContain('Vaughan')
    expect(html).toContain('Stalled')
    expect(html).toContain('Waiting on reply')
    expect(html).not.toContain('Preview digest')
    expect(html).not.toContain('Add row')
    expect(html).not.toContain('Open Communities')
  })

  it('keeps the selected community read inside the selected card', () => {
    const html = renderCommunitiesScreen()

    expect(html).toContain('selected-community-card')
    expect(html).toContain('What needs attention')
    expect(html).toContain('Permit missing')
    expect(html).toContain('Open community')
    expect(html).toContain('See waiting')
    expect(html).toContain('Prep meeting')
    expect(html).not.toContain('<details')
  })
})
