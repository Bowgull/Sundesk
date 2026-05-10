import { getFieldDisplayValue } from './rules'
import {
  type BaseRecord,
  type FieldDefinition,
  type Workbase,
} from './workbase'

export function exportTableCsv(base: Workbase, fields: FieldDefinition[], records: BaseRecord[]) {
  const header = fields.map((field) => escapeCsvCell(field.label)).join(',')
  const rows = records.map((record) =>
    fields
      .map((field) => escapeCsvCell(getFieldDisplayValue(base, record, field)))
      .join(','),
  )

  return [header, ...rows].join('\n')
}

function escapeCsvCell(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replaceAll('"', '""')}"`
  }

  return value
}
