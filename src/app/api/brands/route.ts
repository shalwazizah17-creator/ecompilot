import { NextResponse } from 'next/server'
import { assertBrandAccess } from '@/lib/auth/assert-brand-access'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = (user as any).workspaceId
  if (!workspaceId) return NextResponse.json({ brands: [] })

  const brands = await prisma.brand.findMany({
    where: { workspace_id: workspaceId },
    orderBy: { created_at: 'asc' },
  })

  return NextResponse.json({ brands })
}
