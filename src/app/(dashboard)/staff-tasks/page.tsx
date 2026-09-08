'use client'

import { useState, useEffect, useMemo } from 'react'
import * as xlsx from 'xlsx'
import {
  CheckSquare,
  Square,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Download,
  Check,
  Sparkles,
  Zap,
  Info,
  Clock,
  Filter,
  Search,
  Users,
  Pin,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Layers,
  UserCheck,
  Lightbulb,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  X,
  Target,
  AlertTriangle,
  Flame,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Eye,
  ShoppingBag,
  ListTodo,
  Rocket,
  CheckCircle2,
  Smile,
  Moon,
  Sun,
  Sunrise,
  Inbox,
  ArrowDown,
  BookmarkCheck,
  Star,
  CornerDownRight,
  ArrowUpRight,
} from 'lucide-react'
import {
  StaffTaskItem,
  STAFF_LIST,
  StaffName,
  DAYS_OF_WEEK,
  DayOfWeek,
  TaskPriority,
  TaskStatus,
  TaskCategory,
  TASK_CATEGORIES_CONFIG,
  TASK_PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
  getMondayOfWeek,
  formatDateMMDDYY,
  formatDateIndonesian,
  getWeekDays,
  getTomorrowDay,
  isLearningTask,
  detectCategory,
  detectMarketplace,
  detectPriority,
  detectEstimatedMinutes,
  DAILY_ROUTINES,
  getTaskSOP,
  TaskSOP,
  sortTasksByPriority,
  isTaskOverdue,
} from '@/lib/staff-tasks-utils'

// Profil staff Shalwa & Nandila
const STAFF_PROFILES: Record<string, { role: string; avatarBg: string; initial: string; badge: string; sub: string }> = {
  Shalwa: {
    role: 'Marketplace Specialist (Tugas Saya)',
    avatarBg: '#2563eb',
    initial: 'SH',
    badge: 'Tugas Saya',
    sub: 'Fokus pada tugas harian & belajar workflow',
  },
  Nandila: {
    role: 'Asisten SPV (Referensi Belajar)',
    avatarBg: '#ea580c',
    initial: 'NA',
    badge: 'Referensi Belajar',
    sub: 'Gunakan sebagai acuan memahami pola kerja',
  },
}

export default function StaffTasksPage() {
  // Default: Shalwa selalu menjadi workspace utama
  const [selectedStaff, setSelectedStaff] = useState<StaffName>('Shalwa')
  // 4 Tab Navigasi Utama: 'TODAY' | 'TOMORROW' | 'WEEKLY' | 'BACKLOG' | 'DONE'
  const [activeTab, setActiveTab] = useState<'TODAY' | 'TOMORROW' | 'WEEKLY' | 'BACKLOG' | 'DONE'>('TODAY')

  // Hari yang lagi dibuka (Default: 'Senin')
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Senin')
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMondayOfWeek(new Date('2026-09-07T00:00:00Z')))

  const [tasks, setTasks] = useState<StaffTaskItem[]>([])
  const [weeklyNote, setWeeklyNote] = useState<string>('')
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false)
  const [noteSaveStatus, setNoteSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [loading, setLoading] = useState<boolean>(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('ALL')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [filterMarketplace, setFilterMarketplace] = useState<string>('ALL')

  // Quick Add Task: Teks & Destinasi Cepat
  const [quickInputText, setQuickInputText] = useState<string>('')
  const [quickAddTarget, setQuickAddTarget] = useState<'BACKLOG' | 'TODAY' | 'TOMORROW' | 'CUSTOM'>('BACKLOG')
  const [quickAddCustomDay, setQuickAddCustomDay] = useState<DayOfWeek>('Senin')

  // Modal Tambah / Edit Detail
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false)
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [formTaskText, setFormTaskText] = useState<string>('')
  const [formDescription, setFormDescription] = useState<string>('')
  const [formCategory, setFormCategory] = useState<TaskCategory>('PROMO')
  const [formPriority, setFormPriority] = useState<TaskPriority>('NORMAL')
  const [formMarketplace, setFormMarketplace] = useState<string>('Shopee')
  const [formPromoName, setFormPromoName] = useState<string>('')
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState<number>(45)
  const [formDayOfWeek, setFormDayOfWeek] = useState<DayOfWeek | 'Backlog'>('Senin')
  const [formDeadline, setFormDeadline] = useState<string>('')

  // Modal Terhambat (Block / Tertunda)
  const [blockingTask, setBlockingTask] = useState<StaffTaskItem | null>(null)
  const [blockedReasonInput, setBlockedReasonInput] = useState<string>('')

  // Focus Mode
  const [focusModeTask, setFocusModeTask] = useState<StaffTaskItem | null>(null)
  const [focusTimer, setFocusTimer] = useState<number>(0)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true)

  // Contekan SOP Modal
  const [activeSOPTask, setActiveSOPTask] = useState<{ text: string; sop: TaskSOP } | null>(null)

  // Fitur 🌙 Tutup Hari
  const [showCloseDayModal, setShowCloseDayModal] = useState<boolean>(false)
  const [closeDayDecisions, setCloseDayDecisions] = useState<
    Record<string, { target: 'TOMORROW' | 'DATE' | 'BACKLOG' | 'DISMISS'; day?: DayOfWeek }>
  >({})
  const [isSubmittingCloseDay, setIsSubmittingCloseDay] = useState<boolean>(false)

  // Fitur 🌤 Plan Besok: Modal Ambil dari Antrean & Hari Ini
  const [showBacklogPickerModal, setShowBacklogPickerModal] = useState<boolean>(false)
  const [showTodayPickerModal, setShowTodayPickerModal] = useState<boolean>(false)
  const [selectedTaskIdsToMove, setSelectedTaskIdsToMove] = useState<string[]>([])
  const [isMovingTasks, setIsMovingTasks] = useState<boolean>(false)

  const weekDays = useMemo(() => getWeekDays(currentMonday), [currentMonday])
  const activeDayObj = useMemo(
    () => weekDays.find((d) => d.day === selectedDay) || weekDays[0],
    [weekDays, selectedDay]
  )

  // Besok dinamis berdasarkan hari yang sedang dibuka
  const tomorrowDay = useMemo(() => getTomorrowDay(selectedDay), [selectedDay])
  const tomorrowDayObj = useMemo(
    () => weekDays.find((d) => d.day === tomorrowDay) || weekDays[1] || weekDays[0],
    [weekDays, tomorrowDay]
  )

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Tarik data tugas dari API
  const fetchTasks = async () => {
    setLoading(true)
    try {
      const weekStartStr = currentMonday.toISOString()
      const res = await fetch(
        `/api/staff-tasks?staffName=${encodeURIComponent(selectedStaff)}&weekStart=${encodeURIComponent(weekStartStr)}`
      )
      if (!res.ok) throw new Error('Gagal narik data tugas')
      const data = await res.json()
      setTasks(data.tasks || [])
      setWeeklyNote(data.weekly_note || '')
    } catch (err: any) {
      console.error(err)
      showToast('⚠️ Ada kendala saat menarik data to-do list.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [selectedStaff, currentMonday])

  // Stopwatch di Focus Mode
  useEffect(() => {
    let interval: any = null
    if (focusModeTask && isTimerRunning) {
      interval = setInterval(() => {
        setFocusTimer((prev) => prev + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [focusModeTask, isTimerRunning])

  // Simpan Catatan Mingguan
  const handleSaveWeeklyNote = async () => {
    setIsSavingNote(true)
    setNoteSaveStatus('saving')
    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_weekly_note',
          staffName: selectedStaff,
          weekStart: currentMonday.toISOString(),
          notes: weeklyNote,
        }),
      })
      if (!res.ok) throw new Error('Gagal nyimpen catatan')
      setNoteSaveStatus('saved')
      showToast('✅ Catatan penting mingguan berhasil tersimpan!')
      setTimeout(() => setNoteSaveStatus('idle'), 2500)
    } catch (err: any) {
      console.error(err)
      showToast('❌ Gagal nyimpen catatan.')
      setNoteSaveStatus('idle')
    } finally {
      setIsSavingNote(false)
    }
  }

  // Checklist Selesai / Belum (Toggle)
  const handleToggleTask = async (task: StaffTaskItem) => {
    const isNowDone = task.status !== 'DONE'
    const newStatus: TaskStatus = isNowDone ? 'DONE' : 'TODO'

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: newStatus, is_completed: isNowDone } : t
      )
    )

    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          action: 'update_status',
          status: newStatus,
        }),
      })
      if (!res.ok) throw new Error('Gagal update status')
      showToast(isNowDone ? '✅ Mantap! Task selesai dikerjakan.' : '↩️ Task dikembalikan ke daftar belum selesai.')
    } catch (err) {
      console.error(err)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: task.status, is_completed: task.is_completed } : t
        )
      )
      showToast('❌ Gagal mengubah status task')
    }
  }

  // Quick Add Task dengan Pilihan Destinasi
  const handleQuickAdd = async (overrideTarget?: 'BACKLOG' | 'TODAY' | 'TOMORROW' | 'CUSTOM') => {
    if (!quickInputText.trim()) return
    const text = quickInputText.trim()
    const target = overrideTarget || quickAddTarget

    let targetDayOfWeek: DayOfWeek | 'Backlog' = 'Backlog'
    let targetDateStr = 'Backlog'

    if (target === 'TODAY') {
      targetDayOfWeek = selectedDay
      targetDateStr = activeDayObj.dateStr
    } else if (target === 'TOMORROW') {
      targetDayOfWeek = tomorrowDay
      targetDateStr = tomorrowDayObj.dateStr
    } else if (target === 'CUSTOM') {
      targetDayOfWeek = quickAddCustomDay
      const customDayObj = weekDays.find((d) => d.day === quickAddCustomDay) || weekDays[0]
      targetDateStr = customDayObj.dateStr
    } else {
      // Default: Masukkan ke Antrean (Inbox) agar Hari Ini tidak penuh
      targetDayOfWeek = 'Backlog'
      targetDateStr = 'Backlog'
    }

    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffName: selectedStaff,
          weekStart: currentMonday.toISOString(),
          dayOfWeek: targetDayOfWeek,
          dateStr: targetDateStr,
          taskText: text,
          priority: detectPriority(text),
          category: detectCategory(text),
          marketplace: detectMarketplace(text),
          estimatedMinutes: detectEstimatedMinutes(text),
        }),
      })
      if (!res.ok) throw new Error('Gagal menambah task')
      const data = await res.json()
      setTasks((prev) => [...prev, data.task])
      setQuickInputText('')
      if (targetDayOfWeek === 'Backlog') {
        showToast('📥 Kerjaan baru disimpan di Antrean (Inbox)!')
      } else {
        showToast(`✅ Kerjaan berhasil ditambahkan ke hari ${targetDayOfWeek}!`)
      }
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal menambah task')
    }
  }

  // Submit modal tambah / edit detail
  const handleSaveTaskForm = async () => {
    if (!formTaskText.trim()) return

    if (modalMode === 'ADD') {
      try {
        const res = await fetch('/api/staff-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffName: selectedStaff,
            weekStart: currentMonday.toISOString(),
            dayOfWeek: formDayOfWeek,
            dateStr: formDayOfWeek === 'Backlog' ? 'Backlog' : activeDayObj.dateStr,
            taskText: formTaskText.trim(),
            description: formDescription.trim(),
            category: formCategory,
            priority: formPriority,
            marketplace: formMarketplace,
            promoName: formPromoName.trim() || undefined,
            estimatedMinutes: formEstimatedMinutes,
            deadline: formDeadline ? new Date(formDeadline).toISOString() : undefined,
          }),
        })
        if (!res.ok) throw new Error('Gagal bikin task')
        const data = await res.json()
        setTasks((prev) => [...prev, data.task])
        setShowTaskModal(false)
        showToast('✅ Kerjaan baru berhasil ditambahkan!')
      } catch (err) {
        console.error(err)
        showToast('❌ Gagal membuat kerjaan')
      }
    } else {
      if (!editingTaskId) return
      try {
        const res = await fetch('/api/staff-tasks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingTaskId,
            task_text: formTaskText.trim(),
            description: formDescription.trim(),
            category: formCategory,
            priority: formPriority,
            marketplace: formMarketplace,
            promo_name: formPromoName.trim() || null,
            estimated_minutes: formEstimatedMinutes,
            day_of_week: formDayOfWeek,
            deadline: formDeadline ? new Date(formDeadline).toISOString() : null,
          }),
        })
        if (!res.ok) throw new Error('Gagal update')
        const data = await res.json()
        setTasks((prev) => prev.map((t) => (t.id === editingTaskId ? data.task : t)))
        setShowTaskModal(false)
        showToast('✅ Kerjaan berhasil diupdate!')
      } catch (err) {
        console.error(err)
        showToast('❌ Gagal update')
      }
    }
  }

  // Buka modal edit
  const handleOpenEdit = (task: StaffTaskItem) => {
    setModalMode('EDIT')
    setEditingTaskId(task.id)
    setFormTaskText(task.task_text)
    setFormDescription(task.description || '')
    setFormCategory((task.category as TaskCategory) || 'PROMO')
    setFormPriority(task.priority || 'NORMAL')
    setFormMarketplace(task.marketplace || 'Shopee')
    setFormPromoName(task.promo_name || '')
    setFormEstimatedMinutes(task.estimated_minutes || 45)
    setFormDayOfWeek(task.day_of_week)
    setFormDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '')
    setShowTaskModal(true)
  }

  // Hapus tugas
  const handleDeleteTask = async (id: string) => {
    if (!confirm('Hapus task ini dari daftar?')) return
    try {
      const res = await fetch(`/api/staff-tasks?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal hapus')
      setTasks((prev) => prev.filter((t) => t.id !== id))
      showToast('🗑️ Task berhasil dihapus.')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal menghapus task')
    }
  }

  // Jadikan Fokus Utama Hari Ini (Promote)
  const handlePromoteToFocus = async (task: StaffTaskItem) => {
    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          priority: 'HIGH',
          status: 'TODO',
        }),
      })
      if (!res.ok) throw new Error('Gagal update fokus')
      const data = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)))
      showToast('⭐ Task dijadikan salah satu Fokus Utama!')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal menjadikan fokus')
    }
  }

  // Tandai terblokir / tertunda
  const handleConfirmBlock = async () => {
    if (!blockingTask) return
    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: blockingTask.id,
          action: 'block_task',
          blocked_reason: blockedReasonInput.trim() || 'Menunggu respon / konfirmasi dari pihak lain',
        }),
      })
      if (!res.ok) throw new Error('Gagal menunda')
      const data = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === blockingTask.id ? data.task : t)))
      setBlockingTask(null)
      setBlockedReasonInput('')
      showToast('⏸ Status task diubah menjadi Tertunda.')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal menentukan status tertunda')
    }
  }

  // Buka blokir (Unblock)
  const handleUnblockTask = async (task: StaffTaskItem) => {
    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          action: 'unblock_task',
        }),
      })
      if (!res.ok) throw new Error('Gagal buka blokir')
      const data = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)))
      showToast('✅ Kendala selesai! Task aktif kembali.')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal mengaktifkan task')
    }
  }

  // Jadwalkan tugas ke hari tertentu
  const handleScheduleTask = async (task: StaffTaskItem, targetDay: DayOfWeek | 'Backlog') => {
    const targetDateStr = targetDay === 'Backlog' ? 'Backlog' : (weekDays.find((d) => d.day === targetDay)?.dateStr || activeDayObj.dateStr)
    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          action: 'reschedule',
          day_of_week: targetDay,
          date_str: targetDateStr,
        }),
      })
      if (!res.ok) throw new Error('Gagal menjadwalkan')
      const data = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)))
      if (targetDay === 'Backlog') {
        showToast('📥 Task dipindahkan ke Antrean.')
      } else {
        showToast(`📅 Task dijadwalkan ke hari ${targetDay}!`)
      }
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal menjadwalkan task')
    }
  }

  // Submit Fitur 🌙 Tutup Hari
  const handleTutupHariSubmit = async () => {
    setIsSubmittingCloseDay(true)
    try {
      const itemsToUpdate = unfinishedTodayTasks.map((t) => {
        const dec = closeDayDecisions[t.id] || { target: 'TOMORROW' }
        if (dec.target === 'DISMISS') {
          return { id: t.id, target: 'DISMISS' }
        }
        if (dec.target === 'BACKLOG') {
          return { id: t.id, target: 'BACKLOG' }
        }
        if (dec.target === 'DATE') {
          const targetDay = dec.day || tomorrowDay
          const targetObj = weekDays.find((d) => d.day === targetDay) || tomorrowDayObj
          return { id: t.id, target: 'DATE', day_of_week: targetDay, date_str: targetObj.dateStr }
        }
        // Default: Besok
        return { id: t.id, target: 'TOMORROW', day_of_week: tomorrowDay, date_str: tomorrowDayObj.dateStr }
      })

      const res = await fetch('/api/staff-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_close_day',
          items: itemsToUpdate,
        }),
      })

      if (!res.ok) throw new Error('Gagal memproses tutup hari')
      await fetchTasks()
      setShowCloseDayModal(false)
      showToast('🌙 Selesai Tutup Hari! Mau cek Rencana Besok?')
      setActiveTab('TOMORROW')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal memproses tutup hari')
    } finally {
      setIsSubmittingCloseDay(false)
    }
  }

  // Pindahkan Batch Tasks ke Besok (Plan Besok)
  const handleMoveTasksToTomorrow = async (taskIds: string[]) => {
    if (taskIds.length === 0) return
    setIsMovingTasks(true)
    try {
      const itemsToUpdate = taskIds.map((id) => ({
        id,
        target: 'TOMORROW',
        day_of_week: tomorrowDay,
        date_str: tomorrowDayObj.dateStr,
      }))

      const res = await fetch('/api/staff-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_close_day',
          items: itemsToUpdate,
        }),
      })

      if (!res.ok) throw new Error('Gagal memindahkan task')
      await fetchTasks()
      setShowBacklogPickerModal(false)
      setShowTodayPickerModal(false)
      setSelectedTaskIdsToMove([])
      showToast(`🌤 ${taskIds.length} task berhasil dijadwalkan ke hari ${tomorrowDay}!`)
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal memindahkan task')
    } finally {
      setIsMovingTasks(false)
    }
  }

  // Mulai Focus Mode
  const handleStartFocusMode = (task: StaffTaskItem) => {
    setFocusModeTask(task)
    setFocusTimer(0)
    setIsTimerRunning(true)
  }

  // Selesaikan di Focus Mode & Lanjut ke task berikutnya
  const handleCompleteInFocusMode = async () => {
    if (!focusModeTask) return
    await handleToggleTask(focusModeTask)
    const nextCandidates = sortedNonLearningTasks.filter(
      (t) => t.id !== focusModeTask.id && t.status !== 'DONE' && t.status !== 'BLOCKED'
    )
    if (nextCandidates.length > 0) {
      setFocusModeTask(nextCandidates[0])
      setFocusTimer(0)
      showToast('🎯 Lanjut ke fokus prioritas berikutnya!')
    } else {
      setFocusModeTask(null)
      showToast('🎉 Keren banget! Semua tugas fokus hari ini sudah selesai!')
    }
  }

  // Lewati di Focus Mode
  const handleSkipInFocusMode = () => {
    if (!focusModeTask) return
    const nextCandidates = sortedNonLearningTasks.filter(
      (t) => t.id !== focusModeTask.id && t.status !== 'DONE' && t.status !== 'BLOCKED'
    )
    if (nextCandidates.length > 0) {
      setFocusModeTask(nextCandidates[0])
      setFocusTimer(0)
      showToast('↪️ Pindah ke task lain terlebih dahulu.')
    } else {
      setFocusModeTask(null)
    }
  }

  // Salin 5 kolom ke Google Sheets
  const handleCopyToSpreadsheet = () => {
    try {
      const dayTasksMap: Record<string, string[]> = {
        Senin: [],
        Selasa: [],
        Rabu: [],
        Kamis: [],
        Jumat: [],
      }

      weekDays.forEach((dayObj) => {
        dayTasksMap[dayObj.day] = tasks
          .filter((t) => t.day_of_week === dayObj.day)
          .map((t) => (t.status === 'DONE' ? `[DONE] ${t.task_text}` : t.task_text))
      })

      const maxRows = Math.max(...Object.values(dayTasksMap).map((arr) => arr.length), 1)
      const lines: string[] = []

      if (weeklyNote.trim()) {
        lines.push(`TO DO LIST MARKETPLACE - STAFF: ${selectedStaff.toUpperCase()}`)
        lines.push(`CATATAN PENTING MINGGUAN (ROW 249-250):`)
        lines.push(weeklyNote.replace(/\r?\n/g, ' | '))
        lines.push('')
      }

      const headerRow = weekDays.map((d) => `${d.day} (${d.dateStr})`).join('\t')
      lines.push(headerRow)

      for (let r = 0; r < maxRows; r++) {
        const rowCols = weekDays.map((d) => dayTasksMap[d.day][r] || '')
        lines.push(rowCols.join('\t'))
      }

      const tsvContent = lines.join('\n')
      navigator.clipboard.writeText(tsvContent)
      showToast('📋 Format spreadsheet disalin! Buka Google Sheets lalu tekan Ctrl + V.')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal menyalin ke clipboard.')
    }
  }

  // Export Excel .xlsx
  const handleExportExcel = () => {
    try {
      const dayTasksMap: Record<string, string[]> = {
        Senin: [],
        Selasa: [],
        Rabu: [],
        Kamis: [],
        Jumat: [],
      }

      weekDays.forEach((dayObj) => {
        dayTasksMap[dayObj.day] = tasks
          .filter((t) => t.day_of_week === dayObj.day)
          .map((t) => (t.status === 'DONE' ? `[DONE] ${t.task_text}` : t.task_text))
      })

      const maxRows = Math.max(...Object.values(dayTasksMap).map((arr) => arr.length), 1)
      const sheetData: any[][] = []

      sheetData.push([`TO DO LIST MARKETPLACE - STAFF: ${selectedStaff.toUpperCase()}`])
      sheetData.push([`PERIODE: ${weekDays[0].displayLabel} s/d ${weekDays[4].displayLabel}`])
      if (weeklyNote.trim()) {
        sheetData.push([`CATATAN PENTING MINGGUAN:`])
        const noteLines = weeklyNote.split('\n')
        noteLines.forEach((nl) => sheetData.push([nl]))
      }
      sheetData.push([])

      const headerRow = weekDays.map((d) => `${d.day} (${d.dateStr})`)
      sheetData.push(headerRow)

      for (let r = 0; r < maxRows; r++) {
        const row = weekDays.map((d) => dayTasksMap[d.day][r] || '')
        sheetData.push(row)
      }

      const worksheet = xlsx.utils.aoa_to_sheet(sheetData)
      worksheet['!cols'] = [{ wch: 38 }, { wch: 38 }, { wch: 38 }, { wch: 38 }, { wch: 38 }]

      const workbook = xlsx.utils.book_new()
      xlsx.utils.book_append_sheet(workbook, worksheet, `To-Do ${selectedStaff}`)

      const fileName = `To_Do_List_${selectedStaff}_${weekDays[0].dateStr.replace(/\//g, '-')}_sd_${weekDays[4].dateStr.replace(/\//g, '-')}.xlsx`
      xlsx.writeFile(workbook, fileName)
      showToast('📥 File Excel (.xlsx) berhasil diunduh!')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal mengunduh Excel.')
    }
  }

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (searchQuery.trim()) {
        const match =
          t.task_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (t.marketplace && t.marketplace.toLowerCase().includes(searchQuery.toLowerCase()))
        if (!match) return false
      }
      if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false
      if (filterCategory !== 'ALL' && t.category !== filterCategory) return false
      if (filterMarketplace !== 'ALL') {
        if (!t.marketplace || !t.marketplace.toLowerCase().includes(filterMarketplace.toLowerCase())) {
          return false
        }
      }
      return true
    })
  }, [tasks, searchQuery, filterPriority, filterCategory, filterMarketplace])

  // =========================================================================
  // DATA SLICES UNTUK HARI INI (TODAY)
  // =========================================================================
  const todayAllTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.day_of_week === selectedDay)
  }, [filteredTasks, selectedDay])

  // Pisahkan task belajar dan non-belajar
  const todayLearningTasks = useMemo(() => {
    return todayAllTasks.filter((t) => isLearningTask(t))
  }, [todayAllTasks])

  const todayNonLearningTasks = useMemo(() => {
    return todayAllTasks.filter((t) => !isLearningTask(t))
  }, [todayAllTasks])

  const sortedNonLearningTasks = useMemo(() => {
    return sortTasksByPriority(todayNonLearningTasks)
  }, [todayNonLearningTasks])

  // 🎯 3 Fokus Utama: Maksimal 3 task, non-belajar, status aktif, prioritas fleksibel
  const top3FocusTasks = useMemo(() => {
    return sortedNonLearningTasks
      .filter((t) => t.status !== 'DONE' && t.status !== 'BLOCKED')
      .slice(0, 3)
  }, [sortedNonLearningTasks])

  const top3FocusIds = useMemo(() => new Set(top3FocusTasks.map((t) => t.id)), [top3FocusTasks])

  // 📋 Kerjaan Lainnya: Non-belajar, bukan Top 3, non-blocked, non-done
  const regularTodayTasks = useMemo(() => {
    return sortedNonLearningTasks.filter(
      (t) => !top3FocusIds.has(t.id) && t.status !== 'BLOCKED' && t.status !== 'DONE'
    )
  }, [sortedNonLearningTasks, top3FocusIds])

  // ⏳ Lagi Ketahan
  const blockedTodayTasks = useMemo(() => {
    return todayAllTasks.filter((t) => t.status === 'BLOCKED')
  }, [todayAllTasks])

  // 🚨 Overdue
  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => isTaskOverdue(t))
  }, [tasks])

  // ✅ Selesai Hari Ini
  const completedTodayTasks = useMemo(() => {
    return todayAllTasks.filter((t) => t.status === 'DONE')
  }, [todayAllTasks])

  // Task Belum Selesai Hari Ini (untuk Tutup Hari & Carry-over)
  const unfinishedTodayTasks = useMemo(() => {
    return todayAllTasks.filter((t) => t.status !== 'DONE')
  }, [todayAllTasks])

  // Hitungan progress Hari Ini
  const todayActiveCount = todayAllTasks.filter((t) => t.status !== 'BLOCKED').length
  const todayDoneCount = completedTodayTasks.length
  const todayRemainingCount = Math.max(0, todayActiveCount - todayDoneCount)
  const todayPct = todayActiveCount > 0 ? Math.round((todayDoneCount / todayActiveCount) * 100) : 0

  // =========================================================================
  // DATA SLICES UNTUK BESOK (TOMORROW)
  // =========================================================================
  const tomorrowAllTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.day_of_week === tomorrowDay)
  }, [filteredTasks, tomorrowDay])

  const tomorrowLearningTasks = useMemo(() => {
    return tomorrowAllTasks.filter((t) => isLearningTask(t))
  }, [tomorrowAllTasks])

  const tomorrowNonLearningTasks = useMemo(() => {
    return tomorrowAllTasks.filter((t) => !isLearningTask(t))
  }, [tomorrowAllTasks])

  const sortedTomorrowTasks = useMemo(() => {
    return sortTasksByPriority(tomorrowNonLearningTasks)
  }, [tomorrowNonLearningTasks])

  const tomorrowTop3Tasks = useMemo(() => {
    return sortedTomorrowTasks
      .filter((t) => t.status !== 'DONE' && t.status !== 'BLOCKED')
      .slice(0, 3)
  }, [sortedTomorrowTasks])

  const tomorrowTop3Ids = useMemo(() => new Set(tomorrowTop3Tasks.map((t) => t.id)), [tomorrowTop3Tasks])

  const tomorrowRegularTasks = useMemo(() => {
    return sortedTomorrowTasks.filter(
      (t) => !tomorrowTop3Ids.has(t.id) && t.status !== 'BLOCKED' && t.status !== 'DONE'
    )
  }, [sortedTomorrowTasks, tomorrowTop3Ids])

  // =========================================================================
  // DATA SLICES UNTUK ANTREAN (BACKLOG) & SELESAI
  // =========================================================================
  const backlogTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.day_of_week === 'Backlog' && t.status !== 'DONE')
  }, [filteredTasks])

  const allCompletedTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status === 'DONE')
  }, [filteredTasks])

  const currentProfile = STAFF_PROFILES[selectedStaff] || STAFF_PROFILES.Shalwa

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Ranking icons
  const rankingBadges = ['🥇 Fokus #1', '🥈 Fokus #2', '🥉 Fokus #3']

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px 28px', color: '#0f172a' }}>
      {/* POPUP NOTIFIKASI TOAST */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13.5px',
            fontWeight: 500,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* HEADER UTAMA */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
          <span>Operasional</span>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Daily Planner & To-Do List</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: selectedStaff === 'Shalwa' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'linear-gradient(135deg, #ea580c, #f97316)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: selectedStaff === 'Shalwa' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : '0 4px 12px rgba(234, 88, 12, 0.25)',
                }}
              >
                <Target size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                    Personal Work Management
                  </h1>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: selectedStaff === 'Shalwa' ? '#dbeafe' : '#ffedd5',
                      color: selectedStaff === 'Shalwa' ? '#1d4ed8' : '#c2410c',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    {selectedStaff === 'Shalwa' ? 'Workspace Saya' : 'Mode Referensi'}
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
                  {selectedStaff === 'Shalwa'
                    ? 'Bantu Shalwa fokus pada tugas harian, belajar workflow, dan simpan ide tanpa pusing.'
                    : 'Referensi cara kerja & pola prioritas dari Nandila (Asisten SPV).'}
                </p>
              </div>
            </div>
          </div>

          {/* TOMBOL AKSI CEPAT HEADER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {selectedStaff === 'Shalwa' && (
              <button
                onClick={() => {
                  // Inisialisasi pilihan default tutup hari
                  const init: Record<string, { target: 'TOMORROW' | 'DATE' | 'BACKLOG' | 'DISMISS'; day?: DayOfWeek }> = {}
                  unfinishedTodayTasks.forEach((t) => {
                    init[t.id] = { target: 'TOMORROW' }
                  })
                  setCloseDayDecisions(init)
                  setShowCloseDayModal(true)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.25)',
                }}
                title="Review tugas belum selesai saat selesai kerja"
              >
                <Moon size={15} color="#38bdf8" />
                <span>🌙 Tutup Hari</span>
              </button>
            )}

            <button
              onClick={() => {
                setModalMode('ADD')
                setFormTaskText('')
                setFormDescription('')
                setFormCategory('PROMO')
                setFormPriority('NORMAL')
                setFormMarketplace('Shopee')
                setFormPromoName('')
                setFormEstimatedMinutes(45)
                setFormDayOfWeek(activeTab === 'BACKLOG' ? 'Backlog' : activeTab === 'TOMORROW' ? tomorrowDay : selectedDay)
                setFormDeadline('')
                setShowTaskModal(true)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Plus size={16} />
              <span>+ Tambah Task</span>
            </button>

            <button
              onClick={handleCopyToSpreadsheet}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #059669',
                color: '#059669',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Salin 5 kolom langsung tempel di Google Sheets (Ctrl+V)"
            >
              <Copy size={15} />
              <span>Salin ke Spreadsheet</span>
            </button>

            <button
              onClick={handleExportExcel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Download size={15} />
              <span>.xlsx</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 👤 WORKSPACE SWITCHER & TAB NAVIGASI                                      */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '8px 14px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        {/* WORKSPACE SWITCHER: SHALWA (Tugas Saya) vs NANDILA (Referensi Belajar) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', marginRight: '4px' }}>
            👤 WORKSPACE:
          </span>

          {/* Tombol Workspace Shalwa */}
          <button
            onClick={() => setSelectedStaff('Shalwa')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: selectedStaff === 'Shalwa' ? '2px solid #2563eb' : '1px solid #e2e8f0',
              backgroundColor: selectedStaff === 'Shalwa' ? '#eff6ff' : '#ffffff',
              color: selectedStaff === 'Shalwa' ? '#1e40af' : '#475569',
              fontSize: '13px',
              fontWeight: selectedStaff === 'Shalwa' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              SH
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', lineHeight: 1.15, fontWeight: 700 }}>Shalwa</div>
              <div style={{ fontSize: '10px', color: selectedStaff === 'Shalwa' ? '#2563eb' : '#94a3b8', fontWeight: 600 }}>
                Tugas Saya
              </div>
            </div>
          </button>

          {/* Tombol Workspace Nandila */}
          <button
            onClick={() => setSelectedStaff('Nandila')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: selectedStaff === 'Nandila' ? '2px solid #ea580c' : '1px solid #e2e8f0',
              backgroundColor: selectedStaff === 'Nandila' ? '#fff7ed' : '#ffffff',
              color: selectedStaff === 'Nandila' ? '#c2410c' : '#475569',
              fontSize: '13px',
              fontWeight: selectedStaff === 'Nandila' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: '#ea580c',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              NA
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', lineHeight: 1.15, fontWeight: 700 }}>Nandila</div>
              <div style={{ fontSize: '10px', color: selectedStaff === 'Nandila' ? '#ea580c' : '#94a3b8', fontWeight: 600 }}>
                Referensi Belajar
              </div>
            </div>
          </button>
        </div>

        {/* 4 TAB NAVIGASI UTAMA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* TAB 1: ☀️ Hari Ini */}
          <button
            onClick={() => setActiveTab('TODAY')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 15px',
              borderRadius: '8px',
              border: activeTab === 'TODAY' ? '1.5px solid #2563eb' : '1px solid transparent',
              backgroundColor: activeTab === 'TODAY' ? '#eff6ff' : 'transparent',
              color: activeTab === 'TODAY' ? '#1e40af' : '#475569',
              fontSize: '13px',
              fontWeight: activeTab === 'TODAY' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            <span>☀️ Hari Ini</span>
            <span
              style={{
                backgroundColor: activeTab === 'TODAY' ? '#2563eb' : '#e2e8f0',
                color: activeTab === 'TODAY' ? '#ffffff' : '#475569',
                fontSize: '11px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px',
              }}
            >
              {todayRemainingCount}
            </span>
          </button>

          {/* TAB 2: 🌤 Besok (Plan Besok Sederhana) */}
          <button
            onClick={() => setActiveTab('TOMORROW')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 15px',
              borderRadius: '8px',
              border: activeTab === 'TOMORROW' ? '1.5px solid #2563eb' : '1px solid transparent',
              backgroundColor: activeTab === 'TOMORROW' ? '#eff6ff' : 'transparent',
              color: activeTab === 'TOMORROW' ? '#1e40af' : '#475569',
              fontSize: '13px',
              fontWeight: activeTab === 'TOMORROW' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            <Sunrise size={14} />
            <span>🌤 Besok</span>
            {tomorrowAllTasks.length > 0 && (
              <span
                style={{
                  backgroundColor: activeTab === 'TOMORROW' ? '#2563eb' : '#e2e8f0',
                  color: activeTab === 'TOMORROW' ? '#ffffff' : '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                {tomorrowAllTasks.filter((t) => t.status !== 'DONE').length}
              </span>
            )}
          </button>

          {/* TAB 3: 📅 Plan Minggu Ini (Gambaran Fleksibel) */}
          <button
            onClick={() => setActiveTab('WEEKLY')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 15px',
              borderRadius: '8px',
              border: activeTab === 'WEEKLY' ? '1.5px solid #2563eb' : '1px solid transparent',
              backgroundColor: activeTab === 'WEEKLY' ? '#eff6ff' : 'transparent',
              color: activeTab === 'WEEKLY' ? '#1e40af' : '#475569',
              fontSize: '13px',
              fontWeight: activeTab === 'WEEKLY' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            <Calendar size={14} />
            <span>📅 Minggu Ini</span>
          </button>

          {/* TAB 4: 📥 Antrean / Backlog (Inbox Pekerjaan) */}
          <button
            onClick={() => setActiveTab('BACKLOG')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 15px',
              borderRadius: '8px',
              border: activeTab === 'BACKLOG' ? '1.5px solid #2563eb' : '1px solid transparent',
              backgroundColor: activeTab === 'BACKLOG' ? '#eff6ff' : 'transparent',
              color: activeTab === 'BACKLOG' ? '#1e40af' : '#475569',
              fontSize: '13px',
              fontWeight: activeTab === 'BACKLOG' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            <Inbox size={14} />
            <span>📥 Antrean</span>
            {backlogTasks.length > 0 && (
              <span
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                {backlogTasks.length}
              </span>
            )}
          </button>

          {/* TAB TAMBAHAN: Udah Kelar */}
          <button
            onClick={() => setActiveTab('DONE')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              border: activeTab === 'DONE' ? '1.5px solid #059669' : '1px solid transparent',
              backgroundColor: activeTab === 'DONE' ? '#ecfdf5' : 'transparent',
              color: activeTab === 'DONE' ? '#059669' : '#64748b',
              fontSize: '13px',
              fontWeight: activeTab === 'DONE' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            <Check size={14} />
            <span>Kelar ({allCompletedTasks.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ⚠️ DISCLAIMER WORKSPACE NANDILA (REFERENSI BELAJAR)                       */}
      {/* ========================================================================= */}
      {selectedStaff === 'Nandila' && (
        <div
          style={{
            backgroundColor: '#fff7ed',
            border: '1.5px solid #fed7aa',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#ea580c',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Eye size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#9a3412' }}>
                👀 Referensi Cara Kerja Nandila (Asisten SPV)
              </div>
              <div style={{ fontSize: '12.5px', color: '#c2410c', marginTop: '2px' }}>
                Gunakan sebagai referensi untuk memahami pola kerja dan cara prioritas Nandila, bukan sebagai tugas kamu.
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedStaff('Shalwa')}
            style={{
              padding: '7px 16px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #ea580c',
              color: '#ea580c',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ← Kembali ke Workspace Shalwa
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ☀️ LEVEL 1: HARI INI (DEFAULT VIEW)                                      */}
      {/* ========================================================================= */}
      {activeTab === 'TODAY' && (
        <div>
          {/* BANNER PROGRES HARI INI */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '18px 22px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                Selamat datang, {selectedStaff} 👋
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                <Calendar size={15} color="#2563eb" />
                <span style={{ fontWeight: 600 }}>{formatDateIndonesian(activeDayObj.date)}</span>
                <span>•</span>
                <span>{selectedStaff === 'Shalwa' ? 'Selesaikan 3 Fokus Utama dulu hari ini!' : 'Pola kerja Nandila'}</span>
              </div>
            </div>

            {/* PILIH HARI (SENIN S/D JUMAT) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
              {DAYS_OF_WEEK.map((d) => {
                const isSel = selectedDay === d
                const dayTCount = tasks.filter((t) => t.day_of_week === d && t.status !== 'DONE').length
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isSel ? '#ffffff' : 'transparent',
                      color: isSel ? '#0f172a' : '#64748b',
                      fontSize: '12.5px',
                      fontWeight: isSel ? 700 : 500,
                      cursor: 'pointer',
                      boxShadow: isSel ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>{d}</span>
                    {dayTCount > 0 && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          backgroundColor: isSel ? '#2563eb' : '#cbd5e1',
                          color: '#ffffff',
                          padding: '1px 5px',
                          borderRadius: '8px',
                        }}
                      >
                        {dayTCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* METERAN PROGRES */}
            <div style={{ minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>Progres Hari Ini</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: todayPct === 100 ? '#059669' : '#0f172a' }}>
                  {todayDoneCount} dari {todayActiveCount} task selesai
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${todayPct}%`,
                    height: '100%',
                    backgroundColor: todayPct === 100 ? '#059669' : '#2563eb',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', textAlign: 'right' }}>
                Sisa task: <strong style={{ color: todayRemainingCount > 0 ? '#ea580c' : '#059669' }}>{todayRemainingCount}</strong>
              </div>
            </div>
          </div>

          {/* PERINGATAN: KERJAAN LEWAT DEADLINE (OVERDUE) */}
          {overdueTasks.length > 0 && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertCircle size={17} color="#dc2626" />
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#991b1b' }}>
                  🚨 TUGAS MELEWATI DEADLINE ({overdueTasks.length} Task)
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      border: '1px solid #fca5a5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleToggleTask(task)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
                      >
                        <Square size={16} />
                      </button>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{task.task_text}</div>
                        <div style={{ fontSize: '11px', color: '#b91c1c' }}>
                          Batas waktu: {task.deadline ? new Date(task.deadline).toLocaleDateString('id-ID') : 'Kemarin'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handleScheduleTask(task, selectedDay)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: '#334155',
                          cursor: 'pointer',
                        }}
                      >
                        Pindahkan ke Hari Ini
                      </button>
                      <button
                        onClick={() => handleStartFocusMode(task)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ▶ Mulai
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 🎯 SECTION 1: 3 FOKUS UTAMA HARI INI                                     */}
          {/* ========================================================================= */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  🎯 3 FOKUS UTAMA HARI INI
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  Maksimal 3 Task
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Pilih fokus dan selesaikan satu per satu dengan tenang.
              </span>
            </div>

            {top3FocusTasks.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  color: '#059669',
                  fontSize: '13.5px',
                  fontWeight: 600,
                }}
              >
                🎉 Semua fokus utama hari ini sudah selesai! Kamu bisa lanjut ke tugas tambahan di bawah.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                {top3FocusTasks.map((task, idx) => {
                  const prioConf = TASK_PRIORITY_CONFIG[task.priority] || TASK_PRIORITY_CONFIG.NORMAL
                  const catConf = TASK_CATEGORIES_CONFIG[task.category as TaskCategory] || TASK_CATEGORIES_CONFIG.PROMO
                  const statusConf = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.TODO

                  return (
                    <div
                      key={task.id}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: task.priority === 'URGENT' ? '2px solid #f87171' : '1.5px solid #cbd5e1',
                        padding: '16px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        {/* Header Ranking & Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {/* Ranking Badge 🥇 🥈 🥉 */}
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                backgroundColor: '#f1f5f9',
                                color: '#0f172a',
                                padding: '2px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              {rankingBadges[idx] || `Fokus #${idx + 1}`}
                            </span>

                            {/* Priority Badge */}
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                backgroundColor: prioConf.bg,
                                color: prioConf.color,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <span>{prioConf.dot}</span>
                              <span>{prioConf.label}</span>
                            </span>

                            {/* Status Badge */}
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                backgroundColor: statusConf.bg,
                                color: statusConf.color,
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {statusConf.label}
                            </span>
                          </div>

                          {task.marketplace && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {task.marketplace}
                            </span>
                          )}
                        </div>

                        {/* Nama Task & Checkbox */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                          <button
                            onClick={() => handleToggleTask(task)}
                            style={{
                              border: 'none',
                              background: 'none',
                              padding: 0,
                              margin: '2px 0 0 0',
                              cursor: 'pointer',
                              color: '#94a3b8',
                              flexShrink: 0,
                            }}
                            title="Tandai selesai"
                          >
                            <Square size={18} />
                          </button>

                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
                              {task.task_text}
                            </div>
                            {task.description && (
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
                                {task.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Estimasi Waktu & Promo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: '#64748b', marginTop: '10px' }}>
                          {task.estimated_minutes && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={12} />
                              {task.estimated_minutes} Menit
                            </span>
                          )}
                          {task.promo_name && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#ea580c', fontWeight: 600 }}>
                              <Sparkles size={12} />
                              {task.promo_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tombol Aksi Kompak */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          marginTop: '14px',
                          paddingTop: '10px',
                          borderTop: '1px solid #f1f5f9',
                        }}
                      >
                        {/* Compact Mulai Button */}
                        <button
                          onClick={() => handleStartFocusMode(task)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#2563eb',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Play size={12} fill="#ffffff" />
                          <span>Mulai</span>
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => {
                              const sop = getTaskSOP(task.task_text)
                              setActiveSOPTask({ text: task.task_text, sop })
                            }}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                            title="Buka panduan SOP"
                          >
                            <Lightbulb size={12} color="#ea580c" />
                            <span>SOP</span>
                          </button>

                          <button
                            onClick={() => setBlockingTask(task)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #fde68a',
                              backgroundColor: '#fffbeb',
                              color: '#b45309',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                            }}
                            title="Tandai tertunda"
                          >
                            <Pause size={12} />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(task)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#64748b',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                            }}
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 📋 SECTION 2: KERJAAN LAINNYA HARI INI                                   */}
          {/* ========================================================================= */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  📋 KERJAAN LAINNYA
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {regularTodayTasks.length} Task
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Task tambahan yang masih perlu dikerjakan hari ini.
              </span>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {regularTodayTasks.length === 0 ? (
                <div style={{ padding: '18px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  Tidak ada kerjaan tambahan untuk hari ini.
                </div>
              ) : (
                regularTodayTasks.map((task) => {
                  const prioConf = TASK_PRIORITY_CONFIG[task.priority] || TASK_PRIORITY_CONFIG.NORMAL
                  const catConf = TASK_CATEGORIES_CONFIG[task.category as TaskCategory] || TASK_CATEGORIES_CONFIG.ROUTINE

                  return (
                    <div
                      key={task.id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '9px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <button
                          onClick={() => handleToggleTask(task)}
                          style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8' }}
                        >
                          <Square size={17} />
                        </button>

                        <span style={{ fontSize: '11px' }} title={`Prioritas: ${prioConf.label}`}>
                          {prioConf.dot}
                        </span>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{task.task_text}</span>
                        </div>

                        {/* Label Kategori & Marketplace */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              backgroundColor: catConf.bg,
                              color: catConf.color,
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {catConf.label}
                          </span>

                          {task.marketplace && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {task.marketplace}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tombol Kanan Kompak */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {task.estimated_minutes && (
                          <span style={{ fontSize: '11px', color: '#64748b', marginRight: '4px' }}>
                            {task.estimated_minutes}m
                          </span>
                        )}

                        <button
                          onClick={() => handleStartFocusMode(task)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '5px',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          title="Mulai di Focus Mode"
                        >
                          <Play size={10} fill="#1d4ed8" />
                          <span>Mulai</span>
                        </button>

                        {top3FocusTasks.length < 3 && (
                          <button
                            onClick={() => handlePromoteToFocus(task)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#ea580c',
                              cursor: 'pointer',
                              padding: '3px',
                            }}
                            title="Jadikan Fokus Utama"
                          >
                            <Star size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const sop = getTaskSOP(task.task_text)
                            setActiveSOPTask({ text: task.task_text, sop })
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#2563eb',
                            cursor: 'pointer',
                            padding: '3px',
                          }}
                          title="Lihat SOP"
                        >
                          <Lightbulb size={14} />
                        </button>

                        <button
                          onClick={() => setBlockingTask(task)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#d97706',
                            cursor: 'pointer',
                            padding: '3px',
                          }}
                          title="Tandai Tertunda"
                        >
                          <Pause size={14} />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(task)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '3px',
                          }}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '3px',
                          }}
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}

              {/* QUICK ADD TASK DENGAN PILIHAN DESTINASI CEPAT */}
              <div style={{ paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="+ Ketik kerjaan baru..."
                    value={quickInputText}
                    onChange={(e) => setQuickInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAdd()
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12.5px',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => handleQuickAdd()}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      backgroundColor: '#0f172a',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Simpan
                  </button>
                </div>

                {/* DESTINATION SELECTOR PILLS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>📍 Masukkan ke:</span>

                  <button
                    type="button"
                    onClick={() => setQuickAddTarget('BACKLOG')}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '6px',
                      border: quickAddTarget === 'BACKLOG' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: quickAddTarget === 'BACKLOG' ? '#eff6ff' : '#ffffff',
                      color: quickAddTarget === 'BACKLOG' ? '#1d4ed8' : '#475569',
                      fontSize: '11.5px',
                      fontWeight: quickAddTarget === 'BACKLOG' ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    📥 Antrean (Default)
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickAddTarget('TODAY')}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '6px',
                      border: quickAddTarget === 'TODAY' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: quickAddTarget === 'TODAY' ? '#eff6ff' : '#ffffff',
                      color: quickAddTarget === 'TODAY' ? '#1d4ed8' : '#475569',
                      fontSize: '11.5px',
                      fontWeight: quickAddTarget === 'TODAY' ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    ☀️ Hari Ini ({selectedDay})
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickAddTarget('TOMORROW')}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '6px',
                      border: quickAddTarget === 'TOMORROW' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: quickAddTarget === 'TOMORROW' ? '#eff6ff' : '#ffffff',
                      color: quickAddTarget === 'TOMORROW' ? '#1d4ed8' : '#475569',
                      fontSize: '11.5px',
                      fontWeight: quickAddTarget === 'TOMORROW' ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    🌤 Besok ({tomorrowDay})
                  </button>

                  <select
                    value={quickAddTarget === 'CUSTOM' ? quickAddCustomDay : ''}
                    onChange={(e) => {
                      setQuickAddTarget('CUSTOM')
                      setQuickAddCustomDay(e.target.value as DayOfWeek)
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: quickAddTarget === 'CUSTOM' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: quickAddTarget === 'CUSTOM' ? '#eff6ff' : '#ffffff',
                      color: quickAddTarget === 'CUSTOM' ? '#1d4ed8' : '#475569',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="" disabled>
                      📅 Pilih Hari...
                    </option>
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        Hari {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 📚 SECTION 3: BELAJAR & PRODUCT KNOWLEDGE                                 */}
          {/* ========================================================================= */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#7c3aed' }}>
                  📚 BELAJAR & PRODUCT KNOWLEDGE
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#f5f3ff',
                    color: '#7c3aed',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {todayLearningTasks.length} Materi
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Dikerjakan pas ada waktu senggang atau saat butuh materinya.
              </span>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1.5px solid #ddd6fe',
                padding: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {todayLearningTasks.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
                  Belum ada materi belajar yang dijadwalkan untuk hari ini.
                </div>
              ) : (
                todayLearningTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: '#f5f3ff',
                      border: '1px solid #ddd6fe',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <button
                        onClick={() => handleToggleTask(task)}
                        style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: '#7c3aed' }}
                      >
                        {task.status === 'DONE' ? <CheckSquare size={17} /> : <Square size={17} />}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: task.status === 'DONE' ? '#94a3b8' : '#4c1d95',
                            textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
                          }}
                        >
                          {task.task_text}
                        </div>
                        {task.description && (
                          <div style={{ fontSize: '11.5px', color: '#6d28d9', marginTop: '2px' }}>
                            {task.description}
                          </div>
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          backgroundColor: '#ede9fe',
                          color: '#6d28d9',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        Materi Belajar
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => {
                          const sop = getTaskSOP(task.task_text)
                          setActiveSOPTask({ text: task.task_text, sop })
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #c4b5fd',
                          color: '#6d28d9',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <BookOpen size={12} />
                        <span>Buka Materi</span>
                      </button>

                      {task.status !== 'DONE' && (
                        <button
                          onClick={() => handlePromoteToFocus(task)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#475569',
                            fontSize: '11.5px',
                            cursor: 'pointer',
                          }}
                          title="Jadikan Fokus Hari Ini"
                        >
                          ⭐ Fokuskan
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Arsipkan / Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ⏳ SECTION 4: LAGI KETAHAN / PENDING (NUNGGU PIHAK LAIN)                 */}
          {/* ========================================================================= */}
          {blockedTodayTasks.length > 0 && (
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1.5px solid #fef3c7',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} color="#d97706" />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#92400e' }}>
                    ⏸ TERTUNDA / MENUNGGU PIHAK LAIN ({blockedTodayTasks.length} Task)
                  </span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#b45309' }}>
                  Tidak dihitung beban aktif karena sedang menunggu respon pihak eksternal.
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {blockedTodayTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      border: '1px solid #fde68a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>{task.task_text}</div>
                      <div style={{ fontSize: '12px', color: '#b45309', marginTop: '2px', fontWeight: 500 }}>
                        Alasan tertunda: {task.blocked_reason || 'Menunggu kabar atau approval pihak lain'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnblockTask(task)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#d97706',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Udah Beres, Lanjut Kerjain!
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌤 LEVEL 1B: RENCANA BESOK (PLAN BESOK SEDERHANA)                        */}
      {/* ========================================================================= */}
      {activeTab === 'TOMORROW' && (
        <div>
          {/* HEADER RENCANA BESOK */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '18px 22px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Sunrise size={22} color="#ea580c" />
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  🌤 RENCANA BESOK ({tomorrowDay}, {tomorrowDayObj.dateStr})
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Pilih maksimal 3 fokus utama untuk besok agar paginya tidak bingung harus mulai dari mana.
              </p>
            </div>

            {/* QUICK ACTIONS PLAN BESOK */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setSelectedTaskIdsToMove([])
                  setShowBacklogPickerModal(true)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Inbox size={14} />
                <span>← Ambil dari Antrean</span>
              </button>

              <button
                onClick={() => {
                  setSelectedTaskIdsToMove([])
                  setShowTodayPickerModal(true)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={14} />
                <span>← Ambil Task Hari Ini</span>
              </button>

              <button
                onClick={() => {
                  setModalMode('ADD')
                  setFormTaskText('')
                  setFormDescription('')
                  setFormCategory('PROMO')
                  setFormPriority('NORMAL')
                  setFormMarketplace('Shopee')
                  setFormPromoName('')
                  setFormEstimatedMinutes(45)
                  setFormDayOfWeek(tomorrowDay)
                  setFormDeadline('')
                  setShowTaskModal(true)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                <span>+ Task Besok</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: 🎯 PILIH FOKUS BESOK (MAKSIMAL 3) */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  🎯 3 FOKUS UTAMA BESOK
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {tomorrowTop3Tasks.length} / 3 Terpilih
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Paling banyak 3 fokus utama agar target tercapai tanpa terbebani.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {tomorrowTop3Tasks.map((task, idx) => {
                const prioConf = TASK_PRIORITY_CONFIG[task.priority] || TASK_PRIORITY_CONFIG.NORMAL
                const catConf = TASK_CATEGORIES_CONFIG[task.category as TaskCategory] || TASK_CATEGORIES_CONFIG.PROMO

                return (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      padding: '16px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          backgroundColor: '#f1f5f9',
                          color: '#0f172a',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {rankingBadges[idx] || `Fokus #${idx + 1}`}
                      </span>

                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          backgroundColor: prioConf.bg,
                          color: prioConf.color,
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {prioConf.dot} {prioConf.label}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      {task.task_text}
                    </div>
                    {task.description && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                        {task.description}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '11.5px' }}>
                      <span style={{ color: '#64748b' }}>
                        {task.marketplace || 'Marketplace'} • {task.estimated_minutes || 45}m
                      </span>
                      <button
                        onClick={() => handleScheduleTask(task, 'Backlog')}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          fontSize: '11.5px',
                        }}
                      >
                        Kembalikan ke Antrean
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Slot Placeholder jika < 3 */}
              {Array.from({ length: Math.max(0, 3 - tomorrowTop3Tasks.length) }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1.5px dashed #cbd5e1',
                    padding: '24px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
                    {rankingBadges[tomorrowTop3Tasks.length + i] || 'Fokus Kosong'}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setShowBacklogPickerModal(true)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        fontSize: '11.5px',
                        color: '#2563eb',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + Pilih dari Antrean
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: 📋 TASK TAMBAHAN BESOK */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                📋 TASK TAMBAHAN BESOK ({tomorrowRegularTasks.length})
              </span>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {tomorrowRegularTasks.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  Belum ada task tambahan untuk besok.
                </div>
              ) : (
                tomorrowRegularTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{task.task_text}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handlePromoteToFocus(task)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          fontSize: '11px',
                          color: '#1d4ed8',
                          cursor: 'pointer',
                        }}
                      >
                        Jadikan Fokus
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 3: 📚 BELAJAR JIKA ADA WAKTU BESOK */}
          {tomorrowLearningTasks.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#7c3aed', marginBottom: '10px' }}>
                📚 BELAJAR JIKA ADA WAKTU BESOK ({tomorrowLearningTasks.length})
              </div>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1.5px solid #ddd6fe',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {tomorrowLearningTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: '#f5f3ff',
                      border: '1px solid #ddd6fe',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#4c1d95' }}>{task.task_text}</span>
                    <button
                      onClick={() => {
                        const sop = getTaskSOP(task.task_text)
                        setActiveSOPTask({ text: task.task_text, sop })
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #c4b5fd',
                        color: '#6d28d9',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Buka SOP
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📥 LEVEL 3: ANTREAN SAYA (INBOX PEKERJAAN)                                 */}
      {/* ========================================================================= */}
      {activeTab === 'BACKLOG' && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Inbox size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  📥 ANTREAN SAYA (Inbox Pekerjaan) ({backlogTasks.length} Task)
                </h3>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                Tempat menyimpan pekerjaan yang baru kepikiran, baru diberikan SPV, atau belum tahu kapan dikerjakan. Dijadwalkan pas kamu sudah siap!
              </p>
            </div>

            <button
              onClick={() => {
                setModalMode('ADD')
                setFormDayOfWeek('Backlog')
                setShowTaskModal(true)
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Tambah ke Antrean
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {backlogTasks.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                Kotak antrean kosong. Semua pekerjaan sudah terjadwal dengan rapi!
              </div>
            ) : (
              backlogTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>{task.task_text}</div>
                    {task.description && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{task.description}</div>
                    )}
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      Kategori: {task.category} • Estimasi: {task.estimated_minutes || 45} menit
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleScheduleTask(task, selectedDay)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ☀️ Kerjakan Hari Ini
                    </button>

                    <button
                      onClick={() => handleScheduleTask(task, tomorrowDay)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#fff7ed',
                        color: '#ea580c',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      🌤 Jadwalkan Besok
                    </button>

                    <select
                      onChange={(e) => {
                        if (e.target.value) handleScheduleTask(task, e.target.value as DayOfWeek)
                      }}
                      defaultValue=""
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="" disabled>
                        📅 Pilih Hari...
                      </option>
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          Hari {d}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title="Hapus"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📅 LEVEL 2: PLAN MINGGU INI (GAMBARAN FLEKSIBEL)                          */}
      {/* ========================================================================= */}
      {activeTab === 'WEEKLY' && (
        <div>
          {/* Box Catatan Penting Minggu Ini */}
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1.5px solid #fef3c7',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#92400e', marginBottom: '4px' }}>
                📌 Catatan Wajib Diingat Minggu Ini ({selectedStaff}) — Catatan Row 249-250 Spreadsheet
              </div>
              <textarea
                rows={2}
                value={weeklyNote}
                onChange={(e) => setWeeklyNote(e.target.value)}
                placeholder="Tulis instruksi mingguan penting (misal: gabungin pdp varian, non aktifkan diskon full month)..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #fde68a',
                  fontSize: '12.5px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
            <button
              onClick={handleSaveWeeklyNote}
              disabled={isSavingNote}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: noteSaveStatus === 'saved' ? '#059669' : '#d97706',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {noteSaveStatus === 'saved' ? 'Tersimpan!' : 'Simpan Catatan'}
            </button>
          </div>

          {/* Kolom 5 Hari Kompak (Gambaran Mingguan Tanpa Paksaan) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(230px, 1fr))',
              gap: '14px',
              overflowX: 'auto',
              paddingBottom: '20px',
            }}
          >
            {weekDays.map((dayObj) => {
              const dayTasks = tasks.filter((t) => t.day_of_week === dayObj.day)
              const prioTasks = dayTasks.filter((t) => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'BLOCKED')
              const normalTasks = dayTasks.filter((t) => (t.priority === 'NORMAL' || t.priority === 'LOW') && t.status !== 'BLOCKED')
              const blockedTasks = dayTasks.filter((t) => t.status === 'BLOCKED')

              const totalDone = dayTasks.filter((t) => t.status === 'DONE').length
              const totalActive = dayTasks.filter((t) => t.status !== 'BLOCKED').length

              return (
                <div
                  key={dayObj.day}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    minHeight: '480px',
                  }}
                >
                  {/* Header Kolom */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #1e293b, #334155)',
                      padding: '12px 14px',
                      borderTopLeftRadius: '11px',
                      borderTopRightRadius: '11px',
                      color: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase' }}>{dayObj.day}</span>
                      <span style={{ fontSize: '11px', opacity: 0.9 }}>{dayObj.dateStr}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', opacity: 0.85 }}>
                      <span>{totalDone}/{totalActive} Selesai</span>
                      <span>{totalActive > 0 ? Math.round((totalDone / totalActive) * 100) : 0}%</span>
                    </div>
                  </div>

                  {/* Kelompok Tugas */}
                  <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                    {dayTasks.length === 0 ? (
                      <div style={{ padding: '20px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                        Tidak ada task terjadwal
                      </div>
                    ) : (
                      <>
                        {/* 1. Prioritas Utama */}
                        {prioTasks.length > 0 && (
                          <div>
                            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#dc2626', marginBottom: '4px', textTransform: 'uppercase' }}>
                              🎯 Fokus ({prioTasks.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {prioTasks.map((t) => (
                                <div
                                  key={t.id}
                                  style={{
                                    backgroundColor: t.status === 'DONE' ? '#f8fafc' : '#fff7ed',
                                    border: t.status === 'DONE' ? '1px solid #e2e8f0' : '1px solid #fed7aa',
                                    borderRadius: '6px',
                                    padding: '5px 8px',
                                    fontSize: '11.5px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '6px',
                                  }}
                                >
                                  <button
                                    onClick={() => handleToggleTask(t)}
                                    style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: t.status === 'DONE' ? '#059669' : '#ea580c' }}
                                  >
                                    {t.status === 'DONE' ? <CheckSquare size={13} /> : <Square size={13} />}
                                  </button>
                                  <span
                                    style={{
                                      flex: 1,
                                      color: t.status === 'DONE' ? '#94a3b8' : '#0f172a',
                                      textDecoration: t.status === 'DONE' ? 'line-through' : 'none',
                                      fontWeight: t.status === 'DONE' ? 400 : 600,
                                    }}
                                  >
                                    {t.task_text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 2. Reguler */}
                        {normalTasks.length > 0 && (
                          <div>
                            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>
                              📋 Reguler ({normalTasks.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {normalTasks.map((t) => (
                                <div
                                  key={t.id}
                                  style={{
                                    backgroundColor: t.status === 'DONE' ? '#f8fafc' : '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    padding: '5px 8px',
                                    fontSize: '11.5px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '6px',
                                  }}
                                >
                                  <button
                                    onClick={() => handleToggleTask(t)}
                                    style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: t.status === 'DONE' ? '#059669' : '#94a3b8' }}
                                  >
                                    {t.status === 'DONE' ? <CheckSquare size={13} /> : <Square size={13} />}
                                  </button>
                                  <span
                                    style={{
                                      flex: 1,
                                      color: t.status === 'DONE' ? '#94a3b8' : '#334155',
                                      textDecoration: t.status === 'DONE' ? 'line-through' : 'none',
                                    }}
                                  >
                                    {t.task_text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 3. Tertunda */}
                        {blockedTasks.length > 0 && (
                          <div>
                            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#b45309', marginBottom: '4px', textTransform: 'uppercase' }}>
                              ⏸ Tertunda ({blockedTasks.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {blockedTasks.map((t) => (
                                <div
                                  key={t.id}
                                  style={{
                                    backgroundColor: '#fffbeb',
                                    border: '1px solid #fde68a',
                                    borderRadius: '6px',
                                    padding: '5px 8px',
                                    fontSize: '11px',
                                    color: '#92400e',
                                  }}
                                >
                                  ⏸ {t.task_text}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✔ TAB: UDAH KELAR (REKAP SELESAI)                                         */}
      {/* ========================================================================= */}
      {activeTab === 'DONE' && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#059669' }}>
              Tugas yang Telah Selesai 🎉 ({allCompletedTasks.length})
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
              Rekap seluruh pekerjaan yang sudah berhasil diselesaikan.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {allCompletedTasks.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                Belum ada task yang selesai hari ini.
              </div>
            ) : (
              allCompletedTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleToggleTask(task)}
                      style={{ border: 'none', background: 'none', color: '#059669', cursor: 'pointer' }}
                      title="Kembalikan ke belum selesai"
                    >
                      <CheckSquare size={16} />
                    </button>
                    <span style={{ fontSize: '13.5px', color: '#64748b', textDecoration: 'line-through' }}>
                      {task.task_text}
                    </span>
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Hari {task.day_of_week}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌙 MODAL: REVIEW TUTUP HARI                                               */}
      {/* ========================================================================= */}
      {showCloseDayModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '620px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#0f172a',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Moon size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    🌙 TUTUP HARI — {selectedDay} ({activeDayObj.dateStr})
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                    Review hasil kerja hari ini sebelum log off & tentukan kelanjutan task yang belum selesai.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCloseDayModal(false)}
                style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* SUMMARY STATS HARI INI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#ecfdf5', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#047857' }}>✅ Selesai</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#065f46', marginTop: '2px' }}>
                  {completedTodayTasks.length}
                </div>
              </div>

              <div style={{ backgroundColor: '#eff6ff', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#1d4ed8' }}>▶ Sedang Dikerjakan</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e40af', marginTop: '2px' }}>
                  {todayAllTasks.filter((t) => t.status === 'IN_PROGRESS').length}
                </div>
              </div>

              <div style={{ backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>📌 Belum Mulai</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#334155', marginTop: '2px' }}>
                  {todayAllTasks.filter((t) => t.status === 'TODO').length}
                </div>
              </div>
            </div>

            {/* DAFTAR TASK BELUM SELESAI */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  TASK BELUM SELESAI ({unfinishedTodayTasks.length})
                </span>
                {unfinishedTodayTasks.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        const nextDec: any = {}
                        unfinishedTodayTasks.forEach((t) => {
                          nextDec[t.id] = { target: 'TOMORROW' }
                        })
                        setCloseDayDecisions(nextDec)
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        fontSize: '11px',
                        color: '#1d4ed8',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Semua ke Besok
                    </button>

                    <button
                      onClick={() => {
                        const nextDec: any = {}
                        unfinishedTodayTasks.forEach((t) => {
                          nextDec[t.id] = { target: 'BACKLOG' }
                        })
                        setCloseDayDecisions(nextDec)
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        fontSize: '11px',
                        color: '#475569',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Semua ke Antrean
                    </button>
                  </div>
                )}
              </div>

              {unfinishedTodayTasks.length === 0 ? (
                <div style={{ padding: '24px', backgroundColor: '#ecfdf5', borderRadius: '10px', textAlign: 'center', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#065f46' }}>🎉 Keren banget, {selectedStaff}!</div>
                  <div style={{ fontSize: '13px', color: '#047857', marginTop: '4px' }}>
                    Semua task hari ini sudah selesai tuntas. Selamat beristirahat!
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {unfinishedTodayTasks.map((task) => {
                    const currentDec = closeDayDecisions[task.id] || { target: 'TOMORROW' }

                    return (
                      <div
                        key={task.id}
                        style={{
                          backgroundColor: '#f8fafc',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                          {task.task_text}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginRight: '4px' }}>
                            Pindahkan ke:
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setCloseDayDecisions((prev) => ({
                                ...prev,
                                [task.id]: { target: 'TOMORROW' },
                              }))
                            }
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: currentDec.target === 'TOMORROW' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                              backgroundColor: currentDec.target === 'TOMORROW' ? '#eff6ff' : '#ffffff',
                              color: currentDec.target === 'TOMORROW' ? '#1d4ed8' : '#475569',
                              fontSize: '11px',
                              fontWeight: currentDec.target === 'TOMORROW' ? 700 : 500,
                              cursor: 'pointer',
                            }}
                          >
                            🌤 Besok ({tomorrowDay})
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setCloseDayDecisions((prev) => ({
                                ...prev,
                                [task.id]: { target: 'BACKLOG' },
                              }))
                            }
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: currentDec.target === 'BACKLOG' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                              backgroundColor: currentDec.target === 'BACKLOG' ? '#eff6ff' : '#ffffff',
                              color: currentDec.target === 'BACKLOG' ? '#1d4ed8' : '#475569',
                              fontSize: '11px',
                              fontWeight: currentDec.target === 'BACKLOG' ? 700 : 500,
                              cursor: 'pointer',
                            }}
                          >
                            📥 Antrean
                          </button>

                          <select
                            value={currentDec.target === 'DATE' ? currentDec.day || '' : ''}
                            onChange={(e) =>
                              setCloseDayDecisions((prev) => ({
                                ...prev,
                                [task.id]: { target: 'DATE', day: e.target.value as DayOfWeek },
                              }))
                            }
                            style={{
                              padding: '3px 6px',
                              borderRadius: '4px',
                              border: currentDec.target === 'DATE' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                              backgroundColor: currentDec.target === 'DATE' ? '#eff6ff' : '#ffffff',
                              color: currentDec.target === 'DATE' ? '#1d4ed8' : '#475569',
                              fontSize: '11px',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="" disabled>
                              📅 Pilih Hari...
                            </option>
                            {DAYS_OF_WEEK.map((d) => (
                              <option key={d} value={d}>
                                Hari {d}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() =>
                              setCloseDayDecisions((prev) => ({
                                ...prev,
                                [task.id]: { target: 'DISMISS' },
                              }))
                            }
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: currentDec.target === 'DISMISS' ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                              backgroundColor: currentDec.target === 'DISMISS' ? '#fef2f2' : '#ffffff',
                              color: currentDec.target === 'DISMISS' ? '#b91c1c' : '#64748b',
                              fontSize: '11px',
                              fontWeight: currentDec.target === 'DISMISS' ? 700 : 500,
                              cursor: 'pointer',
                            }}
                          >
                            ✓ Tidak Perlu Lagi
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* TOMBOL MODAL FOOTER */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => setShowCloseDayModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
              <button
                onClick={handleTutupHariSubmit}
                disabled={isSubmittingCloseDay}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isSubmittingCloseDay ? 'Menyimpan...' : 'Simpan & Selesaikan Tutup Hari'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📥 MODAL: AMBIL DARI ANTREAN KE BESOK                                     */}
      {/* ========================================================================= */}
      {showBacklogPickerModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              padding: '22px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                ← Ambil Task dari Antrean untuk Besok ({tomorrowDay})
              </h3>
              <button
                onClick={() => setShowBacklogPickerModal(false)}
                style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {backlogTasks.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  Tidak ada task di Antrean.
                </div>
              ) : (
                backlogTasks.map((t) => {
                  const isChecked = selectedTaskIdsToMove.includes(t.id)
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTaskIdsToMove((prev) =>
                          isChecked ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                        )
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: isChecked ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: isChecked ? '#eff6ff' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      <input type="checkbox" checked={isChecked} onChange={() => {}} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{t.task_text}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Kategori: {t.category} • Estimasi: {t.estimated_minutes || 45}m
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowBacklogPickerModal(false)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                onClick={() => handleMoveTasksToTomorrow(selectedTaskIdsToMove)}
                disabled={isMovingTasks || selectedTaskIdsToMove.length === 0}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isMovingTasks ? 'Memindahkan...' : `Jadwalkan ${selectedTaskIdsToMove.length} Task ke Besok`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔄 MODAL: AMBIL DARI TASK HARI INI KE BESOK                              */}
      {/* ========================================================================= */}
      {showTodayPickerModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              padding: '22px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                ← Bawa Task Belum Selesai Hari Ini ke Besok ({tomorrowDay})
              </h3>
              <button
                onClick={() => setShowTodayPickerModal(false)}
                style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {unfinishedTodayTasks.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  Tidak ada task hari ini yang tersisa.
                </div>
              ) : (
                unfinishedTodayTasks.map((t) => {
                  const isChecked = selectedTaskIdsToMove.includes(t.id)
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTaskIdsToMove((prev) =>
                          isChecked ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                        )
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: isChecked ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: isChecked ? '#eff6ff' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      <input type="checkbox" checked={isChecked} onChange={() => {}} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{t.task_text}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Prioritas: {t.priority} • Status: {t.status}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowTodayPickerModal(false)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                onClick={() => handleMoveTasksToTomorrow(selectedTaskIdsToMove)}
                disabled={isMovingTasks || selectedTaskIdsToMove.length === 0}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isMovingTasks ? 'Memindahkan...' : `Bawa ${selectedTaskIdsToMove.length} Task ke Besok`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎯 FOCUS MODE (DISTRACTION-FREE WORKSPACE)                                 */}
      {/* ========================================================================= */}
      {focusModeTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '30px 40px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Header Focus */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Target size={20} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.02em' }}>MODE FOKUS</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Kerjakan satu task ini dengan tuntas tanpa distraksi.</div>
              </div>
            </div>

            <button
              onClick={() => setFocusModeTask(null)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              ✕ Kembali ke Daftar
            </button>
          </div>

          {/* Kartu Inti Focus */}
          <div style={{ maxWidth: '720px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                }}
              >
                {focusModeTask.priority}
              </span>
              {focusModeTask.marketplace && (
                <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', fontSize: '12px', padding: '3px 10px', borderRadius: '12px' }}>
                  {focusModeTask.marketplace}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 12px 0', lineHeight: 1.3 }}>
              {focusModeTask.task_text}
            </h1>

            {focusModeTask.description && (
              <p style={{ fontSize: '15px', color: '#cbd5e1', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                {focusModeTask.description}
              </p>
            )}

            {/* Stopwatch */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.08)', padding: '12px 24px', borderRadius: '40px', marginBottom: '28px' }}>
              <Clock size={20} color="#38bdf8" />
              <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                {formatTimer(focusTimer)}
              </span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}
              >
                {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>

            {/* Panduan SOP */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '18px', textAlign: 'left', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={14} />
                <span>Panduan SOP Eksekusi:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#e2e8f0', lineHeight: 1.6 }}>
                {getTaskSOP(focusModeTask.task_text).steps.slice(0, 3).map((st, i) => (
                  <li key={i}>{st}</li>
                ))}
              </ul>
            </div>

            {/* Tombol Aksi */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={handleCompleteInFocusMode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 28px',
                  borderRadius: '10px',
                  backgroundColor: '#059669',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)',
                }}
              >
                <Check size={18} />
                <span>Selesaikan & Lanjut</span>
              </button>

              <button
                onClick={() => {
                  setBlockingTask(focusModeTask)
                  setFocusModeTask(null)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#fbbf24',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Pause size={16} />
                <span>Tertunda</span>
              </button>

              <button
                onClick={handleSkipInFocusMode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <SkipForward size={16} />
                <span>Lewati</span>
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
            Klik 'Selesaikan & Lanjut' jika pengaturan di Seller Centre / sistem sudah selesai.
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT TASK                                                 */}
      {/* ========================================================================= */}
      {showTaskModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '540px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                {modalMode === 'ADD' ? '+ Buat Task Baru' : 'Edit Task'}
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Nama Kerjaan */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                Nama Task *
              </label>
              <input
                type="text"
                placeholder="Contoh: Setup Flash Sale Toko Shopee 8-10 September"
                value={formTaskText}
                onChange={(e) => setFormTaskText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Keterangan */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                Catatan / Detail Tambahan
              </label>
              <textarea
                rows={2}
                placeholder="Tulis SKU target, batas diskon, atau instruksi pimpinan..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Prioritas & Kategori */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Tingkat Prioritas (Default: Normal)
                </label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="NORMAL">🔵 Normal (Default)</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="URGENT">🔴 Urgent</option>
                  <option value="LOW">⚪ Low</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Kategori Task
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as TaskCategory)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="ROUTINE">🔄 Rutinitas Harian</option>
                  <option value="PROMO">🔥 Promo & Campaign</option>
                  <option value="PROJECT">🚀 Project Toko</option>
                  <option value="MONITORING">📊 Monitoring & Cek</option>
                  <option value="LEARNING">📚 Materi & Belajar</option>
                  <option value="URGENT">🚨 Darurat / Cepat</option>
                </select>
              </div>
            </div>

            {/* Marketplace & Hari */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Marketplace / Platform
                </label>
                <select
                  value={formMarketplace}
                  onChange={(e) => setFormMarketplace(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="Shopee">Shopee Pusat</option>
                  <option value="Shopee Cabang">Shopee Cabang Semarang</option>
                  <option value="Lazada">Lazada</option>
                  <option value="TikTok Shop">TikTok Shop</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="MyEssent">MyEssent ERP</option>
                  <option value="All">Semua Marketplace</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Jadwal Pengerjaan
                </label>
                <select
                  value={formDayOfWeek}
                  onChange={(e) => setFormDayOfWeek(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                  }}
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      Hari {d}
                    </option>
                  ))}
                  <option value="Backlog">📥 Masukkan ke Antrean (Inbox)</option>
                </select>
              </div>
            </div>

            {/* Promo & Estimasi Menit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Nama Promo Terkait
                </label>
                <input
                  type="text"
                  placeholder="Misal: Flash Sale September"
                  value={formPromoName}
                  onChange={(e) => setFormPromoName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Estimasi Waktu (Menit)
                </label>
                <input
                  type="number"
                  value={formEstimatedMinutes}
                  onChange={(e) => setFormEstimatedMinutes(parseInt(e.target.value) || 30)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Tombol Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowTaskModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                onClick={handleSaveTaskForm}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {modalMode === 'ADD' ? 'Simpan Task' : 'Update Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TERTUNDA / BLOCK REASON                                            */}
      {/* ========================================================================= */}
      {blockingTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '460px',
              padding: '22px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <AlertTriangle size={20} color="#d97706" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Tandai Sebagai Tertunda
              </h3>
            </div>

            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 14px 0', lineHeight: 1.4 }}>
              Mengapa task <strong>"{blockingTask.task_text}"</strong> belum dapat dilanjutkan?
            </p>

            <textarea
              rows={3}
              placeholder="Contoh: Menunggu approval harga promo dari Finance, atau menunggu materi banner..."
              value={blockedReasonInput}
              onChange={(e) => setBlockedReasonInput(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid #fde68a',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#fffbeb',
                marginBottom: '16px',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setBlockingTask(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmBlock}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#d97706',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Tandai Tertunda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PANDUAN CARA NGERJAIN (SOP & MATERI)                               */}
      {/* ========================================================================= */}
      {activeSOPTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '580px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <BookOpen size={18} />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    Platform: {activeSOPTask.sop.platform}
                  </span>
                  <h3 style={{ margin: '3px 0 0 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    {activeSOPTask.text}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setActiveSOPTask(null)}
                style={{
                  border: 'none',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Sasaran Task */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                🎯 Tujuan Task:
              </div>
              <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.45 }}>
                {activeSOPTask.sop.objective}
              </div>
            </div>

            {/* Langkah Eksekusi */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                📋 Langkah-langkah Eksekusi:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeSOPTask.sop.steps.map((st, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: '#334155' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: '1px',
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>{st}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parameter Kunci */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                ⚙️ Acuan Parameter Kunci:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#475569' }}>
                {activeSOPTask.sop.parameters.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>

            {/* Tips Eksekusi */}
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '10px 12px', borderRadius: '8px', marginBottom: '18px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#b45309', marginBottom: '2px' }}>
                💡 Tips Praktis:
              </div>
              <div style={{ fontSize: '12px', color: '#78350f' }}>{activeSOPTask.sop.tips}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setActiveSOPTask(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  backgroundColor: '#0f172a',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Paham & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
