import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertBrandAccess } from '@/lib/auth/assert-brand-access'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const searchParams = req.nextUrl.searchParams
  const brandId = searchParams.get('brandId')
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  const access = await assertBrandAccess(brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const decisions = await prisma.decisionHistory.findMany({
    where: { brand_id: brandId },
    include: {
      recommendation: true,
      outcomes: true
    },
    orderBy: { created_at: 'desc' }
  })

  return NextResponse.json({ decisions })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { brandId, action, recommendationId, expectedOutcome, actionTaken, metricsChanged, success, decisionId } = body

  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })
  const access = await assertBrandAccess(brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (action === 'RECORD_OUTCOME' && decisionId) {
    const outcome = await prisma.decisionOutcome.create({
      data: {
        decision_history_id: decisionId,
        actualOutcome: actionTaken,
        metricsChanged: JSON.stringify(metricsChanged || {}),
        success: success === true,
      }
    })
    
    await prisma.decisionHistory.update({
      where: { id: decisionId },
      data: { status: success ? 'SUCCESS' : 'FAILED' }
    })

    return NextResponse.json({ outcome })
  }

  if (action === 'CREATE_DECISION') {
    const decision = await prisma.decisionHistory.create({
      data: {
        workspace_id: access.workspace_id,
        brand_id: brandId,
        user_id: session.user.id,
        recommendation_id: recommendationId || null,
        actionTaken: actionTaken || 'No action specified',
        expectedOutcome: expectedOutcome || 'No outcome specified',
        status: 'EXECUTED'
      }
    })
    return NextResponse.json({ decision })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
