import { assertBrandAccess } from "@/lib/auth/assert-brand-access"
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandIdParam = searchParams.get('brandId')
    
    const brand = await assertBrandAccess(brandIdParam)
    if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    const members = await prisma.workspaceMember.findMany({
      where: { workspace_id: brand.workspace_id },
      include: { user: true },
      orderBy: { created_at: 'asc' }
    })

    const formatted = members.map(m => ({
      id: m.id,
      user_id: m.user_id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joined_at: m.created_at
    }))

    return NextResponse.json({ members: formatted })
  } catch (error: any) {
    console.error('Team API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandIdParam = searchParams.get('brandId')
    const brand = await assertBrandAccess(brandIdParam)
    if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, email, name, role } = await req.json()

    if (id) {
      // Update existing member role
      const updated = await prisma.workspaceMember.update({
        where: { id, workspace_id: brand.workspace_id },
        data: { role }
      })
      // Also update user name if provided
      if (name) {
        await prisma.user.update({
          where: { id: updated.user_id },
          data: { name }
        })
      }
      return NextResponse.json(updated)
    } else {
      // Add new member
      if (!email) return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
      
      // Check if user exists
      let user = await prisma.user.findUnique({ where: { email } })
      
      if (!user) {
        // Create user with default password 'password123'
        const password_hash = await hash('password123', 10)
        user = await prisma.user.create({
          data: { email, name, password_hash, role: 'SPECIALIST' }
        })
      }

      // Check if already in workspace
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          workspace_id_user_id: {
            workspace_id: brand.workspace_id,
            user_id: user.id
          }
        }
      })

      if (existingMember) {
        return NextResponse.json({ error: 'Pengguna sudah berada di dalam workspace ini' }, { status: 400 })
      }

      const created = await prisma.workspaceMember.create({
        data: {
          workspace_id: brand.workspace_id,
          user_id: user.id,
          role
        }
      })
      return NextResponse.json(created)
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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

    await prisma.workspaceMember.delete({
      where: { id, workspace_id: brand.workspace_id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
