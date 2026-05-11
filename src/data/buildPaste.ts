import type { FieldDefinition, RecordValue } from './workbase'

export type BuildPasteLinkedRecordOption = {
  id: string
  title: string
}

export function parseBuildPasteRows(pastedText: string) {
  return pastedText
    .split(/\r?\n/)
    .map((row) => row.split('\t'))
    .filter((row) => row.some((cell) => cell.trim()))
}

export function getBuildPasteOverflowColumns(rows: string[][], startFieldIndex: number, fieldCount: number) {
  const maxColumnCount = rows.reduce((maxCount, row) => Math.max(maxCount, row.length), 0)
  const overflowCount = Math.max(0, startFieldIndex + maxColumnCount - fieldCount)

  return Array.from({ length: overflowCount }, (_, index) => `Extra column ${index + 1}`)
}

export function coerceBuildPasteCellValue(
  field: FieldDefinition,
  value: string,
  linkedRecords: BuildPasteLinkedRecordOption[] = [],
): RecordValue {
  const trimmedValue = value.trim()

  if (field.type === 'checkbox') {
    return ['true', 'yes', 'y', '1', 'done', 'received'].includes(trimmedValue.toLowerCase())
  }

  if (field.type === 'multiSelect') {
    return trimmedValue
      .split(/[,;]/)
      .map((option) => option.trim())
      .filter(Boolean)
  }

  if (field.type === 'linkedRecord') {
    const matchedRecord = linkedRecords.find((record) => record.title.toLowerCase() === trimmedValue.toLowerCase())

    return matchedRecord ? [matchedRecord.id] : []
  }

  if (['number', 'currency', 'percent', 'rating'].includes(field.type)) {
    const numericValue = Number(trimmedValue.replace(/[$,%]/g, '').replace(/,/g, ''))

    return Number.isFinite(numericValue) ? numericValue : 0
  }

  return trimmedValue
}

export function getBuildPasteOptionUpdates(
  fields: FieldDefinition[],
  pastedValuesByFieldId: Map<string, string[]>,
) {
  return fields.reduce<Record<string, string[]>>((updates, field) => {
    if (field.type !== 'multiSelect' && field.type !== 'singleSelect' && field.type !== 'status') {
      return updates
    }

    const values = pastedValuesByFieldId.get(field.id) || []
    const pastedOptions = values.flatMap((value) => {
      if (field.type === 'multiSelect') {
        return value
          .split(/[,;]/)
          .map((option) => option.trim())
          .filter(Boolean)
      }

      return [value.trim()].filter(Boolean)
    })
    const mergedOptions = Array.from(new Set([...(field.options || []), ...pastedOptions]))

    if (mergedOptions.length !== (field.options || []).length) {
      updates[field.id] = mergedOptions
    }

    return updates
  }, {})
}
