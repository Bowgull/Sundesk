import { getDependencyLabel } from '../data/dependencies'
import type { BaseRecord } from '../data/workbase'
import { getRecordTitle, type Workbase } from '../data/workbase'

type TaskDependency = {
  id: string
  relationship: 'dependsOn' | 'blocks'
  fromRecordId: string
  toRecordId: string
  reason: string
  record: {
    id: string
    tableId: string
    tableLabel: string
    title: string
  }
}

type TasksScreenProps = {
  base: Workbase
  getPriority: (record: BaseRecord) => string
  getStatus: (record: BaseRecord) => string
  getDueDate: (record: BaseRecord) => string
  onCreateTask: () => void
  onOpenRecord: (record: BaseRecord) => void
  openTaskRecords: BaseRecord[]
  selectedTask: BaseRecord | undefined
  selectedTaskDependencies: TaskDependency[]
}

export function TasksScreen({
  base,
  getDueDate,
  getPriority,
  getStatus,
  onCreateTask,
  onOpenRecord,
  openTaskRecords,
  selectedTask,
  selectedTaskDependencies,
}: TasksScreenProps) {
  return (
    <section className="screen-grid" id="tasks">
      <article className="screen-panel wide">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Work</span>
            <h2>Open work.</h2>
          </div>
          <button className="primary" type="button" onClick={onCreateTask}>New work item</button>
        </div>
        <div className="record-card-grid">
          {openTaskRecords.map((record) => (
            <button className="work-record-card" key={record.id} type="button" onClick={() => onOpenRecord(record)}>
              <span>{getStatus(record) || 'No status'}</span>
              <strong>{getRecordTitle(base, record)}</strong>
              <small>{getPriority(record) || 'No priority'}. Due {getDueDate(record) || 'not set'}.</small>
            </button>
          ))}
        </div>
      </article>

      <article className="screen-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Blockers</span>
            <h2>What blocks what.</h2>
          </div>
          <button disabled={!selectedTask} type="button" onClick={() => selectedTask && onOpenRecord(selectedTask)}>
            Open blocker details
          </button>
        </div>
        <div className="dependency-list">
          {selectedTaskDependencies.map((dependency) => (
            <article key={dependency.id}>
              <strong>{getDependencyLabel(dependency, 'task_permit_toronto')} {dependency.record.title}</strong>
              <span>{dependency.record.tableLabel}</span>
              <small>{dependency.reason}</small>
            </article>
          ))}
        </div>
      </article>
    </section>
  )
}
