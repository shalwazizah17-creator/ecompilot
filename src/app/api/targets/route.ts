import { assertBrandAccess } from "@/lib/auth/assert-brand-access"
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandIdParam = searchParams.get('brandId')
    
    const brand = await assertBrandAccess(brandIdParam)
    if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    const targets = await prisma.target.findMany({
      where: { brand_id: brand.id },
      orderBy: { type: 'asc' }
    })

    return NextResponse.json({ targets })
  } catch (error: any) {
    console.error('Target API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandIdParam = searchParams.get('brandId')
    const brand = await assertBrandAccess(brandIdParam)
    if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, type, value, level } = await req.json()

    if (id) {
      const updated = await prisma.target.update({
        where: { id, brand_id: brand.id },
        data: { type, value: Number(value), level }
      })
      return NextResponse.json(updated)
    } else {
      // Create new, ensure unique constraint [brand_id, type, level, level_id]
      // For level_id, we just use null for BRAND level
      const created = await prisma.target.upsert({
        where: {
          brand_id_type_level_level_id: {
            brand_id: brand.id,
            type,
            level,
            level_id: '' // Prisma null constraint handling workaround, let's use a standard pattern or just create
          }
        },
        update: { value: Number(value) },
        create: {
          brand_id: brand.id,
          type,
          value: Number(value),
          level,
          level_id: ''
        }
      })
      return NextResponse.json(created)
    }
  } catch (error: any) {
    // If upsert fails on unique constraint due to level_id nullability, just do create
    try {
      const { id, type, value, level } = await req.json()
      const brandIdParam = (new URL(req.url)).searchParams.get('brandId')
      const brand = await assertBrandAccess(brandIdParam)
      if(!brand) throw new Error("Forbidden")
      
      const created = await prisma.target.create({
        data: {
          brand_id: brand.id,
          type,
          value: Number(value),
          level
        }
      })
      return NextResponse.json(created)
    } catch (fallbackError: any) {
      return NextResponse.json({ error: fallbackError.message }, { status: 500 })
    }
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandIdParam = searchParams.get('brandId')
    const brand = await assertBrandAccess(brandIdParam)
    if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    await prisma.target.delete({
      where: { id, brand_id: brand.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
