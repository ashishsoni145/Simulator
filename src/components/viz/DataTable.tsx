import { useCallback, useMemo } from 'react'
import { toSigFigs, trimZeros } from '../../science/units'

/**
 * The numbers behind the animation, as a table — and as a CSV.
 *
 * This is the bridge between "watch the ball" and "do the physics". A student can
 * read the row at t = 1.4 s, check it against their own working, and export the
 * whole run to plot in a spreadsheet for a lab report. None of the old views
 * exposed a single number you could copy.
 */

export interface DataColumn<Row> {
  key: string
  label: string
  unit?: string
  /** Pull the value out of a row. Defaults to `row[key]`. */
  value?: (row: Row) => number
  sigFigs?: number
}

export interface DataTableProps<Row> {
  columns: Array<DataColumn<Row>>
  rows: readonly Row[]
  caption: string
  /** Row to highlight — usually the one at the current simulation time. */
  highlightIndex?: number
  /** Show at most this many rows, evenly sampled. Default 40. */
  maxRows?: number
  /** Base name for the exported file. Omit to hide the export button. */
  exportName?: string
  className?: string
}

function readCell<Row>(column: DataColumn<Row>, row: Row): number {
  if (column.value) return column.value(row)
  const raw = (row as Record<string, unknown>)[column.key]
  return typeof raw === 'number' ? raw : Number.NaN
}

function fmt(value: number, sigFigs = 4): string {
  if (!Number.isFinite(value)) return '—'
  return trimZeros(toSigFigs(value, sigFigs))
}

export default function DataTable<Row>({
  columns,
  rows,
  caption,
  highlightIndex,
  maxRows = 40,
  exportName,
  className
}: DataTableProps<Row>) {
  // Sample rather than truncate: a table showing only the first 40 of 900 samples
  // would imply the flight ended a twentieth of the way through.
  const sampled = useMemo(() => {
    if (rows.length <= maxRows) {
      return rows.map((row, index) => ({ row, index }))
    }
    const stride = (rows.length - 1) / (maxRows - 1)
    const out: Array<{ row: Row; index: number }> = []
    for (let i = 0; i < maxRows; i += 1) {
      const index = Math.round(i * stride)
      out.push({ row: rows[index] as Row, index })
    }
    return out
  }, [rows, maxRows])

  const download = useCallback(() => {
    if (!exportName) return
    const header = columns.map((c) => (c.unit ? `${c.label} (${c.unit})` : c.label)).join(',')
    // The CSV carries every row at full precision, not the sampled/rounded view —
    // the table is for reading, the file is for computing with.
    const body = rows
      .map((row) =>
        columns
          .map((c) => {
            const value = readCell(c, row)
            return Number.isFinite(value) ? String(value) : ''
          })
          .join(',')
      )
      .join('\n')

    const blob = new Blob([`${header}\n${body}\n`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${exportName}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    // Without this the blob is pinned for the lifetime of the document.
    URL.revokeObjectURL(url)
  }, [columns, rows, exportName])

  return (
    <div className={`data-table${className ? ` ${className}` : ''}`}>
      <div className="data-table__head">
        <p className="data-table__caption">{caption}</p>
        {exportName && rows.length > 0 ? (
          <button type="button" className="data-table__export" onClick={download}>
            Download CSV
          </button>
        ) : null}
      </div>

      <div className="data-table__scroll">
        <table>
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col">
                  {column.label}
                  {column.unit ? <span className="data-table__unit">{column.unit}</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampled.map(({ row, index }) => (
              <tr
                key={index}
                className={highlightIndex === index ? 'data-table__row--active' : undefined}
                aria-current={highlightIndex === index ? 'true' : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key}>{fmt(readCell(column, row), column.sigFigs)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > sampled.length ? (
        <p className="data-table__note">
          {`Showing ${sampled.length} of ${rows.length} samples, evenly spaced. The CSV contains all of them.`}
        </p>
      ) : null}
    </div>
  )
}
