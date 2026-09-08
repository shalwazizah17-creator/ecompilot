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

// Profil staff Shalwa & Nandila dengan bahasa santai
const STAFF_PROFILES: Record<string, { role: string; avatarBg: string; initial: string; badge: string }> = {
  Shalwa: {
    role: 'Marketplace Specialist (Promo, Bundling & Campaign)',
    avatarBg: '#2563eb',
    initial: 'SH',
    badge: 'Specialist',
  },
  Nandila: {
    role: 'Senior Specialist (Shopee, Lazada & Maklon)',
    avatarBg: '#ea580c',
    initial: 'NA',
    badge: 'Senior Specialist',
  },
}

export default function StaffTasksPage() {
  const [selectedStaff, setSelectedStaff] = useState<StaffName>('Shalwa')
  // Tab Level: 'TODAY' | 'WEEKLY' | 'BACKLOG' | 'DONE'
  const [activeTab, setActiveTab] = useState<'TODAY' | 'WEEKLY' | 'BACKLOG' | 'DONE'>('TODAY')

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

  // Quick input tugas harian
  const [quickInputText, setQuickInputText] = useState<string>('')

  // Modal Tambah / Edit
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false)
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [formTaskText, setFormTaskText] = useState<string>('')
  const [formDescription, setFormDescription] = useState<string>('')
  const [formCategory, setFormCategory] = useState<TaskCategory>('PROMO')
  const [formPriority, setFormPriority] = useState<TaskPriority>('HIGH')
  const [formMarketplace, setFormMarketplace] = useState<string>('Shopee')
  const [formPromoName, setFormPromoName] = useState<string>('')
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState<number>(45)
  const [formDayOfWeek, setFormDayOfWeek] = useState<DayOfWeek | 'Backlog'>('Senin')
  const [formDeadline, setFormDeadline] = useState<string>('')

  // Modal Terhambat (Block)
  const [blockingTask, setBlockingTask] = useState<StaffTaskItem | null>(null)
  const [blockedReasonInput, setBlockedReasonInput] = useState<string>('')

  // Focus Mode
  const [focusModeTask, setFocusModeTask] = useState<StaffTaskItem | null>(null)
  const [focusTimer, setFocusTimer] = useState<number>(0)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true)

  // Contekan SOP Modal
  const [activeSOPTask, setActiveSOPTask] = useState<{ text: string; sop: TaskSOP } | null>(null)

  const weekDays = useMemo(() => getWeekDays(currentMonday), [currentMonday])
  const activeDayObj = useMemo(
    () => weekDays.find((d) => d.day === selectedDay) || weekDays[0],
    [weekDays, selectedDay]
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
      showToast('⚠️ Ada kendala pas narik data kerjaan lo.')
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
      showToast('✅ Catatan penting mingguan lo udah tersimpan!')
      setTimeout(() => setNoteSaveStatus('idle'), 2500)
    } catch (err: any) {
      console.error(err)
      showToast('❌ Gagal nyimpen catatan.')
      setNoteSaveStatus('idle')
    } finally {
      setIsSavingNote(false)
    }
  }

  // Checklist Selesai / Belum
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
      showToast(isNowDone ? '🎉 Mantap! Kerjaan kelar!' : '↩️ Kerjaan dibalikin ke daftar to-do')
    } catch (err) {
      console.error(err)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: task.status, is_completed: task.is_completed } : t
        )
      )
      showToast('❌ Gagal ngubah status kerjaan')
    }
  }

  // Tambah tugas cepat hari ini (inline)
  const handleQuickAddToday = async () => {
    if (!quickInputText.trim()) return
    const text = quickInputText.trim()
    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffName: selectedStaff,
          weekStart: currentMonday.toISOString(),
          dayOfWeek: selectedDay,
          dateStr: activeDayObj.dateStr,
          taskText: text,
          priority: detectPriority(text),
          category: detectCategory(text),
          marketplace: detectMarketplace(text),
          estimatedMinutes: detectEstimatedMinutes(text),
        }),
      })
      if (!res.ok) throw new Error('Gagal nambah tugas')
      const data = await res.json()
      setTasks((prev) => [...prev, data.task])
      setQuickInputText('')
      showToast(`✅ Kerjaan berhasil ditambah ke hari ${selectedDay}!`)
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal nambah tugas')
    }
  }

  // Submit modal tambah / edit
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
        if (!res.ok) throw new Error('Gagal bikin tugas')
        const data = await res.json()
        setTasks((prev) => [...prev, data.task])
        setShowTaskModal(false)
        showToast('✅ Kerjaan baru berhasil ditambah!')
      } catch (err) {
        console.error(err)
        showToast('❌ Gagal bikin kerjaan')
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
    if (!confirm('Yakin mau hapus kerjaan ini?')) return
    try {
      const res = await fetch(`/api/staff-tasks?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal hapus')
      setTasks((prev) => prev.filter((t) => t.id !== id))
      showToast('🗑️ Kerjaan berhasil dihapus.')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal menghapus kerjaan')
    }
  }

  // Tandai terblokir / ketahan
  const handleConfirmBlock = async () => {
    if (!blockingTask) return
    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: blockingTask.id,
          action: 'block_task',
          blocked_reason: blockedReasonInput.trim() || 'Lagi nunggu respon / persetujuan dari pihak luar',
        }),
      })
      if (!res.ok) throw new Error('Gagal memblokir')
      const data = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === blockingTask.id ? data.task : t)))
      setBlockingTask(null)
      setBlockedReasonInput('')
      showToast('⏳ Kerjaan dipindahin ke daftar "Lagi Ketahan".')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal nentuin status ketahan')
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
      showToast('✅ Mantap! Hambatan udah beres, kerjaan aktif lagi!')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal ngebuka blokir')
    }
  }

  // Jadwalkan tugas dari Backlog ke hari tertentu
  const handleScheduleTask = async (task: StaffTaskItem, targetDay: DayOfWeek) => {
    const targetObj = weekDays.find((d) => d.day === targetDay) || weekDays[0]
    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          action: 'reschedule',
          day_of_week: targetDay,
          date_str: targetObj.dateStr,
        }),
      })
      if (!res.ok) throw new Error('Gagal menjadwalkan')
      const data = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)))
      showToast(`📅 Kerjaan berhasil dijadwalin ke hari ${targetDay}!`)
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal menjadwalkan kerjaan')
    }
  }

  // Gas Focus Mode
  const handleStartFocusMode = (task: StaffTaskItem) => {
    setFocusModeTask(task)
    setFocusTimer(0)
    setIsTimerRunning(true)
  }

  // Selesaikan di Focus Mode & lanjut kerjaan berikutnya
  const handleCompleteInFocusMode = async () => {
    if (!focusModeTask) return
    await handleToggleTask(focusModeTask)
    const nextCandidates = sortedTodayTasks.filter(
      (t) => t.id !== focusModeTask.id && t.status !== 'DONE' && t.status !== 'BLOCKED'
    )
    if (nextCandidates.length > 0) {
      setFocusModeTask(nextCandidates[0])
      setFocusTimer(0)
      showToast('🎯 Gas lanjut ke kerjaan prioritas selanjutnya!')
    } else {
      setFocusModeTask(null)
      showToast('🎉 Keren banget! Semua kerjaan prioritas hari ini kelar tuntas!')
    }
  }

  // Lewati di Focus Mode
  const handleSkipInFocusMode = () => {
    if (!focusModeTask) return
    const nextCandidates = sortedTodayTasks.filter(
      (t) => t.id !== focusModeTask.id && t.status !== 'DONE' && t.status !== 'BLOCKED'
    )
    if (nextCandidates.length > 0) {
      setFocusModeTask(nextCandidates[0])
      setFocusTimer(0)
      showToast('↪️ Pindah ke kerjaan lain dulu.')
    } else {
      setFocusModeTask(null)
    }
  }

  // Salin format 5 kolom ke Google Sheets
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
      showToast('📋 Udah disalin! Buka Google Sheets terus tekan Ctrl + V ya.')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal nyalin ke clipboard.')
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
      showToast('📥 File Excel (.xlsx) udah berhasil diunduh!')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal download Excel.')
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

  // Slice untuk Hari Ini
  const todayAllTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.day_of_week === selectedDay)
  }, [filteredTasks, selectedDay])

  const sortedTodayTasks = useMemo(() => {
    return sortTasksByPriority(todayAllTasks)
  }, [todayAllTasks])

  // 3 Tugas Teratas (Urgent/High)
  const topPriorityTasks = useMemo(() => {
    return sortedTodayTasks
      .filter((t) => t.status !== 'DONE' && t.status !== 'BLOCKED')
      .slice(0, 3)
  }, [sortedTodayTasks])

  const topPriorityIds = useMemo(() => new Set(topPriorityTasks.map((t) => t.id)), [topPriorityTasks])

  // Tugas Reguler Hari Ini
  const regularTodayTasks = useMemo(() => {
    return sortedTodayTasks.filter(
      (t) => !topPriorityIds.has(t.id) && t.status !== 'BLOCKED' && t.status !== 'DONE'
    )
  }, [sortedTodayTasks, topPriorityIds])

  // Tugas Lagi Ketahan
  const blockedTodayTasks = useMemo(() => {
    return todayAllTasks.filter((t) => t.status === 'BLOCKED')
  }, [todayAllTasks])

  // Tugas Lewat Deadline
  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => isTaskOverdue(t))
  }, [tasks])

  // Tugas Udah Beres Hari Ini
  const completedTodayTasks = useMemo(() => {
    return todayAllTasks.filter((t) => t.status === 'DONE')
  }, [todayAllTasks])

  // Backlog
  const backlogTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.day_of_week === 'Backlog' && t.status !== 'DONE')
  }, [filteredTasks])

  // Seluruh Tugas Beres
  const allCompletedTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status === 'DONE')
  }, [filteredTasks])

  // Hitungan progres
  const todayActiveCount = todayAllTasks.filter((t) => t.status !== 'BLOCKED').length
  const todayDoneCount = completedTodayTasks.length
  const todayPct = todayActiveCount > 0 ? Math.round((todayDoneCount / todayActiveCount) * 100) : 0

  const currentProfile = STAFF_PROFILES[selectedStaff] || {
    role: 'Specialist',
    avatarBg: '#2563eb',
    initial: selectedStaff.slice(0, 2).toUpperCase(),
    badge: 'Specialist',
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

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
          <span>Growth</span>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Daily Planner Tim Marketplace</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                }}
              >
                <Target size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                    Daily Planner & To-Do List Tim Marketplace
                  </h1>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#dbeafe',
                      color: '#1d4ed8',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    Biar Ga Pusing
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
                  Biar kerjaan lo ga numpuk & lo tau mana yang kudu digas duluan hari ini!
                </p>
              </div>
            </div>
          </div>

          {/* TOMBOL AKSI CEPAT */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setModalMode('ADD')
                setFormTaskText('')
                setFormDescription('')
                setFormCategory('PROMO')
                setFormPriority('HIGH')
                setFormMarketplace('Shopee')
                setFormPromoName('')
                setFormEstimatedMinutes(45)
                setFormDayOfWeek(activeTab === 'BACKLOG' ? 'Backlog' : selectedDay)
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
              <span>+ Tambah Kerjaan</span>
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
              <span>Salin ke Spreadsheet (1-Click)</span>
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
              <span>Download .xlsx</span>
            </button>
          </div>
        </div>
      </div>

      {/* SWITCHER AKUN STAFF & TAB NAVIGASI */}
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
        {/* PILIH AKUN (SHALWA & NANDILA) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600, marginRight: '4px' }}>
            Akun Lo:
          </span>
          {STAFF_LIST.map((staff) => {
            const isSel = selectedStaff === staff
            const prof = STAFF_PROFILES[staff]
            return (
              <button
                key={staff}
                onClick={() => setSelectedStaff(staff)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: isSel ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: isSel ? '#eff6ff' : '#ffffff',
                  color: isSel ? '#1e40af' : '#475569',
                  fontSize: '13px',
                  fontWeight: isSel ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isSel ? '#2563eb' : prof.avatarBg,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {prof.initial}
                </div>
                <span>{staff}</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: isSel ? '#2563eb' : '#f1f5f9',
                    color: isSel ? '#ffffff' : '#64748b',
                  }}
                >
                  {prof.badge}
                </span>
              </button>
            )
          })}
        </div>

        {/* 4 TAB UTAMA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('TODAY')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
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
              {todayAllTasks.filter((t) => t.status !== 'DONE').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('WEEKLY')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
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
            <span>📅 Plan Minggu Ini</span>
          </button>

          <button
            onClick={() => setActiveTab('BACKLOG')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              border: activeTab === 'BACKLOG' ? '1.5px solid #2563eb' : '1px solid transparent',
              backgroundColor: activeTab === 'BACKLOG' ? '#eff6ff' : 'transparent',
              color: activeTab === 'BACKLOG' ? '#1e40af' : '#475569',
              fontSize: '13px',
              fontWeight: activeTab === 'BACKLOG' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            <Layers size={14} />
            <span>📋 Antrean / Backlog</span>
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

          <button
            onClick={() => setActiveTab('DONE')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
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
            <span>Udah Kelar ({allCompletedTasks.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ☀️ LEVEL 1: HARI INI (KERJAAN LO HARI INI)                                */}
      {/* ========================================================================= */}
      {activeTab === 'TODAY' && (
        <div>
          {/* BANNER PROGRES HARI INI */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '20px 24px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                Semangat ya, {selectedStaff}! 👋
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#475569' }}>
                <Calendar size={15} color="#2563eb" />
                <span style={{ fontWeight: 600 }}>{formatDateIndonesian(activeDayObj.date)}</span>
                <span>•</span>
                <span>Fokus beresin yang urgent dulu biar cepet santai!</span>
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
                          backgroundColor: isSel ? '#ea580c' : '#cbd5e1',
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
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: todayPct === 100 ? '#059669' : '#0f172a' }}>
                  {todayDoneCount} dari {todayActiveCount} kelar ({todayPct}%) 🚀
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
            </div>
          </div>

          {/* PERINGATAN: KERJAAN YANG TELAT / LEWAT DEADLINE */}
          {overdueTasks.length > 0 && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <AlertCircle size={18} color="#dc2626" />
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#991b1b' }}>
                  🚨 WADUH, INI LEWAT DEADLINE NIH ({overdueTasks.length} Kerjaan)
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      border: '1px solid #fca5a5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => handleToggleTask(task)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
                      >
                        <Square size={17} />
                      </button>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>{task.task_text}</div>
                        <div style={{ fontSize: '11.5px', color: '#b91c1c', fontWeight: 600 }}>
                          ⚠️ Lewat batas waktu • Seharusnya kelar:{' '}
                          {task.deadline ? new Date(task.deadline).toLocaleDateString('id-ID') : 'Kemarin'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleScheduleTask(task, selectedDay)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#334155',
                          cursor: 'pointer',
                        }}
                      >
                        Pindahin ke Hari Ini
                      </button>
                      <button
                        onClick={() => handleStartFocusMode(task)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Gas Beresin Sekarang
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 1: 🔥 3 KERJAAN PALING URGENT HARI INI */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  🔥 3 KERJAAN PALING URGENT HARI INI
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  Kudu Kelar Duluan
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Kelar-in 3 ini dulu ya, jangan loncat-loncat biar lo ga keteteran!
              </span>
            </div>

            {topPriorityTasks.length === 0 ? (
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
                🎉 Asik! Ga ada kerjaan darurat hari ini. Lo bisa santai garap kerjaan rutin di bawah!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                {topPriorityTasks.map((task, idx) => {
                  const prioConf = TASK_PRIORITY_CONFIG[task.priority] || TASK_PRIORITY_CONFIG.HIGH
                  const catConf = TASK_CATEGORIES_CONFIG[task.category as TaskCategory] || TASK_CATEGORIES_CONFIG.PROMO

                  return (
                    <div
                      key={task.id}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: task.priority === 'URGENT' ? '2px solid #f87171' : '1.5px solid #fed7aa',
                        padding: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                      }}
                    >
                      <div>
                        {/* Header Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                backgroundColor: prioConf.bg,
                                color: prioConf.color,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span>{prioConf.dot}</span>
                              <span>{prioConf.label} #{idx + 1}</span>
                            </span>

                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                backgroundColor: catConf.bg,
                                color: catConf.color,
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {catConf.label}
                            </span>
                          </div>

                          {task.marketplace && (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: '#f1f5f9',
                                color: '#334155',
                                padding: '2px 7px',
                                borderRadius: '6px',
                              }}
                            >
                              {task.marketplace}
                            </span>
                          )}
                        </div>

                        {/* Judul & Keterangan */}
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
                            title="Tandai udah kelar"
                          >
                            <Square size={18} />
                          </button>

                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
                              {task.task_text}
                            </div>
                            {task.description && (
                              <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
                                {task.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Estimasi & Promo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: '#64748b', marginTop: '10px' }}>
                          {task.estimated_minutes && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={12} />
                              Estimasi: {task.estimated_minutes} Menit
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

                      {/* Tombol Aksi */}
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
                          <Target size={13} />
                          <span>Gas Kerjain (Focus Mode)</span>
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
                            title="Buka contekan cara ngerjain"
                          >
                            <Lightbulb size={12} color="#ea580c" />
                            <span>Contekan SOP</span>
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
                            title="Tandai lagi ketahan"
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

          {/* SECTION 2: 📋 KERJAAN LAINNYA HARI INI */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  📋 KERJAAN LAINNYA HARI INI ({selectedDay})
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
                  {regularTodayTasks.length} Kerjaan
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Kalo yang urgent udah beres, lanjut hajar yang di bawah ini ya!
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
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  Ga ada kerjaan reguler tersisa buat hari ini. Santai dulu!
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
                        padding: '10px 14px',
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

                        <span style={{ fontSize: '11px' }} title={prioConf.label}>
                          {prioConf.dot}
                        </span>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>{task.task_text}</span>
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

                      {/* Tombol Kanan */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {task.estimated_minutes && (
                          <span style={{ fontSize: '11px', color: '#64748b', marginRight: '6px' }}>
                            {task.estimated_minutes}m
                          </span>
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
                          title="Lihat Contekan SOP"
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
                          title="Tandai Lagi Ketahan"
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
                          <Edit2 size={14} />
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
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}

              {/* INPUT CEPAT TAMBAH TUGAS */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                <input
                  type="text"
                  placeholder={`+ Ketik kerjaan baru buat hari ${selectedDay}, langsung Enter aja...`}
                  value={quickInputText}
                  onChange={(e) => setQuickInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickAddToday()
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
                  onClick={handleQuickAddToday}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#0f172a',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Gas Tambah
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: ⏳ LAGI KETAHAN / PENDING (NUNGGU PIHAK LAIN) */}
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
                    ⏳ LAGI KETAHAN / PENDING ({blockedTodayTasks.length} Kerjaan)
                  </span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#b45309' }}>
                  Tenang, ini ga dihitung beban hari ini karena lo lagi nungguin respon pihak lain (RM/Finance/Ka Vanny).
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
                        ⚠️ Lagi ketahan karena: {task.blocked_reason || 'Lagi nunggu kabar atau approval pihak lain'}
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
      {/* 📅 LEVEL 2: PLAN MINGGU INI                                               */}
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
                📌 Catatan Wajib Diingat Minggu Ini ({selectedStaff}) — Replikasi Row 249-250 Spreadsheet
              </div>
              <textarea
                rows={2}
                value={weeklyNote}
                onChange={(e) => setWeeklyNote(e.target.value)}
                placeholder="Tulis instruksi mingguan penting (misal: gabungin pdp varian, matiin diskon full month ganti ke diskon event)..."
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
              {noteSaveStatus === 'saved' ? 'Tersimpan!' : 'Simpen Catatan'}
            </button>
          </div>

          {/* Kolom 5 Hari Kompak */}
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
                    minHeight: '520px',
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
                      <span>{totalDone}/{totalActive} Kelar</span>
                      <span>{totalActive > 0 ? Math.round((totalDone / totalActive) * 100) : 0}%</span>
                    </div>
                  </div>

                  {/* Kelompok Tugas */}
                  <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                    {/* 1. KUDU BANGET */}
                    {prioTasks.length > 0 && (
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#dc2626', marginBottom: '6px', textTransform: 'uppercase' }}>
                          🔥 Kudu Banget ({prioTasks.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {prioTasks.map((t) => (
                            <div
                              key={t.id}
                              style={{
                                backgroundColor: t.status === 'DONE' ? '#f8fafc' : '#fff7ed',
                                border: t.status === 'DONE' ? '1px solid #e2e8f0' : '1px solid #fed7aa',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '6px',
                              }}
                            >
                              <button
                                onClick={() => handleToggleTask(t)}
                                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: t.status === 'DONE' ? '#059669' : '#ea580c' }}
                              >
                                {t.status === 'DONE' ? <CheckSquare size={14} /> : <Square size={14} />}
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

                    {/* 2. SANTAI / REGULER */}
                    {normalTasks.length > 0 && (
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                          📋 Santai / Reguler ({normalTasks.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {normalTasks.map((t) => (
                            <div
                              key={t.id}
                              style={{
                                backgroundColor: t.status === 'DONE' ? '#f8fafc' : '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '6px',
                              }}
                            >
                              <button
                                onClick={() => handleToggleTask(t)}
                                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: t.status === 'DONE' ? '#059669' : '#94a3b8' }}
                              >
                                {t.status === 'DONE' ? <CheckSquare size={14} /> : <Square size={14} />}
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

                    {/* 3. LAGI KETAHAN */}
                    {blockedTasks.length > 0 && (
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#b45309', marginBottom: '6px', textTransform: 'uppercase' }}>
                          ⏳ Lagi Ketahan ({blockedTasks.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {blockedTasks.map((t) => (
                            <div
                              key={t.id}
                              style={{
                                backgroundColor: '#fffbeb',
                                border: '1px solid #fde68a',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                fontSize: '11.5px',
                                color: '#92400e',
                              }}
                            >
                              ⚠️ {t.task_text}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📋 LEVEL 3: ANTREAN / BACKLOG                                             */}
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
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Antrean Kerjaan & Ide yang Belum Masuk Jadwal ({backlogTasks.length} Kerjaan)
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                Tampung semua kerjaan & ide di sini. Kalo mau digarap, tinggal klik tombol "Pindahin ke Hari Ini"!
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
              + Bikin Kerjaan Baru
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {backlogTasks.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                Antrean backlog kosong nih. Mantap!
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
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{task.task_text}</div>
                    {task.description && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{task.description}</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        Jadwalin ke...
                      </option>
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          Hari {d}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleScheduleTask(task, 'Senin')}
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
                      Pindahin ke Hari Ini
                    </button>

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
      {/* ✔ TAB 4: UDAH KELAR (REKAP SELESAI)                                        */}
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
              Kerjaan yang Udah Lo Beresin 🎉 ({allCompletedTasks.length})
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
              Mantap banget! Ini rekap semua kerjaan yang udah beres lo kerjain.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {allCompletedTasks.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                Belum ada kerjaan yang kelar hari ini. Yuk gas selesaikan satu per satu!
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
                      title="Balikin ke belum selesai"
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
      {/* 🎯 FOCUS MODE (ANTI-DISTRAKSI)                                            */}
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
                <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.02em' }}>MODE FOKUS (ANTI-DISTRAKSI)</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Fokus satu kerjaan ini dulu ya, jangan buka tab lain dulu!</div>
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
              ✕ Balik ke List
            </button>
          </div>

          {/* Kartu Inti Focus */}
          <div style={{ maxWidth: '720px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span
                style={{
                  backgroundColor: '#dc2626',
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

            <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px 0', lineHeight: 1.3 }}>
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

            {/* Contekan SOP */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '18px', textAlign: 'left', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={14} />
                <span>Contekan Cara Ngerjain (SOP Singkat):</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#e2e8f0', lineHeight: 1.6 }}>
                {getTaskSOP(focusModeTask.task_text).steps.slice(0, 3).map((st, i) => (
                  <li key={i}>{st}</li>
                ))}
              </ul>
            </div>

            {/* Tombol Aksi Besar */}
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
                <span>Udah Beres, Lanjut Next!</span>
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
                <span>Ketahan Pihak Lain</span>
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
                <span>Skip Dulu</span>
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
            Klik 'Udah Beres' kalo settingan di Seller Centre / ERP udah lo submit ya!
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT KERJAAN                                              */}
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
                {modalMode === 'ADD' ? '+ Bikin Kerjaan Baru' : 'Edit Kerjaan'}
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
                Nama Kerjaan *
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
                Catatan / Detail Tambahan (Boleh Kosong)
              </label>
              <textarea
                rows={2}
                placeholder="Tulis SKU apa aja, batas diskon berapa persen, atau pesan pimpinan..."
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
                  Seberapa Mendesak?
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
                  <option value="URGENT">🔴 Kudu Banget (Urgent)</option>
                  <option value="HIGH">🟠 Penting (High)</option>
                  <option value="NORMAL">🔵 Biasa Aja (Normal)</option>
                  <option value="LOW">⚪ Kalo Sempet (Low)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Kategori Kerjaan
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
                  <option value="URGENT">🚨 Darurat / Kudu Cepat</option>
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
                  Mau Dikerjain Kapan?
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
                  <option value="Backlog">📋 Masukin ke Antrean / Backlog</option>
                </select>
              </div>
            </div>

            {/* Promo & Estimasi Menit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Promo Terkait (Kalo Ada)
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
                  Kira-kira Berapa Menit?
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
                {modalMode === 'ADD' ? 'Simpen Kerjaan' : 'Update Kerjaan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LAGI KETAHAN KARENA APA?                                           */}
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
                Lagi Ketahan Karena Apa Nih?
              </h3>
            </div>

            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 14px 0', lineHeight: 1.4 }}>
              Apa yang bikin kerjaan <strong>"{blockingTask.task_text}"</strong> belum bisa diselesaikan saat ini?
            </p>

            <textarea
              rows={3}
              placeholder="Contoh: Lagi nungguin ACC harga diskon dari Finance, atau nungguin kiriman materi banner dari Ka Vanny..."
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
                Tandai Ketahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONTEKAN & PANDUAN CARA NGERJAIN (SOP)                             */}
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

            {/* Kenapa Ini Kudu Beres */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                🎯 Kenapa ini kudu beres:
              </div>
              <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.45 }}>
                {activeSOPTask.sop.objective}
              </div>
            </div>

            {/* Caranya Gampang (Steps) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                📋 Caranya gampang (Langkah demi langkah):
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

            {/* Acuan Parameter */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                ⚙️ Acuan Parameter yang Harus Diingat:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#475569' }}>
                {activeSOPTask.sop.parameters.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>

            {/* Tips Biar Ga Boncos */}
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '10px 12px', borderRadius: '8px', marginBottom: '18px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#b45309', marginBottom: '2px' }}>
                💡 Tips biar lo ga boncos & ga pusing:
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
                Sip, Gue Paham!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
