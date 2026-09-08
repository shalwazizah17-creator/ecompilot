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
} from 'lucide-react'
import {
  StaffTaskItem,
  STAFF_LIST,
  StaffName,
  DAYS_OF_WEEK,
  DayOfWeek,
  TASK_CATEGORIES,
  getMondayOfWeek,
  formatDateMMDDYY,
  getWeekDays,
  detectCategory,
  DAILY_ROUTINES,
  STAFF_RECOMMENDATIONS,
  StaffRecommendationItem,
  getTaskSOP,
  TaskSOP,
} from '@/lib/staff-tasks-utils'

// Staff avatars & roles specifically for Shalwa & Nandila
const STAFF_PROFILES: Record<string, { role: string; avatarBg: string; initial: string; badge: string }> = {
  Shalwa: { 
    role: 'Marketplace Specialist (Promo, Bundling & Campaign)', 
    avatarBg: '#2563eb', 
    initial: 'SH',
    badge: 'Specialist' 
  },
  Nandila: { 
    role: 'Marketplace Specialist (Shopee, Lazada & Maklon)', 
    avatarBg: '#ea580c', 
    initial: 'NA',
    badge: 'Senior Specialist' 
  },
}

export default function StaffTasksPage() {
  const [selectedStaff, setSelectedStaff] = useState<StaffName>('Shalwa')
  // Default Monday: 2026-09-07 as in user's sheet
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMondayOfWeek(new Date('2026-09-07T00:00:00Z')))
  const [tasks, setTasks] = useState<StaffTaskItem[]>([])
  const [weeklyNote, setWeeklyNote] = useState<string>('')
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false)
  const [noteSaveStatus, setNoteSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [loading, setLoading] = useState<boolean>(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL')

  // Inline input state per column
  const [newInputs, setNewInputs] = useState<Record<string, string>>({
    Senin: '',
    Selasa: '',
    Rabu: '',
    Kamis: '',
    Jumat: '',
  })

  // Editing modal/inline state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTaskText, setEditingTaskText] = useState<string>('')
  const [editingTaskCategory, setEditingTaskCategory] = useState<string>('')

  // SOP Guidance Modal State
  const [activeSOPTask, setActiveSOPTask] = useState<{ text: string; sop: TaskSOP } | null>(null)

  // Routine shortcut modal
  const [showRoutineModal, setShowRoutineModal] = useState<boolean>(false)
  const [targetRoutineDay, setTargetRoutineDay] = useState<string>('ALL')

  const weekDays = useMemo(() => getWeekDays(currentMonday), [currentMonday])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Fetch staff tasks
  const fetchTasks = async () => {
    setLoading(true)
    try {
      const weekStartStr = currentMonday.toISOString()
      const res = await fetch(`/api/staff-tasks?staffName=${encodeURIComponent(selectedStaff)}&weekStart=${encodeURIComponent(weekStartStr)}`)
      if (!res.ok) throw new Error('Gagal memuat tugas staff')
      const data = await res.json()
      setTasks(data.tasks || [])
      setWeeklyNote(data.weekly_note || '')
    } catch (err: any) {
      console.error(err)
      showToast('⚠️ Terjadi kendala saat memuat data to-do list.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [selectedStaff, currentMonday])

  // Save Weekly Note
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
      if (!res.ok) throw new Error('Gagal menyimpan catatan')
      setNoteSaveStatus('saved')
      showToast('✅ Catatan mingguan berhasil disimpan!')
      setTimeout(() => setNoteSaveStatus('idle'), 2500)
    } catch (err: any) {
      console.error(err)
      showToast('❌ Gagal menyimpan catatan mingguan.')
      setNoteSaveStatus('idle')
    } finally {
      setIsSavingNote(false)
    }
  }

  // Toggle Task Completion
  const handleToggleTask = async (task: StaffTaskItem) => {
    const updatedStatus = !task.is_completed
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_completed: updatedStatus } : t))
    )

    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          is_completed: updatedStatus,
        }),
      })
      if (!res.ok) throw new Error('Gagal update task')
    } catch (err) {
      console.error(err)
      // Revert if error
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_completed: task.is_completed } : t))
      )
      showToast('❌ Gagal mengubah status tugas')
    }
  }

  // Add Task inline
  const handleAddTask = async (day: DayOfWeek, dateStr: string, customText?: string) => {
    const text = (customText || newInputs[day])?.trim()
    if (!text) return

    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffName: selectedStaff,
          weekStart: currentMonday.toISOString(),
          dayOfWeek: day,
          dateStr: dateStr,
          taskText: text,
        }),
      })
      if (!res.ok) throw new Error('Gagal menambah tugas')
      const data = await res.json()
      setTasks((prev) => [...prev, data.task])
      if (!customText) {
        setNewInputs((prev) => ({ ...prev, [day]: '' }))
      }
      showToast(`✅ Tugas ditambahkan ke ${day}!`)
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal menambah tugas')
    }
  }

  // Add Recommendation to To-Do List
  const handleApplyRecommendation = async (rec: StaffRecommendationItem) => {
    const targetDayObj = weekDays.find((d) => d.day === rec.target_day) || weekDays[0]
    await handleAddTask(rec.target_day, targetDayObj.dateStr, rec.short_action)
    showToast(`⭐ Rekomendasi "${rec.title}" berhasil dimasukkan ke kolom ${rec.target_day}!`)
  }

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return
    try {
      const res = await fetch(`/api/staff-tasks?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal menghapus tugas')
      setTasks((prev) => prev.filter((t) => t.id !== id))
      showToast('🗑️ Tugas berhasil dihapus.')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal menghapus tugas')
    }
  }

  // Save Inline Edit
  const handleSaveEditTask = async () => {
    if (!editingTaskId || !editingTaskText.trim()) return
    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTaskId,
          task_text: editingTaskText.trim(),
          category: editingTaskCategory || detectCategory(editingTaskText.trim()),
        }),
      })
      if (!res.ok) throw new Error('Gagal update tugas')
      const data = await res.json()
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTaskId ? data.task : t))
      )
      setEditingTaskId(null)
      showToast('✅ Tugas berhasil diperbarui!')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal mengupdate tugas')
    }
  }

  // Quick Add Routine
  const handleAddRoutines = async () => {
    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_routine',
          staffName: selectedStaff,
          weekStart: currentMonday.toISOString(),
          dayOfWeek: targetRoutineDay === 'ALL' ? undefined : targetRoutineDay,
          routines: DAILY_ROUTINES,
        }),
      })
      if (!res.ok) throw new Error('Gagal menambahkan rutinitas')
      showToast('⚡ Rutinitas harian berhasil ditambahkan!')
      setShowRoutineModal(false)
      fetchTasks()
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal menambahkan rutinitas')
    }
  }

  // Copy Tasks from Previous Week
  const handleClonePreviousWeek = async () => {
    if (!confirm(`Salin seluruh tugas dari minggu sebelumnya untuk ${selectedStaff}?`)) return
    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clone_previous_week',
          staffName: selectedStaff,
          weekStart: currentMonday.toISOString(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyalin tugas')
      showToast(`✅ ${data.count} tugas berhasil disalin dari minggu sebelumnya!`)
      fetchTasks()
    } catch (err: any) {
      console.error(err)
      showToast(`⚠️ ${err.message || 'Gagal menyalin tugas'}`)
    }
  }

  // Week Navigation
  const handlePrevWeek = () => {
    const d = new Date(currentMonday)
    d.setDate(d.getDate() - 7)
    setCurrentMonday(d)
  }

  const handleNextWeek = () => {
    const d = new Date(currentMonday)
    d.setDate(d.getDate() + 7)
    setCurrentMonday(d)
  }

  const handleJumpToCurrentWeek = () => {
    setCurrentMonday(getMondayOfWeek(new Date()))
  }

  // Copy TSV to Clipboard for direct Google Sheets paste!
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
          .map((t) => (t.is_completed ? `[DONE] ${t.task_text}` : t.task_text))
      })

      const maxRows = Math.max(...Object.values(dayTasksMap).map((arr) => arr.length), 1)

      const lines: string[] = []

      // Add Header with Notes
      if (weeklyNote.trim()) {
        lines.push(`TO DO LIST MARKETPLACE - STAFF: ${selectedStaff.toUpperCase()}`)
        lines.push(`CATATAN PRIORITAS MINGGUAN (ROW 249-250):`)
        lines.push(weeklyNote.replace(/\r?\n/g, ' | '))
        lines.push('') // empty row
      }

      // 5 Column Header: Senin (09/07/26) \t Selasa (09/08/26)...
      const headerRow = weekDays.map((d) => `${d.day} (${d.dateStr})`).join('\t')
      lines.push(headerRow)

      // Rows
      for (let r = 0; r < maxRows; r++) {
        const rowCols = weekDays.map((d) => dayTasksMap[d.day][r] || '')
        lines.push(rowCols.join('\t'))
      }

      const tsvContent = lines.join('\n')
      navigator.clipboard.writeText(tsvContent)
      showToast('📋 Format Google Sheets berhasil disalin! Buka Google Sheets & tekan Ctrl + V.')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal menyalin ke clipboard.')
    }
  }

  // Export to Real Excel .xlsx
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
          .map((t) => (t.is_completed ? `[DONE] ${t.task_text}` : t.task_text))
      })

      const maxRows = Math.max(...Object.values(dayTasksMap).map((arr) => arr.length), 1)

      // Create data rows
      const sheetData: any[][] = []

      // Title & note rows
      sheetData.push([`TO DO LIST MARKETPLACE - STAFF: ${selectedStaff.toUpperCase()}`])
      sheetData.push([`PERIODE: ${weekDays[0].displayLabel} s/d ${weekDays[4].displayLabel}`])
      if (weeklyNote.trim()) {
        sheetData.push([`CATATAN / PRIORITAS MINGGUAN:`])
        const noteLines = weeklyNote.split('\n')
        noteLines.forEach((nl) => sheetData.push([nl]))
      }
      sheetData.push([]) // empty row separator

      // Table Header Row
      const headerRow = weekDays.map((d) => `${d.day} (${d.dateStr})`)
      sheetData.push(headerRow)

      // Tasks Rows
      for (let r = 0; r < maxRows; r++) {
        const row = weekDays.map((d) => dayTasksMap[d.day][r] || '')
        sheetData.push(row)
      }

      const worksheet = xlsx.utils.aoa_to_sheet(sheetData)

      // Set column widths
      worksheet['!cols'] = [
        { wch: 38 },
        { wch: 38 },
        { wch: 38 },
        { wch: 38 },
        { wch: 38 },
      ]

      const workbook = xlsx.utils.book_new()
      xlsx.utils.book_append_sheet(workbook, worksheet, `To-Do ${selectedStaff}`)

      const fileName = `To_Do_List_${selectedStaff}_${weekDays[0].dateStr.replace(/\//g, '-')}_sd_${weekDays[4].dateStr.replace(/\//g, '-')}.xlsx`
      xlsx.writeFile(workbook, fileName)
      showToast('📥 File Excel (.xlsx) berhasil diunduh!')
    } catch (err) {
      console.error(err)
      showToast('❌ Gagal mengekspor file Excel.')
    }
  }

  // Recommendations for the active staff
  const staffRecommendations = useMemo(() => {
    return STAFF_RECOMMENDATIONS.filter((r) => r.staff_name === selectedStaff)
  }, [selectedStaff])

  // Filtered tasks per day
  const filteredTasksByDay = useMemo(() => {
    const result: Record<string, StaffTaskItem[]> = {
      Senin: [],
      Selasa: [],
      Rabu: [],
      Kamis: [],
      Jumat: [],
    }

    weekDays.forEach((dayObj) => {
      result[dayObj.day] = tasks.filter((t) => {
        if (t.day_of_week !== dayObj.day) return false
        if (searchQuery.trim()) {
          const matchQuery = t.task_text.toLowerCase().includes(searchQuery.toLowerCase())
          if (!matchQuery) return false
        }
        if (selectedCategoryFilter !== 'ALL') {
          if (t.category !== selectedCategoryFilter) return false
        }
        return true
      })
    })

    return result
  }, [tasks, weekDays, searchQuery, selectedCategoryFilter])

  // Total summary statistics
  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.is_completed).length
    const pending = total - completed
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, pending, pct }
  }, [tasks])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px 28px', color: '#0f172a' }}>
      {/* TOAST NOTIFICATION */}
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

      {/* HEADER SECTION */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
          <span>Growth</span>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>To-Do List Staff Marketplace</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ea580c, #f97316)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
                }}
              >
                <CheckSquare size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                    2026_To Do List Marketplace Staff
                  </h1>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      backgroundColor: '#ffedd5',
                      color: '#c2410c',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      border: '1px solid #fed7aa',
                    }}
                  >
                    Khusus Shalwa & Nandila
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
                  Format mingguan Senin–Jumat yang terhubung dengan Google Sheets dan dilengkapi Rekomendasi Cerdas & Panduan SOP.
                </p>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopyToSpreadsheet}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 15px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #059669',
                color: '#059669',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease',
              }}
              title="Salin 5 kolom lengkap dengan format Google Sheets (Ctrl+V di spreadsheet)"
            >
              <Copy size={16} />
              <span>Salin ke Spreadsheet (1-Click)</span>
            </button>

            <button
              onClick={handleExportExcel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 15px',
                borderRadius: '8px',
                backgroundColor: '#059669',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <Download size={16} />
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => setShowRoutineModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 15px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #e2e8f0',
                color: '#0f172a',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={16} color="#ea580c" />
              <span>+ Rutinitas Harian</span>
            </button>

            <button
              onClick={handleClonePreviousWeek}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 15px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #e2e8f0',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Salin tugas dari minggu lalu ke minggu ini"
            >
              <RefreshCw size={15} />
              <span>Salin dari Minggu Lalu</span>
            </button>
          </div>
        </div>
      </div>

      {/* STAFF SWITCHER TABS (KHUSUS SHALWA & NANDILA) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 12px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 8px', color: '#64748b', fontSize: '13px', fontWeight: 600, flexShrink: 0 }}>
          <UserCheck size={18} color="#ea580c" />
          <span>Pilih Staff:</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {STAFF_LIST.map((staff) => {
            const profile = STAFF_PROFILES[staff] || { role: 'Specialist', avatarBg: '#64748b', initial: staff.slice(0, 2).toUpperCase(), badge: 'Specialist' }
            const isSelected = selectedStaff === staff

            return (
              <button
                key={staff}
                onClick={() => setSelectedStaff(staff)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid #ea580c' : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
                  color: isSelected ? '#c2410c' : '#475569',
                  fontSize: '14px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(234, 88, 12, 0.15)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? '#ea580c' : profile.avatarBg,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {profile.initial}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{staff}</span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        backgroundColor: isSelected ? '#ea580c' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#64748b',
                        padding: '1px 6px',
                        borderRadius: '6px',
                      }}
                    >
                      {profile.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 400 }}>
                    {profile.role}
                  </div>
                </div>
                {isSelected && (
                  <span
                    style={{
                      backgroundColor: '#ea580c',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      marginLeft: '6px',
                    }}
                  >
                    {tasks.length} Tugas
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* SMART RECOMMENDATION SECTION (BIAR STAFF TIDAK BINGUNG) */}
      <div
        style={{
          backgroundColor: '#eff6ff',
          border: '1.5px solid #bfdbfe',
          borderRadius: '14px',
          padding: '18px 20px',
          marginBottom: '22px',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}
            >
              <Lightbulb size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#1e40af' }}>
                  Rekomendasi Tindakan & Prioritas EcomPilot untuk {selectedStaff}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    padding: '1px 8px',
                    borderRadius: '10px',
                  }}
                >
                  Anti-Bingung
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#3b82f6' }}>
                Rekomendasi operasional berbasis data riil kalender promo, proteksi margin bottom price, dan instruksi khusus pimpinan.
              </p>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 600 }}>
            {staffRecommendations.length} Rekomendasi Tersedia
          </div>
        </div>

        {/* RECOMMENDATION CARDS GRID */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '12px',
          }}
        >
          {staffRecommendations.map((rec) => (
            <div
              key={rec.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #dbeafe',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        backgroundColor: rec.priority === 'Urgent' ? '#fee2e2' : '#ffedd5',
                        color: rec.priority === 'Urgent' ? '#b91c1c' : '#c2410c',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {rec.priority}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#64748b',
                      }}
                    >
                      Target: Hari {rec.target_day}
                    </span>
                  </div>

                  {rec.deadline && (
                    <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={12} />
                      {rec.deadline}
                    </span>
                  )}
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                  {rec.title}
                </h4>

                <p style={{ fontSize: '12.5px', color: '#475569', margin: '0 0 10px 0', lineHeight: 1.45 }}>
                  {rec.reason}
                </p>

                {/* Parameters pill */}
                {rec.suggested_discount && (
                  <div style={{ backgroundColor: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#334155', marginBottom: '10px' }}>
                    <strong>Acuan Parameter:</strong> {rec.suggested_discount}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  onClick={() => {
                    const sop = getTaskSOP(rec.short_action)
                    setActiveSOPTask({ text: rec.title, sop })
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <BookOpen size={13} color="#2563eb" />
                  <span>Lihat SOP Eksekusi</span>
                </button>

                <button
                  onClick={() => handleApplyRecommendation(rec)}
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
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <Plus size={14} />
                  <span>+ Masukkan ke {rec.target_day}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WEEK CONTROLLER & SUMMARY BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '14px 20px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        {/* Week Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handlePrevWeek}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
            }}
            title="Minggu Sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
            <Calendar size={16} color="#ea580c" />
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
              {weekDays[0].displayLabel} — {weekDays[4].displayLabel}
            </span>
          </div>

          <button
            onClick={handleNextWeek}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
            }}
            title="Minggu Berikutnya"
          >
            <ChevronRight size={18} />
          </button>

          <button
            onClick={handleJumpToCurrentWeek}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            Lompat ke Minggu Ini
          </button>
        </div>

        {/* Progress & Quick Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Progress Penyelesaian</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                {stats.completed} dari {stats.total} Tugas ({stats.pct}%)
              </div>
            </div>
            <div style={{ width: '100px', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${stats.pct}%`,
                  height: '100%',
                  backgroundColor: stats.pct === 100 ? '#10b981' : '#ea580c',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Quick Category Filter & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Cari tugas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 10px 6px 30px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  width: '160px',
                  outline: 'none',
                }}
              />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12.5px',
                outline: 'none',
                backgroundColor: '#ffffff',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">Semua Kategori</option>
              {TASK_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TOP WEEKLY PRIORITY / NOTES BOX (SPREADSHEET ROW 249-250) */}
      <div
        style={{
          backgroundColor: '#fffbeb',
          border: '1.5px solid #fef3c7',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(245, 158, 11, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
              }}
            >
              <Pin size={16} />
            </div>
            <div>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#92400e' }}>
                Catatan / Prioritas Khusus Mingguan ({selectedStaff})
              </span>
              <span style={{ fontSize: '12px', color: '#b45309', marginLeft: '8px' }}>
                (Replikasi baris 249-250 Spreadsheet: instruksi strategis mingguan yang wajib diperhatikan)
              </span>
            </div>
          </div>

          <button
            onClick={handleSaveWeeklyNote}
            disabled={isSavingNote}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: noteSaveStatus === 'saved' ? '#10b981' : '#d97706',
              border: 'none',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: isSavingNote ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {noteSaveStatus === 'saved' ? <Check size={14} /> : <Pin size={14} />}
            <span>{noteSaveStatus === 'saved' ? 'Tersimpan' : isSavingNote ? 'Menyimpan...' : 'Simpan Catatan'}</span>
          </button>
        </div>

        <textarea
          rows={2}
          value={weeklyNote}
          onChange={(e) => setWeeklyNote(e.target.value)}
          placeholder="Tulis instruksi atau catatan khusus untuk minggu ini..."
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #fde68a',
            backgroundColor: '#ffffff',
            fontSize: '13px',
            color: '#1e293b',
            lineHeight: 1.5,
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* 5-COLUMN GRID (SENIN - JUMAT) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(240px, 1fr))',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '20px',
        }}
      >
        {weekDays.map((dayObj) => {
          const dayTasks = filteredTasksByDay[dayObj.day] || []
          const totalInDay = dayTasks.length
          const completedInDay = dayTasks.filter((t) => t.is_completed).length
          const isAllDone = totalInDay > 0 && completedInDay === totalInDay

          return (
            <div
              key={dayObj.day}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                minHeight: '520px',
              }}
            >
              {/* ORANGE HEADER MATCHING USER'S GOOGLE SHEET */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #ea580c, #f97316)',
                  padding: '14px 16px',
                  borderTopLeftRadius: '11px',
                  borderTopRightRadius: '11px',
                  color: '#ffffff',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                    {dayObj.day}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}
                  >
                    {completedInDay}/{totalInDay}
                  </span>
                </div>

                <div style={{ fontSize: '12.5px', opacity: 0.95, fontWeight: 500 }}>
                  {dayObj.dateStr}
                </div>

                {/* Mini progress bar under header */}
                <div
                  style={{
                    marginTop: '8px',
                    height: '4px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: totalInDay > 0 ? `${(completedInDay / totalInDay) * 100}%` : '0%',
                      backgroundColor: isAllDone ? '#86efac' : '#ffffff',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>

              {/* TASK LIST CONTAINER */}
              <div
                style={{
                  flex: 1,
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  overflowY: 'auto',
                  maxHeight: '580px',
                }}
              >
                {dayTasks.length === 0 ? (
                  <div
                    style={{
                      padding: '30px 10px',
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: '12.5px',
                    }}
                  >
                    Belum ada tugas untuk {dayObj.day}.
                  </div>
                ) : (
                  dayTasks.map((task) => {
                    const catObj = TASK_CATEGORIES.find((c) => c.value === task.category) || {
                      label: task.category || 'Operasional',
                      color: '#475569',
                      bg: '#f1f5f9',
                    }

                    return (
                      <div
                        key={task.id}
                        style={{
                          backgroundColor: task.is_completed ? '#f8fafc' : '#ffffff',
                          border: task.is_completed ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          boxShadow: task.is_completed ? 'none' : '0 1px 2px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <button
                            onClick={() => handleToggleTask(task)}
                            style={{
                              border: 'none',
                              backgroundColor: 'transparent',
                              padding: 0,
                              margin: '2px 0 0 0',
                              cursor: 'pointer',
                              color: task.is_completed ? '#10b981' : '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                            title={task.is_completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                          >
                            {task.is_completed ? <CheckSquare size={17} /> : <Square size={17} />}
                          </button>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '13px',
                                lineHeight: '1.4',
                                color: task.is_completed ? '#94a3b8' : '#1e293b',
                                textDecoration: task.is_completed ? 'line-through' : 'none',
                                wordBreak: 'break-word',
                                fontWeight: task.is_completed ? 400 : 500,
                              }}
                            >
                              {task.task_text}
                            </div>
                          </div>

                          {/* Quick Action Icons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            <button
                              onClick={() => {
                                setEditingTaskId(task.id)
                                setEditingTaskText(task.task_text)
                                setEditingTaskCategory(task.category || detectCategory(task.task_text))
                              }}
                              style={{
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: '#94a3b8',
                                padding: '2px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                              }}
                              title="Edit tugas"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              style={{
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: '#ef4444',
                                padding: '2px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                opacity: 0.7,
                              }}
                              title="Hapus tugas"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Category Pill & SOP Guidance Trigger */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: '2px' }}>
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: catObj.bg,
                              color: catObj.color,
                            }}
                          >
                            {catObj.label}
                          </span>

                          <button
                            onClick={() => {
                              const sop = getTaskSOP(task.task_text)
                              setActiveSOPTask({ text: task.task_text, sop })
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#2563eb',
                              fontSize: '10.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            title="Buka panduan eksekusi & SOP langkah demi langkah agar tidak bingung"
                          >
                            <Lightbulb size={11} />
                            <span>Panduan SOP</span>
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* FOOTER: FAST INLINE ADD TASK */}
              <div
                style={{
                  padding: '10px 12px',
                  borderTop: '1px solid #f1f5f9',
                  backgroundColor: '#f8fafc',
                  borderBottomLeftRadius: '11px',
                  borderBottomRightRadius: '11px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder={`+ Tambah tugas ${dayObj.day}...`}
                    value={newInputs[dayObj.day] || ''}
                    onChange={(e) =>
                      setNewInputs((prev) => ({ ...prev, [dayObj.day]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTask(dayObj.day as DayOfWeek, dayObj.dateStr)
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                    }}
                  />

                  <button
                    onClick={() => handleAddTask(dayObj.day as DayOfWeek, dayObj.dateStr)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#ea580c',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Simpan tugas"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* DETAILED SOP GUIDANCE MODAL / DRAWER */}
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
              maxWidth: '600px',
              padding: '26px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <BookOpen size={20} />
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
                      textTransform: 'uppercase',
                    }}
                  >
                    Platform: {activeSOPTask.sop.platform}
                  </span>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '17px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
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
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Objective */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '10px', marginBottom: '18px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                🎯 Tujuan Tugas / Objective:
              </div>
              <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.5 }}>
                {activeSOPTask.sop.objective}
              </div>
            </div>

            {/* Steps */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
                📋 Panduan Langkah Demi Langkah (Step-by-Step SOP):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeSOPTask.sop.steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
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
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: '1px',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>{step}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parameters */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                ⚙️ Acuan Parameter & Batasan:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                {activeSOPTask.sop.parameters.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>

            {/* Tips & Guardrails */}
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '12px 14px', borderRadius: '10px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <ShieldCheck size={16} />
                <span>Tips Anti-Bingung & Guardrail EcomPilot:</span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#78350f', lineHeight: 1.5 }}>
                {activeSOPTask.sop.tips}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setActiveSOPTask(null)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Saya Mengerti, Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingTaskId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
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
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              Edit Tugas Staff
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Teks Tugas
              </label>
              <textarea
                rows={3}
                value={editingTaskText}
                onChange={(e) => setEditingTaskText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Kategori Tugas
              </label>
              <select
                value={editingTaskCategory}
                onChange={(e) => setEditingTaskCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                }}
              >
                {TASK_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setEditingTaskId(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditTask}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#ea580c',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ROUTINE MODAL */}
      {showRoutineModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
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
              maxWidth: '520px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: '#ffedd5',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                Tambah Rutinitas Harian Otomatis
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Menambahkan daftar checklist rutin standar marketplace specialist ke kolom hari yang Anda tentukan:
            </p>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '18px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                Item Rutinitas yang Akan Ditambahkan:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#334155', lineHeight: 1.6 }}>
                {DAILY_ROUTINES.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Pilih Hari Target:
              </label>
              <select
                value={targetRoutineDay}
                onChange={(e) => setTargetRoutineDay(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="ALL">Semua Hari (Senin s/d Jumat)</option>
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    Hari {d} Saja
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowRoutineModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                onClick={handleAddRoutines}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#ea580c',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Terapkan Rutinitas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
