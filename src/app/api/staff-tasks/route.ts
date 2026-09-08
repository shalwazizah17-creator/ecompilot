import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertBrandAccess } from '@/lib/auth/assert-brand-access'
import {
  getMondayOfWeek,
  getWeekDays,
  detectCategory,
  detectMarketplace,
  detectPriority,
  detectEstimatedMinutes,
  INITIAL_STAFF_TASKS_SEED_V2,
  DayOfWeek,
  STAFF_LIST,
  PROMO_WORKFLOW_TEMPLATES,
  sortTasksByPriority,
  isTaskOverdue,
} from '@/lib/staff-tasks-utils'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const brandIdParam = searchParams.get('brandId')
    const staffName = searchParams.get('staffName') || 'Shalwa'
    const weekStartParam = searchParams.get('weekStart')

    // Resolve brand access
    let brand = await assertBrandAccess(brandIdParam)
    if (!brand) {
      brand = await prisma.brand.findFirst()
    }
    if (!brand) return NextResponse.json({ error: 'No brand found' }, { status: 404 })

    // Resolve Monday of the week
    const targetDate = weekStartParam ? new Date(weekStartParam) : new Date('2026-09-07T00:00:00Z')
    const monday = getMondayOfWeek(targetDate)
    const weekDays = getWeekDays(monday)

    // Check count of tasks for this brand, staff, and week
    const existingCount = await prisma.staffTask.count({
      where: {
        brand_id: brand.id,
        staff_name: staffName,
        week_start: monday,
      },
    })

    // Auto-seed if empty and exists in V2 seed catalog
    if (existingCount === 0 && (INITIAL_STAFF_TASKS_SEED_V2 as any)[staffName]) {
      const seed = (INITIAL_STAFF_TASKS_SEED_V2 as any)[staffName]

      // Create weekly note if not existing
      const existingNote = await prisma.staffWeeklyNote.findUnique({
        where: {
          brand_id_staff_name_week_start: {
            brand_id: brand.id,
            staff_name: staffName,
            week_start: monday,
          },
        },
      })

      if (!existingNote && seed.notes) {
        await prisma.staffWeeklyNote.create({
          data: {
            brand_id: brand.id,
            staff_name: staffName,
            week_start: monday,
            notes: seed.notes,
          },
        })
      }

      // Create rich V2 seed tasks
      for (let i = 0; i < seed.tasks.length; i++) {
        const item = seed.tasks[i]
        await prisma.staffTask.create({
          data: {
            brand_id: brand.id,
            staff_name: staffName,
            week_start: monday,
            day_of_week: item.day_of_week,
            date_str: item.date_str,
            task_text: item.task_text,
            description: item.description || null,
            category: item.category,
            priority: item.priority,
            status: item.status,
            marketplace: item.marketplace || null,
            promo_name: item.promo_name || null,
            promo_stage: item.promo_stage || null,
            deadline: item.deadline ? new Date(item.deadline) : null,
            estimated_minutes: item.estimated_minutes,
            blocked_reason: item.blocked_reason || null,
            is_completed: item.is_completed || item.status === 'DONE',
            completed_at: item.is_completed || item.status === 'DONE' ? new Date() : null,
            order_index: i,
          },
        })
      }
    }

    // Fetch all tasks for this staff: both for this week and backlog tasks
    const rawTasks = await prisma.staffTask.findMany({
      where: {
        brand_id: brand.id,
        staff_name: staffName,
        OR: [{ week_start: monday }, { day_of_week: 'Backlog' }],
      },
      orderBy: [{ order_index: 'asc' }, { created_at: 'asc' }],
    })

    // Backfill enrichment for any task missing priority/status
    const tasks = rawTasks.map((t) => {
      let priority = t.priority
      let status = t.status
      let category = t.category || detectCategory(t.task_text)
      let marketplace = t.marketplace || detectMarketplace(t.task_text)
      let estimated_minutes = t.estimated_minutes || detectEstimatedMinutes(t.task_text)

      if (t.is_completed && status !== 'DONE') {
        status = 'DONE'
      }
      if (!priority || priority === 'NORMAL') {
        priority = detectPriority(t.task_text)
      }

      return {
        ...t,
        category,
        priority: priority as any,
        status: status as any,
        marketplace,
        estimated_minutes,
      }
    })

    // Fetch weekly note
    const weeklyNote = await prisma.staffWeeklyNote.findUnique({
      where: {
        brand_id_staff_name_week_start: {
          brand_id: brand.id,
          staff_name: staffName,
          week_start: monday,
        },
      },
    })

    // Calculate Personal Dashboard Statistics
    // Today tasks: default to Senin (or today if matching)
    const todayTasks = tasks.filter((t) => t.day_of_week === 'Senin')
    const todayActive = todayTasks.filter((t) => t.status !== 'BLOCKED')
    const todayDone = todayTasks.filter((t) => t.status === 'DONE')
    const todayInProgress = todayTasks.filter((t) => t.status === 'IN_PROGRESS')
    const todayBlocked = todayTasks.filter((t) => t.status === 'BLOCKED')
    const todayOverdue = todayTasks.filter((t) => isTaskOverdue(t as any))

    const weekTasks = tasks.filter((t) => t.day_of_week !== 'Backlog')
    const weekDone = weekTasks.filter((t) => t.status === 'DONE')
    const backlogTasks = tasks.filter((t) => t.day_of_week === 'Backlog')

    const stats = {
      today: {
        total: todayActive.length,
        completed: todayDone.length,
        in_progress: todayInProgress.length,
        blocked: todayBlocked.length,
        overdue: todayOverdue.length,
        remaining: Math.max(0, todayActive.length - todayDone.length),
        pct: todayActive.length > 0 ? Math.round((todayDone.length / todayActive.length) * 100) : 0,
      },
      week: {
        total: weekTasks.length,
        completed: weekDone.length,
        remaining: Math.max(0, weekTasks.length - weekDone.length),
        pct: weekTasks.length > 0 ? Math.round((weekDone.length / weekTasks.length) * 100) : 0,
      },
      backlog_count: backlogTasks.length,
    }

    return NextResponse.json({
      brand_id: brand.id,
      staff_name: staffName,
      week_start: monday.toISOString(),
      days: weekDays,
      tasks,
      weekly_note: weeklyNote?.notes || '',
      stats,
      all_staff: STAFF_LIST,
    })
  } catch (error: any) {
    console.error('Error fetching staff tasks:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch staff tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, brandId, staffName, weekStart } = body

    let brand = await assertBrandAccess(brandId)
    if (!brand) {
      brand = await prisma.brand.findFirst()
    }
    if (!brand) return NextResponse.json({ error: 'No brand found' }, { status: 404 })

    const targetDate = weekStart ? new Date(weekStart) : new Date('2026-09-07T00:00:00Z')
    const monday = getMondayOfWeek(targetDate)

    if (action === 'batch_promo_workflow') {
      // Create full workflow package (Preparation + Monitoring + Evaluation) for a promo
      const { promoType, promoName, targetDay } = body
      const template = PROMO_WORKFLOW_TEMPLATES[promoType] || PROMO_WORKFLOW_TEMPLATES['Flash Sale Toko']
      const weekDays = getWeekDays(monday)
      const dayObj = weekDays.find((d) => d.day === (targetDay || 'Senin')) || weekDays[0]

      const createdTasks = []

      // Preparation tasks -> Target Day
      for (let i = 0; i < template.preparation.length; i++) {
        const item = template.preparation[i]
        const t = await prisma.staffTask.create({
          data: {
            brand_id: brand.id,
            staff_name: staffName,
            week_start: monday,
            day_of_week: dayObj.day,
            date_str: dayObj.dateStr,
            task_text: item.text,
            category: 'PROMO',
            priority: item.priority,
            status: 'TODO',
            promo_name: promoName || promoType,
            promo_stage: 'PREPARATION',
            estimated_minutes: item.est,
            order_index: i,
          },
        })
        createdTasks.push(t)
      }

      // Monitoring tasks -> Next Day
      const nextDayIdx = Math.min(weekDays.indexOf(dayObj) + 1, 4)
      const monitorDay = weekDays[nextDayIdx]
      for (let i = 0; i < template.monitoring.length; i++) {
        const item = template.monitoring[i]
        const t = await prisma.staffTask.create({
          data: {
            brand_id: brand.id,
            staff_name: staffName,
            week_start: monday,
            day_of_week: monitorDay.day,
            date_str: monitorDay.dateStr,
            task_text: item.text,
            category: 'MONITORING',
            priority: item.priority,
            status: 'TODO',
            promo_name: promoName || promoType,
            promo_stage: 'MONITORING',
            estimated_minutes: item.est,
            order_index: 20 + i,
          },
        })
        createdTasks.push(t)
      }

      // Evaluation tasks -> Friday
      const evalDay = weekDays[4] // Jumat
      for (let i = 0; i < template.evaluation.length; i++) {
        const item = template.evaluation[i]
        const t = await prisma.staffTask.create({
          data: {
            brand_id: brand.id,
            staff_name: staffName,
            week_start: monday,
            day_of_week: evalDay.day,
            date_str: evalDay.dateStr,
            task_text: item.text,
            category: 'MONITORING',
            priority: item.priority,
            status: 'TODO',
            promo_name: promoName || promoType,
            promo_stage: 'EVALUATION',
            estimated_minutes: item.est,
            order_index: 40 + i,
          },
        })
        createdTasks.push(t)
      }

      return NextResponse.json({ success: true, count: createdTasks.length, tasks: createdTasks })
    }

    if (action === 'batch_routine') {
      const { dayOfWeek } = body
      const weekDays = getWeekDays(monday)
      const daysToAdd = dayOfWeek ? weekDays.filter((d) => d.day === dayOfWeek) : weekDays
      const createdTasks = []

      for (const dayObj of daysToAdd) {
        const count = await prisma.staffTask.count({
          where: {
            brand_id: brand.id,
            staff_name: staffName,
            week_start: monday,
            day_of_week: dayObj.day,
          },
        })

        const items = [
          { text: 'balas chat di shopee pusat dan cabang + balas chat wa reseller/ maklon', cat: 'ROUTINE', prio: 'NORMAL', est: 30 },
          { text: 'Login wa komunitas, blast 1 video di 2 grup wa>>', cat: 'ROUTINE', prio: 'NORMAL', est: 30 },
          { text: 'add 1 mitra maklon baru ke my essent', cat: 'PROJECT', prio: 'NORMAL', est: 30 },
          { text: 'ganti pdp etalase varian di marketplace', cat: 'PROJECT', prio: 'HIGH', est: 60 },
          { text: 'cek campaign dan setting flash sale toko', cat: 'PROMO', prio: 'HIGH', est: 45 },
        ]

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const task = await prisma.staffTask.create({
            data: {
              brand_id: brand.id,
              staff_name: staffName,
              week_start: monday,
              day_of_week: dayObj.day,
              date_str: dayObj.dateStr,
              task_text: item.text,
              category: item.cat,
              priority: item.prio as any,
              status: 'TODO',
              estimated_minutes: item.est,
              is_recurring: true,
              order_index: count + i,
            },
          })
          createdTasks.push(task)
        }
      }

      return NextResponse.json({ success: true, count: createdTasks.length })
    }

    // Default: Create single task
    const {
      dayOfWeek,
      dateStr,
      taskText,
      description,
      category,
      priority,
      status,
      marketplace,
      promoName,
      promoStage,
      deadline,
      estimatedMinutes,
    } = body

    if (!taskText || !taskText.trim()) {
      return NextResponse.json({ error: 'Nama tugas wajib diisi' }, { status: 400 })
    }

    const currentCount = await prisma.staffTask.count({
      where: {
        brand_id: brand.id,
        staff_name: staffName,
        week_start: monday,
        day_of_week: dayOfWeek || 'Backlog',
      },
    })

    const task = await prisma.staffTask.create({
      data: {
        brand_id: brand.id,
        staff_name: staffName,
        week_start: monday,
        day_of_week: dayOfWeek || 'Backlog',
        date_str: dateStr || (dayOfWeek === 'Backlog' ? 'Backlog' : '09/07/26'),
        task_text: taskText.trim(),
        description: description?.trim() || null,
        category: category || detectCategory(taskText.trim()),
        priority: priority || detectPriority(taskText.trim()),
        status: status || 'TODO',
        marketplace: marketplace || detectMarketplace(taskText.trim()),
        promo_name: promoName || null,
        promo_stage: promoStage || null,
        deadline: deadline ? new Date(deadline) : null,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : detectEstimatedMinutes(taskText.trim()),
        is_completed: status === 'DONE',
        completed_at: status === 'DONE' ? new Date() : null,
        order_index: currentCount,
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating staff task:', error)
    return NextResponse.json({ error: error.message || 'Failed to create task' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'update_weekly_note') {
      const { brandId, staffName, weekStart, notes } = body
      let brand = await assertBrandAccess(brandId)
      if (!brand) brand = await prisma.brand.findFirst()
      if (!brand) return NextResponse.json({ error: 'No brand found' }, { status: 404 })

      const targetDate = weekStart ? new Date(weekStart) : new Date('2026-09-07T00:00:00Z')
      const monday = getMondayOfWeek(targetDate)

      const updated = await prisma.staffWeeklyNote.upsert({
        where: {
          brand_id_staff_name_week_start: {
            brand_id: brand.id,
            staff_name: staffName,
            week_start: monday,
          },
        },
        update: { notes: notes || '' },
        create: {
          brand_id: brand.id,
          staff_name: staffName,
          week_start: monday,
          notes: notes || '',
        },
      })

      return NextResponse.json({ success: true, note: updated })
    }

    const { id } = body
    if (!id) return NextResponse.json({ error: 'ID task wajib disertakan' }, { status: 400 })

    if (action === 'update_status') {
      const { status } = body
      const isDone = status === 'DONE'

      const updated = await prisma.staffTask.update({
        where: { id },
        data: {
          status,
          is_completed: isDone,
          completed_at: isDone ? new Date() : null,
        },
      })
      return NextResponse.json({ success: true, task: updated })
    }

    if (action === 'block_task') {
      const { blocked_reason } = body
      const updated = await prisma.staffTask.update({
        where: { id },
        data: {
          status: 'BLOCKED',
          blocked_reason: blocked_reason || 'Menunggu approval / konfirmasi',
        },
      })
      return NextResponse.json({ success: true, task: updated })
    }

    if (action === 'unblock_task') {
      const updated = await prisma.staffTask.update({
        where: { id },
        data: {
          status: 'TODO',
          blocked_reason: null,
        },
      })
      return NextResponse.json({ success: true, task: updated })
    }

    if (action === 'reschedule') {
      const { day_of_week, date_str, deadline } = body
      const updateData: any = { day_of_week, date_str }
      if (deadline) updateData.deadline = new Date(deadline)

      const updated = await prisma.staffTask.update({
        where: { id },
        data: updateData,
      })
      return NextResponse.json({ success: true, task: updated })
    }

    if (action === 'batch_close_day') {
      const { items } = body // items: Array<{ id: string, target: 'TOMORROW' | 'DATE' | 'BACKLOG' | 'DISMISS', day_of_week?: string, date_str?: string }>
      if (!Array.isArray(items)) {
        return NextResponse.json({ error: 'items harus berupa array' }, { status: 400 })
      }
      const results = []
      for (const item of items) {
        if (item.target === 'DISMISS') {
          await prisma.staffTask.delete({ where: { id: item.id } }).catch(() => null)
          results.push({ id: item.id, action: 'dismissed' })
        } else if (item.target === 'BACKLOG') {
          const updated = await prisma.staffTask.update({
            where: { id: item.id },
            data: { day_of_week: 'Backlog', date_str: 'Backlog' },
          }).catch(() => null)
          if (updated) results.push(updated)
        } else if (item.day_of_week && item.date_str) {
          const updated = await prisma.staffTask.update({
            where: { id: item.id },
            data: { day_of_week: item.day_of_week, date_str: item.date_str },
          }).catch(() => null)
          if (updated) results.push(updated)
        }
      }
      return NextResponse.json({ success: true, count: results.length })
    }

    // Generic Update
    const {
      task_text,
      description,
      category,
      priority,
      status,
      marketplace,
      promo_name,
      promo_stage,
      deadline,
      estimated_minutes,
      actual_minutes,
      blocked_reason,
      is_completed,
    } = body

    const updateData: any = {}
    if (typeof task_text === 'string') updateData.task_text = task_text.trim()
    if (typeof description !== 'undefined') updateData.description = description ? description.trim() : null
    if (category) updateData.category = category
    if (priority) updateData.priority = priority
    if (status) {
      updateData.status = status
      if (status === 'DONE') {
        updateData.is_completed = true
        updateData.completed_at = new Date()
      } else {
        updateData.is_completed = false
        updateData.completed_at = null
      }
    }
    if (typeof is_completed === 'boolean') {
      updateData.is_completed = is_completed
      updateData.status = is_completed ? 'DONE' : 'TODO'
      updateData.completed_at = is_completed ? new Date() : null
    }
    if (marketplace) updateData.marketplace = marketplace
    if (promo_name) updateData.promo_name = promo_name
    if (promo_stage) updateData.promo_stage = promo_stage
    if (deadline) updateData.deadline = new Date(deadline)
    if (typeof estimated_minutes === 'number') updateData.estimated_minutes = estimated_minutes
    if (typeof actual_minutes === 'number') updateData.actual_minutes = actual_minutes
    if (typeof blocked_reason !== 'undefined') updateData.blocked_reason = blocked_reason

    const updatedTask = await prisma.staffTask.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, task: updatedTask })
  } catch (error: any) {
    console.error('Error updating staff task:', error)
    return NextResponse.json({ error: error.message || 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID wajib disertakan' }, { status: 400 })

    await prisma.staffTask.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting staff task:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete task' }, { status: 500 })
  }
}
