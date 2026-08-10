import { NextResponse } from 'next/server'
import { CommandParser } from '@/lib/command-parser'

export async function POST(request: Request) {
  try {
    const { brandId, query } = await request.json()
    if (!brandId || !query) {
      return NextResponse.json({ error: 'brandId and query required' }, { status: 400 })
    }

    const result = CommandParser.parse(query)
    return NextResponse.json({ result })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
