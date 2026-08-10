import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { rows, platform, reportType } = body
    
    let valid = 0
    let warnings = 0
    let errors = 0
    let errorRows: any[] = []

    rows.forEach((row: any, index: number) => {
      let isError = false
      let rowErrors: string[] = []

      if (!row.date) {
        isError = true
        rowErrors.push('Missing date')
      }

      // Check numeric bounds
      const numericFields = ['sales', 'orders', 'spend', 'commission', 'impressions', 'clicks']
      for (const field of numericFields) {
        if (row[field] !== undefined) {
          const val = Number(row[field])
          if (isNaN(val)) {
            isError = true
            rowErrors.push(`Invalid number for ${field}`)
          } else if (val < 0 && field !== 'refunds' && field !== 'cancellations') {
            isError = true
            rowErrors.push(`Negative value not allowed for ${field}`)
          }
        }
      }

      if (isError) {
        errors++
        errorRows.push({ rowIndex: index + 1, errors: rowErrors, data: row })
      } else {
        valid++
      }
    })

    return NextResponse.json({
      summary: {
        total: rows.length,
        valid,
        warnings,
        errors,
        duplicates: 0 // Will check duplicates strictly on confirm phase
      },
      errorRows
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
