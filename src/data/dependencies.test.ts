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
    const dependsOn = workbase.dependencies.find((dependency) => dependency.id === 'dependency_permit_toronto')
    const blocks = workbase.dependencies.find((dependency) => dependency.id === 'dependency_risk_toronto')

    expect(dependsOn).toBeDefined()
    expect(blocks).toBeDefined()
    expect(getDependencyLabel(dependsOn!, 'task_permit_toronto')).toBe('Depends on')
    expect(getDependencyLabel(dependsOn!, 'approval_permit_toronto')).toBe('Needed by')
    expect(getDependencyLabel(blocks!, 'risk_permit_toronto')).toBe('Blocks')
    expect(getDependencyLabel(blocks!, 'task_permit_toronto')).toBe('Blocked by')
  })

  it('summarizes linked dependencies for a record', () => {
    expect(getDependencySummary(workbase, 'task_permit_toronto')).toEqual([
      {
        id: 'dependency_permit_toronto',
        label: 'Depends on',
        title: 'Permit missing',
      },
      {
        id: 'dependency_risk_toronto',
        label: 'Blocked by',
        title: 'Permit risk may slip readiness.',
      },
    ])
  })

  it('detects exact duplicate dependency links', () => {
    expect(hasDuplicateDependency(workbase.dependencies, {
      fromRecordId: 'task_permit_toronto',
      toRecordId: 'approval_permit_toronto',
      relationship: 'dependsOn',
    })).toBe(true)

    expect(hasDuplicateDependency(workbase.dependencies, {
      fromRecordId: 'approval_permit_toronto',
      toRecordId: 'task_permit_toronto',
      relationship: 'dependsOn',
    })).toBe(false)
  })

  it('generates deterministic ids and increments on collision', () => {
    expect(getUniqueDependencyId(workbase.dependencies, {
      fromRecordId: 'task_permit_toronto',
      toRecordId: 'approval_permit_toronto',
      relationship: 'dependsOn',
    })).toBe('dependency_task_permit_toronto_approval_permit_toronto_dependsOn')

    expect(getUniqueDependencyId([
      {
        id: 'dependency_task_permit_toronto_approval_permit_toronto_dependsOn',
        fromRecordId: 'task_permit_toronto',
        toRecordId: 'approval_permit_toronto',
        relationship: 'dependsOn',
        reason: '',
      },
    ], {
      fromRecordId: 'task_permit_toronto',
      toRecordId: 'approval_permit_toronto',
      relationship: 'dependsOn',
    })).toBe('dependency_task_permit_toronto_approval_permit_toronto_dependsOn_2')
  })
})
