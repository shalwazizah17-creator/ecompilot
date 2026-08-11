import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyName, brandName } = await req.json()

    if (!companyName || !brandName) {
      return NextResponse.json({ error: 'Missing company or brand name' }, { status: 400 })
    }

    // Wrap in a transaction to ensure everything is created together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Workspace
      const workspace = await tx.workspace.create({
        data: {
          name: companyName,
        }
      })

      // 2. Add User as Workspace Owner
      await tx.workspaceMember.create({
        data: {
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'OWNER'
        }
      })

      // 3. Create initial Brand
      const brand = await tx.brand.create({
        data: {
          workspace_id: workspace.id,
          name: brandName
        }
      })

      return { workspace, brand }
    })

    return NextResponse.json({ success: true, workspaceId: result.workspace.id })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
