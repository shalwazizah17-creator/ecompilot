import { NextResponse } from 'next/server'
import { validateAndCheckDuplicates, importData, SourceType, ColumnMapping } from '@/lib/csv-parser'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, fileContent, brandId, platformId, sourceType, mapping, duplicateStrategy } = body

    if (!fileContent || !brandId || !platformId || !sourceType || !mapping) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'validate') {
      const result = await validateAndCheckDuplicates(fileContent, brandId, platformId, sourceType as SourceType, mapping as ColumnMapping)
      return NextResponse.json(result)
    }

    if (action === 'import') {
      const strategy = duplicateStrategy === 'REPLACE' ? 'REPLACE' : 'SKIP'
      const result = await importData(fileContent, brandId, platformId, sourceType as SourceType, mapping as ColumnMapping, strategy)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Import API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
