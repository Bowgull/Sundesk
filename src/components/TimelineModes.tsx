import type { TimelineView } from '../appConfig'
import { buildTimelineModel } from '../data/timelineModel'
import type { BaseRecord, RecordValue, Workbase } from '../data/workbase'
import type { RuleMatch } from '../data/views'
import { TimelineCalendarMode } from './timeline/TimelineCalendarMode'
import { TimelineGanttMode } from './timeline/TimelineGanttMode'
import { TimelineGraphMode } from './timeline/TimelineGraphMode'
import { TimelineGridMode } from './timeline/TimelineGridMode'
import { TimelineKanbanMode } from './timeline/TimelineKanbanMode'

export type TimelineModesProps = {
  base: Workbase
  communityRecords: readonly BaseRecord[]
  timelineCalendarDate: string
  timelineGraphCommunityId: string
  timelineReadinessCommunityId: string
  timelineRecords: readonly BaseRecord[]
  timelineRuleMatches: readonly RuleMatch[]
  timelineView: TimelineView
  todayDate: string
  onOpenDailyRecord: (record: BaseRecord) => void
  onSetTimelineCalendarDate: (value: string) => void
  onSetTimelineGraphCommunityId: (value: string) => void
  onSetTimelineReadinessCommunityId: (value: string) => void
  onShowToast: (message: string) => void
  onUpdateRecordField: (recordId: string, fieldId: string, value: RecordValue) => void
}

export function TimelineModes({
  base,
  communityRecords,
  timelineCalendarDate,
  timelineGraphCommunityId,
  timelineReadinessCommunityId,
  timelineRecords,
  timelineRuleMatches,
  timelineView,
  todayDate,
  onOpenDailyRecord,
  onSetTimelineCalendarDate,
  onSetTimelineGraphCommunityId,
  onSetTimelineReadinessCommunityId,
  onShowToast,
  onUpdateRecordField,
}: TimelineModesProps) {
  const model = buildTimelineModel({
    base,
    records: timelineRecords,
    communityRecords,
    ruleMatches: timelineRuleMatches,
    selectedCalendarDate: timelineCalendarDate,
    selectedGanttCommunityId: timelineReadinessCommunityId,
    selectedGraphCommunityId: timelineGraphCommunityId,
    todayDate,
  })

  if (timelineView === 'kanban') {
    return (
      <TimelineKanbanMode
        base={base}
        model={model}
        onOpenRecord={onOpenDailyRecord}
        onShowToast={onShowToast}
        onUpdateRecordField={onUpdateRecordField}
      />
    )
  }

  if (timelineView === 'calendar') {
    return (
      <TimelineCalendarMode
        model={model}
        selectedDate={timelineCalendarDate}
        onOpenRecord={onOpenDailyRecord}
        onSelectDate={onSetTimelineCalendarDate}
      />
    )
  }

  if (timelineView === 'timeline') {
    return (
      <TimelineGanttMode
        model={model}
        selectedCommunityId={timelineReadinessCommunityId}
        onOpenRecord={onOpenDailyRecord}
        onSelectCommunity={onSetTimelineReadinessCommunityId}
      />
    )
  }

  if (timelineView === 'graph') {
    return (
      <TimelineGraphMode
        model={model}
        selectedCommunityId={timelineGraphCommunityId}
        onOpenRecord={onOpenDailyRecord}
        onSelectCommunity={onSetTimelineGraphCommunityId}
      />
    )
  }

  return <TimelineGridMode model={model} onOpenRecord={onOpenDailyRecord} />
}
