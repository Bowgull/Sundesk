import { describe, expect, it } from 'vitest'
import {
  getDependencyLabel,
  getDependencySummary,
  getUniqueDependencyId,
  hasDuplicateDependency,
} from './dependencies'
import {
  workbase,
} from './workbase'

describe('dependency helpers', () => {
  it('labels dependencies from the current record perspective', () => {
    const dependsOn = workbase.dependencies.find((dependency) => dependency.id === 'dependency_coi_halifax')
    const blocks = workbase.dependencies.find((dependency) => dependency.id === 'dependency_risk_halifax')

    expect(dependsOn).toBeDefined()
    expect(blocks).toBeDefined()
    expect(getDependencyLabel(dependsOn!, 'task_coi_halifax')).toBe('Depends on')
    expect(getDependencyLabel(dependsOn!, 'approval_coi_halifax')).toBe('Needed by')
    expect(getDependencyLabel(blocks!, 'risk_venue_halifax')).toBe('Blocks')
    expect(getDependencyLabel(blocks!, 'task_coi_halifax')).toBe('Blocked by')
  })

  it('summarizes linked dependencies for a record', () => {
    expect(getDependencySummary(workbase, 'task_coi_halifax')).toEqual([
      {
        id: 'dependency_coi_halifax',
        label: 'Depends on',
        title: 'COI status',
      },
      {
        id: 'dependency_risk_halifax',
        label: 'Blocked by',
        title: 'Venue readiness may slip.',
      },
    ])
  })

  it('detects exact duplicate dependency links', () => {
    expect(hasDuplicateDependency(workbase.dependencies, {
      fromRecordId: 'task_coi_halifax',
      toRecordId: 'approval_coi_halifax',
      relationship: 'dependsOn',
    })).toBe(true)

    expect(hasDuplicateDependency(workbase.dependencies, {
      fromRecordId: 'approval_coi_halifax',
      toRecordId: 'task_coi_halifax',
      relationship: 'dependsOn',
    })).toBe(false)
  })

  it('generates deterministic ids and increments on collision', () => {
    expect(getUniqueDependencyId(workbase.dependencies, {
      fromRecordId: 'task_coi_halifax',
      toRecordId: 'approval_coi_halifax',
      relationship: 'dependsOn',
    })).toBe('dependency_task_coi_halifax_approval_coi_halifax_dependsOn')

    expect(getUniqueDependencyId([
      {
        id: 'dependency_task_coi_halifax_approval_coi_halifax_dependsOn',
        fromRecordId: 'task_coi_halifax',
        toRecordId: 'approval_coi_halifax',
        relationship: 'dependsOn',
        reason: '',
      },
    ], {
      fromRecordId: 'task_coi_halifax',
      toRecordId: 'approval_coi_halifax',
      relationship: 'dependsOn',
    })).toBe('dependency_task_coi_halifax_approval_coi_halifax_dependsOn_2')
  })
})
