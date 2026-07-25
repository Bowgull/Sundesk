import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BuildPasteHelper } from './BuildPasteHelper'

describe('BuildPasteHelper', () => {
  it('explains skipped extra columns even when paste suggestions exist', () => {
    const html = renderToStaticMarkup(
      createElement(BuildPasteHelper, {
        applyPasteAction: () => undefined,
        buildPasteReceipt: '2 rows pasted. 8 cells changed.',
        buildPasteSummary: {
          created: 1,
          updated: 1,
          columns: ['Title', 'Status'],
          skippedColumns: ['Extra column 1'],
          issues: [],
          suggestions: ['Status reads as a select field.'],
          actions: [],
        },
      }),
    )

    expect(html).toContain('Status reads as a select field.')
    expect(html).toContain('Skipped: Extra column 1.')
  })

  it('shows created and updated row counts next to the paste receipt', () => {
    const html = renderToStaticMarkup(
      createElement(BuildPasteHelper, {
        applyPasteAction: () => undefined,
        buildPasteReceipt: '4 rows pasted. 28 cells changed.',
        buildPasteSummary: {
          created: 1,
          updated: 3,
          columns: ['Title'],
          skippedColumns: [],
          issues: [],
          suggestions: [],
          actions: [],
        },
      }),
    )

    expect(html).toContain('4 rows pasted. 28 cells changed. 1 new. 3 updated.')
  })

  it('explains invalid paste values plainly', () => {
    const html = renderToStaticMarkup(
      createElement(BuildPasteHelper, {
        applyPasteAction: () => undefined,
        buildPasteReceipt: '1 rows pasted. 1 cells changed.',
        buildPasteSummary: {
          created: 0,
          updated: 1,
          columns: ['Permit price'],
          skippedColumns: [],
          issues: ['Permit price needs a number.'],
          suggestions: [],
          actions: [],
        },
      }),
    )

    expect(html).toContain('Check: Permit price needs a number.')
  })
})
