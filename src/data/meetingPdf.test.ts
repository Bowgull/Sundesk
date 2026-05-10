import { describe, expect, it } from 'vitest'
import {
  buildMeetingNotePdfExport,
} from './meetingPdf'
import {
  getMeetingPrep,
} from './views'
import {
  workbase,
} from './workbase'

describe('meeting PDF export', () => {
  it('builds a meeting note PDF filename and plain-text content', () => {
    const prep = getMeetingPrep(workbase, 'meeting_charlottetown', '2026-05-07')

    expect(prep).toBeDefined()

    const pdfExport = buildMeetingNotePdfExport(workbase, prep!)
    const pdfText = new TextDecoder().decode(pdfExport.bytes)

    expect(pdfExport.fileName).toBe('sundesk-meeting-note-charlottetown-prep-2026-05-15.pdf')
    expect(pdfExport.text).toContain('Sundesk meeting note')
    expect(pdfExport.text).toContain('Charlottetown prep.')
    expect(pdfExport.text).toContain('Built from Sundesk')
    expect(pdfExport.text).not.toContain('##')
    expect(pdfExport.text).not.toContain('- ')
    expect(pdfText.startsWith('%PDF-1.4')).toBe(true)
    expect(pdfText).toContain('Sundesk meeting note')
    expect(pdfExport.mimeType).toBe('application/pdf')
  })
})
