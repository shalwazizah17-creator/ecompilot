import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertBrandAccess } from '@/lib/auth/assert-brand-access'
import {
  getMondayOfWeek,
  getWeekDays,
  detectCategory,
  INITIAL_STAFF_TASKS_SEED,
  DayOfWeek,
  STAFF_LIST,
} from '@/lib/staff-tasks-utils'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const brandIdParam = searchParams.get('brandId')
    const staffName = searchParams.get('staffName') || 'Nandila'
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

    // Check if tasks exist for this brand, staff, and week
    const existingCount = await prisma.staffTask.count({
      where: {
        brand_id: brand.id,
        staff_name: staffName,
        week_start: monday,
      },
    })

    // Auto-seed if empty and exists in seed catalog
    if (existingCount === 0 && INITIAL_STAFF_TASKS_SEED[staffName]) {
      const seed = INITIAL_STAFF_TASKS_SEED[staffName]

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

      // Create tasks for each day
      for (const dayObj of weekDays) {
        const dayKey = dayObj.day as DayOfWeek
        const taskTexts = seed.tasks[dayKey] || []

        for (let i = 0; i < taskTexts.length; i++) {
          const taskText = taskTexts[i]
          await prisma.staffTask.create({
            data: {
              brand_id: brand.id,
              staff_name: staffName,
              week_start: monday,
              day_of_week: dayObj.day,
              date_str: dayObj.dateStr,
              task_text: taskText,
              category: detectCategory(taskText),
              is_completed: false,
              order_index: i,
            },
          })
        }
      }
    }

    // Fetch tasks
    const tasks = await prisma.staffTask.findMany({
      where: {
        brand_id: brand.id,
        staff_name: staffName,
        week_start: monday,
      },
      orderBy: [{ day_of_week: 'asc' }, { order_index: 'asc' }, { created_at: 'asc' }],
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

    return NextResponse.json({
      brand_id: brand.id,
      staff_name: staffName,
      week_start: monday.toISOString(),
      days: weekDays,
      tasks,
      weekly_note: weeklyNote?.notes || '',
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

    if (action === 'batch_routine') {
      // Add standard daily routines for a specific day or all week
      const { dayOfWeek, routines } = body
      const weekDays = getWeekDays(monday)
      const daysToAdd = dayOfWeek ? weekDays.filter((d) => d.day === dayOfWeek) : weekDays
      const createdTasks = []

      for (const dayObj of daysToAdd) {
        const currentCount = await prisma.staffTask.count({
          where: {
            brand_id: brand.id,
            staff_name: staffName,
            week_start: monday,
            day_of_week: dayObj.day,
          },
        })

        const items = routines && Array.isArray(routines) && routines.length > 0
          ? routines
          : ['Chat shopee', 'Chat wa', 'blast komunitas wa', 'add mitra maklon', 'ganti pdp etalase varian']

        for (let i = 0; i < items.length; i++) {
          const text = items[i]
          const task = await prisma.staffTask.create({
            data: {
              brand_id: brand.id,
              staff_name: staffName,
              week_start: monday,
              day_of_week: dayObj.day,
              date_str: dayObj.dateStr,
              task_text: text,
              category: detectCategory(text),
              is_completed: false,
              order_index: currentCount + i,
            },
          })
          createdTasks.push(task)
        }
      }

      return NextResponse.json({ success: true, count: createdTasks.length, tasks: createdTasks })
    }

    if (action === 'clone_previous_week') {
      // Clone uncompleted tasks or all tasks from previous week
      const prevMonday = new Date(monday)
      prevMonday.setDate(prevMonday.getDate() - 7)

      const prevTasks = await prisma.staffTask.findMany({
        where: {
          brand_id: brand.id,
          staff_name: staffName,
          week_start: prevMonday,
        },
      })

      if (prevTasks.length === 0) {
        return NextResponse.json({ error: 'Tidak ada tugas dari minggu sebelumnya untuk disalin.' }, { status: 400 })
      }

      const weekDays = getWeekDays(monday)
      const dayMap = new Map(weekDays.map((d) => [d.day, d.dateStr]))
      const createdTasks = []

      for (const pt of prevTasks) {
        const newDateStr = dayMap.get(pt.day_of_week) || pt.date_str
        const newTask = await prisma.staffTask.create({
          data: {
            brand_id: brand.id,
            staff_name: staffName,
            week_start: monday,
            day_of_week: pt.day_of_week,
            date_str: newDateStr,
            task_text: pt.task_text,
            category: pt.category,
            is_completed: false, // reset completion
            order_index: pt.order_index,
          },
        })
        createdTasks.push(newTask)
      }

      return NextResponse.json({ success: true, count: createdTasks.length })
    }

    // Default: create single task
    const { dayOfWeek, dateStr, taskText, category } = body
    if (!taskText || !taskText.trim()) {
      return NextResponse.json({ error: 'Teks tugas wajib diisi' }, { status: 400 })
    }

    const currentCount = await prisma.staffTask.count({
      where: {
        brand_id: brand.id,
        staff_name: staffName,
        week_start: monday,
        day_of_week: dayOfWeek,
      },
    })

    const task = await prisma.staffTask.create({
      data: {
        brand_id: brand.id,
        staff_name: staffName,
        week_start: monday,
        day_of_week: dayOfWeek,
        date_str: dateStr,
        task_text: taskText.trim(),
        category: category || detectCategory(taskText.trim()),
        is_completed: false,
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
      if (!brand) {
        brand = await prisma.brand.findFirst()
      }
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

    // Default: update task
    const { id, is_completed, task_text, category } = body
    if (!id) return NextResponse.json({ error: 'ID task wajib disertakan' }, { status: 400 })

    const updateData: any = {}
    if (typeof is_completed === 'boolean') updateData.is_completed = is_completed
    if (typeof task_text === 'string') {
      updateData.task_text = task_text.trim()
      if (!category) updateData.category = detectCategory(task_text.trim())
    }
    if (category) updateData.category = category

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

    await prisma.staffTask.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting staff task:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete task' }, { status: 500 })
  }
}
