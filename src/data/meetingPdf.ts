import {
  getFirstDateValue,
  getStringValue,
} from './rules'
import {
  type MeetingPrep,
  getMeetingAgendaText,
  getMeetingWeeklyNoteText,
} from './views'
import {
  type BaseRecord,
  type Workbase,
  getRecord,
  getRecordContext,
  getRecordTitle,
} from './workbase'

type MeetingPdfExport = {
  bytes: Uint8Array
  fileName: string
  mimeType: 'application/pdf'
  text: string
}

type MeetingPdfKind = 'agenda' | 'note'

const pdfMimeType = 'application/pdf'

function toFileSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'meeting'
}

function getMeetingDate(prep: MeetingPrep) {
  return getStringValue(prep.meeting, 'date').slice(0, 10) || getFirstDateValue(prep.meeting) || new Date().toISOString().slice(0, 10)
}

function formatRecordList(base: Workbase, records: readonly BaseRecord[]) {
  if (records.length === 0) {
    return ['None surfaced.']
  }

  return records.map((record, index) => `${index + 1}. ${getRecordTitle(base, record)}. ${getRecordContext(record)}.`)
}

function getUniqueSourceRecords(base: Workbase, prep: MeetingPrep) {
  const recordIds = new Set([
    ...prep.agenda.flatMap((item) => item.recordIds),
    ...prep.communities.map((record) => record.id),
    ...prep.linkedTasks.map((record) => record.id),
    ...prep.risks.map((record) => record.id),
    ...prep.overdueFollowups.map((record) => record.id),
    ...prep.unresolvedApprovals.map((record) => record.id),
  ])

  return Array.from(recordIds).flatMap((recordId) => {
    const record = getRecord(base, recordId)

    return record ? [record] : []
  })
}

function extractPlainSection(note: string, heading: string) {
  const pattern = new RegExp(`(?:^|\\n)## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, 'i')
  const match = note.match(pattern)

  return cleanPlainText(match?.[1] || '')
}

function cleanPlainText(value: string) {
  return value
    .split('\n')
    .map((line) => line
      .replace(/^#{1,6}\s+/, '')
      .replace(/^[-*]\s+/, '')
      .replace(/\*\*/g, '')
      .trim())
    .filter(Boolean)
    .join('\n')
}

function buildMeetingNoteText(base: Workbase, prep: MeetingPrep) {
  const note = getStringValue(prep.meeting, 'weeklyNote') || getMeetingWeeklyNoteText(base, prep)
  const communities = prep.communities.map((record) => getRecordTitle(base, record)).join(', ') || 'None linked.'
  const workLinked = prep.linkedTasks.map((record) => getRecordTitle(base, record)).join(', ') || 'None linked.'
  const decisions = extractPlainSection(note, 'Decisions') || 'No decisions written.'
  const nextSteps = extractPlainSection(note, 'Next steps') || formatRecordList(base, prep.nextSteps).join('\n')
  const noteRisks = extractPlainSection(note, 'Risks')
  const riskLines = noteRisks || formatRecordList(base, [...prep.risks, ...prep.blockedItems]).join('\n')

  return [
    'Sundesk meeting note',
    '',
    `Meeting: ${getRecordTitle(base, prep.meeting)}`,
    `Date: ${getMeetingDate(prep)}`,
    '',
    'Communities',
    communities,
    '',
    'Work linked',
    workLinked,
    '',
    'Risks and blockers',
    riskLines,
    '',
    'Waiting on',
    ...formatRecordList(base, prep.overdueFollowups),
    '',
    'Decisions',
    decisions,
    '',
    'Next steps',
    nextSteps,
    '',
    'Source records',
    ...formatRecordList(base, getUniqueSourceRecords(base, prep)),
    '',
    'Built from Sundesk',
  ].join('\n').trim()
}

function buildMeetingAgendaText(base: Workbase, prep: MeetingPrep) {
  return [
    'Sundesk meeting agenda',
    '',
    `Meeting: ${getRecordTitle(base, prep.meeting)}`,
    `Date: ${getMeetingDate(prep)}`,
    '',
    cleanPlainText(getMeetingAgendaText(base, prep)),
    '',
    'Built from Sundesk',
  ].join('\n').trim()
}

function normalizePdfText(value: string) {
  return Array.from(value.normalize('NFKD'))
    .filter((character) => {
      const code = character.charCodeAt(0)

      return code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126)
    })
    .join('')
}

function escapePdfText(value: string) {
  return normalizePdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function wrapLine(line: string, maxLength = 88) {
  const words = normalizePdfText(line).split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word

    if (next.length > maxLength && current) {
      lines.push(current)
      current = word
      return
    }

    current = next
  })

  if (current) {
    lines.push(current)
  }

  return lines.length > 0 ? lines : ['']
}

function buildPdfBytes(text: string) {
  const textLines = text.split('\n').flatMap((line) => wrapLine(line))
  const pageHeight = 792
  const top = 744
  const bottom = 64
  const lineHeight = 15
  const linesPerPage = Math.floor((top - bottom) / lineHeight)
  const pages: string[][] = []

  for (let index = 0; index < textLines.length; index += linesPerPage) {
    pages.push(textLines.slice(index, index + linesPerPage))
  }

  const objects: string[] = []
  const pageObjectIds: number[] = []
  const contentObjectIds: number[] = []

  objects.push('<< /Type /Catalog /Pages 2 0 R >>')
  objects.push('')

  pages.forEach((pageLines, pageIndex) => {
    const pageObjectId = 3 + pageIndex * 2
    const contentObjectId = pageObjectId + 1

    pageObjectIds.push(pageObjectId)
    contentObjectIds.push(contentObjectId)
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 ${pageHeight}] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObjectId} 0 R >>`)

    const contentLines = [
      'BT',
      '/F1 11 Tf',
      '50 744 Td',
      '14 TL',
      ...pageLines.flatMap((line, lineIndex) => [
        lineIndex === 0 ? '' : 'T*',
        `(${escapePdfText(line)}) Tj`,
      ]).filter(Boolean),
      'ET',
    ]
    const stream = contentLines.join('\n')

    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
  })

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  const encoder = new TextEncoder()
  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(encoder.encode(pdf).length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = encoder.encode(pdf).length

  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return encoder.encode(pdf)
}

function buildMeetingPdfExport(base: Workbase, prep: MeetingPrep, kind: MeetingPdfKind): MeetingPdfExport {
  const text = kind === 'note' ? buildMeetingNoteText(base, prep) : buildMeetingAgendaText(base, prep)
  const meetingSlug = toFileSlug(getRecordTitle(base, prep.meeting))
  const date = getMeetingDate(prep)

  return {
    bytes: buildPdfBytes(text),
    fileName: `sundesk-meeting-${kind}-${meetingSlug}-${date}.pdf`,
    mimeType: pdfMimeType,
    text,
  }
}

export function buildMeetingNotePdfExport(base: Workbase, prep: MeetingPrep) {
  return buildMeetingPdfExport(base, prep, 'note')
}

export function buildMeetingAgendaPdfExport(base: Workbase, prep: MeetingPrep) {
  return buildMeetingPdfExport(base, prep, 'agenda')
}
