import {
  type DependencyLink,
  type Workbase,
  getDependencyReferencesForRecord,
} from './workbase'

export type DependencyRelationship = DependencyLink['relationship']

export function getDependencyLabel(dependency: DependencyLink, currentRecordId: string) {
  if (dependency.relationship === 'dependsOn') {
    return dependency.fromRecordId === currentRecordId ? 'Depends on' : 'Needed by'
  }

  return dependency.fromRecordId === currentRecordId ? 'Blocks' : 'Blocked by'
}

export function getDependencySummary(base: Workbase, recordId: string) {
  const dependencies = getDependencyReferencesForRecord(base, recordId)

  return dependencies.map((dependency) => ({
    id: dependency.id,
    label: getDependencyLabel(dependency, recordId),
    title: dependency.record.title,
  }))
}

export function hasDuplicateDependency(
  dependencies: DependencyLink[],
  nextDependency: Pick<DependencyLink, 'fromRecordId' | 'toRecordId' | 'relationship'>,
  exceptDependencyId = '',
) {
  return dependencies.some(
    (dependency) =>
      dependency.id !== exceptDependencyId &&
      dependency.fromRecordId === nextDependency.fromRecordId &&
      dependency.toRecordId === nextDependency.toRecordId &&
      dependency.relationship === nextDependency.relationship,
  )
}

export function getUniqueDependencyId(dependencies: DependencyLink[], dependency: Pick<DependencyLink, 'fromRecordId' | 'toRecordId' | 'relationship'>) {
  const baseId = `dependency_${dependency.fromRecordId}_${dependency.toRecordId}_${dependency.relationship}`
  let uniqueId = baseId
  let suffix = 2

  while (dependencies.some((item) => item.id === uniqueId)) {
    uniqueId = `${baseId}_${suffix}`
    suffix += 1
  }

  return uniqueId
}
