export type TaskPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE'
export type TaskCategory = 'ROUTINE' | 'PROMO' | 'PROJECT' | 'MONITORING' | 'URGENT' | 'LEARNING'
export type PromoStage = 'PREPARATION' | 'MONITORING' | 'EVALUATION'

export interface StaffTaskItem {
  id: string
  brand_id: string
  staff_name: string
  week_start: string | Date
  day_of_week: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Backlog'
  date_str: string
  task_text: string
  description?: string | null
  category: string
  priority: TaskPriority
  status: TaskStatus
  marketplace?: string | null
  promo_name?: string | null
  promo_stage?: PromoStage | null
  deadline?: string | Date | null
  scheduled_date?: string | Date | null
  estimated_minutes?: number | null
  actual_minutes?: number | null
  blocked_reason?: string | null
  is_recurring?: boolean
  recurring_rule?: string | null
  is_completed: boolean
  completed_at?: string | Date | null
  order_index: number
  created_at?: string | Date
  updated_at?: string | Date
}

export interface StaffWeeklyNoteItem {
  id?: string
  brand_id: string
  staff_name: string
  week_start: string | Date
  notes: string
}

// Khusus Shalwa dan Nandila sesuai arahan user
export const STAFF_LIST = ['Shalwa', 'Nandila'] as const
export type StaffName = (typeof STAFF_LIST)[number]

export const DAYS_OF_WEEK = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]

// Categories config
export const TASK_CATEGORIES_CONFIG: Record<
  TaskCategory,
  { label: string; color: string; bg: string; icon: string; border: string }
> = {
  ROUTINE: { label: 'Rutinitas Harian', color: '#0284c7', bg: '#f0f9ff', icon: '🔄', border: '#bae6fd' },
  PROMO: { label: 'Promo & Campaign', color: '#ea580c', bg: '#fff7ed', icon: '🔥', border: '#fed7aa' },
  PROJECT: { label: 'Project Toko', color: '#7c3aed', bg: '#f5f3ff', icon: '🚀', border: '#ddd6fe' },
  MONITORING: { label: 'Monitoring & Cek', color: '#059669', bg: '#ecfdf5', icon: '📊', border: '#a7f3d0' },
  URGENT: { label: 'Darurat / Cepat', color: '#dc2626', bg: '#fef2f2', icon: '🚨', border: '#fecaca' },
  LEARNING: { label: 'Materi & Belajar', color: '#7c3aed', bg: '#f5f3ff', icon: '📚', border: '#ddd6fe' },
}

// Priority config - 4 Level, Default Normal
export const TASK_PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bg: string; dot: string; score: number }
> = {
  URGENT: { label: 'Urgent', color: '#dc2626', bg: '#fee2e2', dot: '🔴', score: 4 },
  HIGH: { label: 'High', color: '#ea580c', bg: '#ffedd5', dot: '🟠', score: 3 },
  NORMAL: { label: 'Normal', color: '#2563eb', bg: '#dbeafe', dot: '🔵', score: 2 },
  LOW: { label: 'Low', color: '#64748b', bg: '#f1f5f9', dot: '⚪', score: 1 },
}

// 4 Status Baku: BELUM MULAI, SEDANG DIKERJAKAN, TERTUNDA, SELESAI
export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  TODO: { label: 'Belum Mulai', color: '#475569', bg: '#f1f5f9', icon: '📌' },
  IN_PROGRESS: { label: 'Sedang Dikerjakan', color: '#2563eb', bg: '#dbeafe', icon: '▶' },
  BLOCKED: { label: 'Tertunda', color: '#d97706', bg: '#fef3c7', icon: '⏸' },
  DONE: { label: 'Selesai', color: '#059669', bg: '#ecfdf5', icon: '✅' },
}

/**
 * Returns Monday UTC 00:00:00 for the week containing `date`.
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday, 1 = Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Format date as MM/DD/YY (matching user's sheet like 09/07/26)
 */
export function formatDateMMDDYY(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const y = String(date.getFullYear()).slice(-2)
  return `${m}/${d}/${y}`
}

/**
 * Format date in Indonesian: "Senin, 07 September 2026"
 */
export function formatDateIndonesian(date: Date): string {
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const dName = dayNames[date.getDay()]
  const day = String(date.getDate()).padStart(2, '0')
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  return `${dName}, ${day} ${month} ${year}`
}

/**
 * Given a Monday date, returns an array of 5 day objects { day: 'Senin', dateStr: '09/07/26', date: Date }
 */
export function getWeekDays(monday: Date) {
  return DAYS_OF_WEEK.map((dayName, idx) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + idx)
    return {
      day: dayName,
      dateStr: formatDateMMDDYY(d),
      date: d,
      displayLabel: `${dayName} (${formatDateMMDDYY(d)})`,
    }
  })
}

/**
 * Dapatkan hari berikutnya (Senin -> Selasa, Selasa -> Rabu, dst.)
 */
export function getTomorrowDay(currentDay: DayOfWeek): DayOfWeek {
  const idx = DAYS_OF_WEEK.indexOf(currentDay)
  if (idx === -1 || idx === DAYS_OF_WEEK.length - 1) return 'Senin'
  return DAYS_OF_WEEK[idx + 1]
}

/**
 * Cek apakah sebuah task merupakan materi pembelajaran / onboarding / product knowledge
 */
export function isLearningTask(task: { task_text?: string; category?: string; description?: string | null }): boolean {
  if (task.category === 'LEARNING') return true
  const combined = `${task.task_text || ''} ${task.description || ''}`.toLowerCase()
  return (
    combined.includes('belajar') ||
    combined.includes('on-boarding') ||
    combined.includes('onboarding') ||
    combined.includes('product knowledge') ||
    combined.includes('pelajari') ||
    combined.includes('sop') ||
    combined.includes('materi') ||
    combined.includes('training')
  )
}

/**
 * Auto-detect category from text
 */
export function detectCategory(text: string): TaskCategory {
  const lower = text.toLowerCase()
  if (
    lower.includes('belajar') ||
    lower.includes('on-boarding') ||
    lower.includes('onboarding') ||
    lower.includes('product knowledge') ||
    lower.includes('pelajari') ||
    lower.includes('sop') ||
    lower.includes('materi')
  ) {
    return 'LEARNING'
  }
  if (lower.includes('urgent') || lower.includes('darurat') || lower.includes('rusak') || lower.includes('bocor')) {
    return 'URGENT'
  }
  if (lower.includes('chat') || lower.includes('blast') || lower.includes('balas') || lower.includes('inbox') || lower.includes('rutin')) {
    return 'ROUTINE'
  }
  if (lower.includes('fs toko') || lower.includes('flash sale') || lower.includes('diskon') || lower.includes('campaign') || lower.includes('payday') || lower.includes('9.9') || lower.includes('10.10') || lower.includes('voucher')) {
    return 'PROMO'
  }
  if (lower.includes('pdp') || lower.includes('etalase') || lower.includes('bundling') || lower.includes('deskripsi') || lower.includes('varian') || lower.includes('project') || lower.includes('maklon')) {
    return 'PROJECT'
  }
  if (lower.includes('monitor') || lower.includes('closing') || lower.includes('rekap') || lower.includes('laporan') || lower.includes('report') || lower.includes('cek stok')) {
    return 'MONITORING'
  }
  return 'ROUTINE'
}

/**
 * Auto-detect marketplace from text
 */
export function detectMarketplace(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('shopee') && lower.includes('lazada')) return 'Shopee & Lazada'
  if (lower.includes('shopee')) return 'Shopee'
  if (lower.includes('lazada')) return 'Lazada'
  if (lower.includes('tiktok')) return 'TikTok Shop'
  if (lower.includes('wa') || lower.includes('komunitas') || lower.includes('whatsapp')) return 'WhatsApp'
  if (lower.includes('maklon') || lower.includes('my essent')) return 'MyEssent'
  return 'All Marketplaces'
}

/**
 * Auto-detect estimated duration in minutes
 */
export function detectEstimatedMinutes(text: string): number {
  const lower = text.toLowerCase()
  if (lower.includes('closing') || lower.includes('rekap')) return 90
  if (lower.includes('pdp') || lower.includes('bundling') || lower.includes('etalase')) return 60
  if (lower.includes('flash sale') || lower.includes('fs toko') || lower.includes('campaign')) return 45
  if (lower.includes('chat') || lower.includes('blast')) return 30
  if (lower.includes('maklon')) return 30
  if (lower.includes('monitor') || lower.includes('cek')) return 30
  return 45
}

/**
 * Auto-detect priority from text
 */
export function detectPriority(text: string): TaskPriority {
  const lower = text.toLowerCase()
  if (lower.includes('urgent') || lower.includes('non aktifkan') || lower.includes('darurat')) {
    return 'URGENT'
  }
  if (lower.includes('flash sale') || lower.includes('fs toko') || lower.includes('9.9') || lower.includes('10.10') || lower.includes('campaign') || lower.includes('pdp etalase varian') || lower.includes('bundling')) {
    return 'HIGH'
  }
  if (lower.includes('chat') || lower.includes('blast') || lower.includes('weekly monitor') || lower.includes('maklon')) {
    return 'NORMAL'
  }
  return 'NORMAL'
}

/**
 * Smart sorting function:
 * 1. Overdue tasks first
 * 2. Status IN_PROGRESS
 * 3. Priority URGENT
 * 4. Priority HIGH
 * 5. Earliest deadline
 * 6. Priority NORMAL
 * 7. Priority LOW
 */
export function sortTasksByPriority(tasks: StaffTaskItem[], referenceDate: Date = new Date('2026-09-07T12:00:00Z')): StaffTaskItem[] {
  return [...tasks].sort((a, b) => {
    // If completed, sink to bottom
    if (a.status === 'DONE' && b.status !== 'DONE') return 1
    if (b.status === 'DONE' && a.status !== 'DONE') return -1

    // If blocked, put near bottom of active list
    if (a.status === 'BLOCKED' && b.status !== 'BLOCKED') return 1
    if (b.status === 'BLOCKED' && a.status !== 'BLOCKED') return -1

    // Check overdue
    const aOverdue = isTaskOverdue(a, referenceDate)
    const bOverdue = isTaskOverdue(b, referenceDate)
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1

    // In Progress first
    if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1
    if (b.status === 'IN_PROGRESS' && a.status !== 'IN_PROGRESS') return 1

    // Priority score
    const scoreA = TASK_PRIORITY_CONFIG[a.priority]?.score || 2
    const scoreB = TASK_PRIORITY_CONFIG[b.priority]?.score || 2
    if (scoreA !== scoreB) return scoreB - scoreA

    // Order index
    return a.order_index - b.order_index
  })
}

/**
 * Check if a task is overdue
 */
export function isTaskOverdue(task: StaffTaskItem, referenceDate: Date = new Date()): boolean {
  if (task.status === 'DONE') return false
  if (!task.deadline) return false
  const deadlineDate = new Date(task.deadline)
  return deadlineDate < referenceDate
}

/**
 * Common daily routines
 */
export const DAILY_ROUTINES = [
  'balas chat di shopee pusat dan cabang + balas chat wa reseller/ maklon',
  'Login wa komunitas, blast 1 video di 2 grup wa>>',
  'add 1 mitra maklon baru ke my essent',
  'ganti pdp etalase varian di marketplace',
  'cek campaign dan setting flash sale toko',
]

/**
 * SOP Resolver
 */
export interface TaskSOP {
  objective: string
  platform: string
  steps: string[]
  parameters: string[]
  tips: string
}

export function getTaskSOP(taskText: string): TaskSOP {
  const lower = taskText.toLowerCase()

  if (lower.includes('chat') && (lower.includes('shopee') || lower.includes('wa'))) {
    return {
      objective: 'Mempertahankan SLA respon chat di bawah 5 menit dan mengonversi konsultasi pembeli menjadi pesanan terbayar.',
      platform: 'Shopee Seller Centre & WhatsApp Web',
      steps: [
        'Buka portal Web Chat Shopee Toko Pusat dan Cabang Semarang.',
        'Saring tab "Belum Dibalas"; dahulukan calon pembeli yang menanyakan ketersediaan produk bundling.',
        'Gunakan template salam ramah: tanyakan tipe kulit (kering/jerawat/flek) lalu rekomendasikan bundling.',
        'Buka WhatsApp reseller/maklon, respon konfirmasi transfer atau status kirim resi.',
      ],
      parameters: ['Target response rate > 95%', 'Maksimal waktu tunggu respon 3 menit'],
      tips: 'Sisipkan voucher diskon toko di akhir chat jika pembeli belum menyelesaikan pembayaran (checkout pending).',
    }
  }

  if (lower.includes('fs toko') || lower.includes('flash sale')) {
    return {
      objective: 'Membuat lonjakan pesanan kilat (flash sale) dengan kuota terkontrol tanpa merusak batas bottom price.',
      platform: 'Shopee / Lazada / TikTok Seller Centre',
      steps: [
        'Buka Seller Centre > Promosi Saya > Flash Sale Toko Saya.',
        'Pilih sesi jam tayang (rekomendasi: jam 12:00 - 15:00 atau 19:00 - 22:00 WIB).',
        'Pilih SKU target: produk hero bundling atau produk slow-moving/near-ED.',
        'Atur harga diskon 10% - 15% (pastikan margin bersih tetap di atas 25%).',
        'Kunci kuota stok promo maksimal 50 - 100 pcs per sesi.',
        'Simpan dan aktifkan jadwal promo.',
      ],
      parameters: ['Diskon: 10% - 15%', 'Batas kuota stok: 50 - 100 pcs', 'Durasi: 3 jam per sesi'],
      tips: 'Pastikan foto produk sudah memakai frame promo resmi agar CTR pengunjung toko tinggi.',
    }
  }

  if (lower.includes('campaign') || lower.includes('nominasi')) {
    return {
      objective: 'Mengamankan slot partisipasi campaign marketplace resmi (9.9, 10.10, Gajian) untuk dorongan traffic organik.',
      platform: 'Shopee / Lazada Campaign Hub',
      steps: [
        'Buka Seller Centre > Menu Campaign / Promosi Marketplace.',
        'Cari nama campaign yang dituju (misal: "Shopee 10.10 Brands Festival" atau "Pesta Gajian Lazada").',
        'Pilih produk berstatus Eligible (layak).',
        'Masukkan diskon rekomendasi (4% - 6% sesuai panduan EcomPilot).',
        'Pastikan margin estimasi tidak jatuh di bawah batas 25%.',
        'Submit pendaftaran dan pantau approval oleh tim Regional Manager.',
      ],
      parameters: ['Batas pendaftaran: perhatikan closing time', 'Diskon maks: 5-8%'],
      tips: 'Jika ada SKU ditolak karena diskon kurang dalam, ajukan varian ukuran kecil/single saja.',
    }
  }

  if (lower.includes('pdp') || lower.includes('etalase') || lower.includes('bundling')) {
    return {
      objective: 'Menggabungkan beberapa produk ke dalam 1 etalase variasi terpadu untuk mendongkrak akumulasi ulasan dan AOV.',
      platform: 'Seller Centre & MyEssent ERP',
      steps: [
        'Buka menu Produk > Pengaturan Produk di Seller Centre.',
        'Pilih etalase produk utama (misal Gentle Facial Wash atau C-Booster Series).',
        'Aktifkan Variasi: masukkan opsi (Single 100ml, Bundling Extra Glow, Twinpack).',
        'Unggah foto per varian dengan visual jelas.',
        'Tautkan kode SKU varian baru ke MyEssent agar stok tersinkron.',
        'Arsipkan etalase produk lama yang masih berstatus single terpisah.',
      ],
      parameters: ['Satu etalase maksimal 10 varian', 'Foto varian wajib ukuran 1:1 resolusi tinggi'],
      tips: 'JANGAN menghapus produk lama secara permanen; cukup nonaktifkan/arsipkan agar riwayat penjualan toko tetap aman.',
    }
  }

  if (lower.includes('maklon') || lower.includes('mitra')) {
    return {
      objective: 'Mendokumentasikan calon mitra maklon / reseller baru ke ERP MyEssent agar segera di-follow up tim BD.',
      platform: 'MyEssent ERP (Modul Kemitraan)',
      steps: [
        'Buka MyEssent ERP > Menu Maklon & Kemitraan.',
        'Klik tombol "+ Tambah Mitra Baru".',
        'Isi profil: Nama PT/CV atau Perorangan, Kontak WhatsApp, Kota, dan Estimasi PO.',
        'Assign PIC: jika PT/CV assign ke Bu Ernita; jika perorangan/reseller assign ke Pak Ali.',
        'Simpan data dan kirim notifikasi singkat ke grup koordinasi maklon.',
      ],
      parameters: ['Nomor WA wajib aktif', 'SLA follow up 1x24 jam'],
      tips: 'Cantumkan sumber lead (misal: "Lead Dinda - Event Jabar" atau "Inbound WA").',
    }
  }

  if (lower.includes('closing') || lower.includes('monitor') || lower.includes('laporan')) {
    return {
      objective: 'Merekap realisasi penjualan, retur, biaya admin, dan margin bersih mingguan cabang tanpa ada selisih angka.',
      platform: 'Seller Centre Cabang & Modul Rekap Closing EcomPilot',
      steps: [
        'Download file Excel riwayat seluruh pesanan dari Seller Centre Cabang Semarang.',
        'Buka menu Rekap Closing Promo di EcomPilot.',
        'Upload file pesanan (.xlsx / .csv); sistem akan otomatis menyaring pesanan selesai dan mengeluarkan retur/batal.',
        'Periksa ringkasan Gross GMV, Net Revenue, Diskon, dan Biaya Ongkir.',
        'Cocokkan angka mutasi saldo penghasilan di dompet marketplace.',
        'Ekspor ringkasan rekap dan laporkan ke grup koordinasi mingguan.',
      ],
      parameters: ['Status pesanan: Selesai / Terkirim saja', 'Pisahkan toko pusat dan cabang'],
      tips: 'Gunakan fitur upload otomatis di EcomPilot untuk menghemat waktu rekap manual hingga 80%.',
    }
  }

  return {
    objective: 'Menjalankan eksekusi operasional harian secara disiplin sesuai standar kerja marketplace EcomPilot.',
    platform: 'Marketplace Seller Centre & WhatsApp',
    steps: [
      'Pahami deskripsi tugas dan periksa kelengkapan materi/data yang dibutuhkan.',
      'Lakukan eksekusi pada portal marketplace atau sistem ERP yang bersangkutan.',
      'Lakukan pengecekan ulang sebelum mempublikasikan promo atau menyimpan perubahan.',
      'Tandai checklist to-do list sebagai selesai setelah diverifikasi berhasil.',
    ],
    parameters: ['Perhatikan batas waktu pengerjaan', 'Koordinasikan dengan PIC jika ada kendala'],
    tips: 'Jika ragu mengenai margin harga promo, selalu konsultasikan dengan proteksi margin di EcomPilot.',
  }
}

/**
 * Standard Promo-based Workflow Template
 */
export const PROMO_WORKFLOW_TEMPLATES: Record<
  string,
  {
    preparation: { text: string; est: number; priority: TaskPriority }[]
    monitoring: { text: string; est: number; priority: TaskPriority }[]
    evaluation: { text: string; est: number; priority: TaskPriority }[]
  }
> = {
  'Flash Sale Toko': {
    preparation: [
      { text: 'Cek stok buffer produk hero di gudang pusat', est: 30, priority: 'HIGH' },
      { text: 'Cek batas harga diskon aman di Margin Protection', est: 20, priority: 'URGENT' },
      { text: 'Setup Flash Sale Toko sesi 12-15 & 19-22 di Seller Centre', est: 45, priority: 'URGENT' },
      { text: 'Pasang frame foto promo resmi pada etalase flash sale', est: 30, priority: 'HIGH' },
    ],
    monitoring: [
      { text: 'Monitor stok real-time saat sesi flash sale berjalan', est: 20, priority: 'HIGH' },
      { text: 'Monitor kecepatan respon chat dan tanya jawab stok', est: 30, priority: 'NORMAL' },
    ],
    evaluation: [
      { text: 'Rekap total GMV dan jumlah pesanan hasil flash sale', est: 30, priority: 'HIGH' },
      { text: 'Catat SKU terlaris dan evaluasi sisa stok untuk event berikutnya', est: 20, priority: 'NORMAL' },
    ],
  },
  'Mega Campaign 9.9 / 10.10': {
    preparation: [
      { text: 'Saring SKU eligible untuk Double Date Campaign di Seller Centre', est: 30, priority: 'HIGH' },
      { text: 'Nominasikan produk & diskon 4-6% sebelum deadline pendaftaran', est: 45, priority: 'URGENT' },
      { text: 'Request materi banner double date ke Ka Vanny', est: 20, priority: 'HIGH' },
      { text: 'Setup Voucher Toko & Voucher Follower baru periode event', est: 30, priority: 'HIGH' },
    ],
    monitoring: [
      { text: 'Pantau status approval campaign oleh RM marketplace', est: 15, priority: 'URGENT' },
      { text: 'Monitor trafik live stream marathon & lonjakan pesanan', est: 45, priority: 'HIGH' },
    ],
    evaluation: [
      { text: 'Rekap closingan hasil campaign via EcomPilot', est: 60, priority: 'HIGH' },
      { text: 'Evaluasi ROAS ads dan net profit margin toko', est: 30, priority: 'NORMAL' },
    ],
  },
}

/**
 * Rich Initial Seed Data for Shalwa & Nandila with Priorities, Statuses, Deadlines, and Blockers
 */
export const INITIAL_STAFF_TASKS_SEED_V2: Record<
  StaffName,
  {
    notes: string
    tasks: {
      day_of_week: DayOfWeek | 'Backlog'
      date_str: string
      task_text: string
      description?: string
      category: TaskCategory
      priority: TaskPriority
      status: TaskStatus
      marketplace?: string
      promo_name?: string
      promo_stage?: PromoStage
      deadline?: string
      estimated_minutes: number
      blocked_reason?: string
      is_completed: boolean
    }[]
  }
> = {
  Shalwa: {
    notes:
      'Prioritas On-Boarding & Marketplace Specialist:\n1. Pelajari product knowledge & kuasai setting campaign/flash sale Shopee & Lazada.\n2. Kuasai bundling produk, connect etalase ke my essent, dan laporan closingan weekly.',
    tasks: [
      // HARI SENIN (Hari Ini)
      {
        day_of_week: 'Senin',
        date_str: '09/07/26',
        task_text: 'Setup Flash Sale Live & Toko Shopee 8-10 & 10-24 September',
        description: 'Setting slot flash sale toko dan keranjang live stream dengan diskon hemat 12-15%. Pastikan buffer stok aman.',
        category: 'PROMO',
        priority: 'URGENT',
        status: 'IN_PROGRESS',
        marketplace: 'Shopee',
        promo_name: 'Flash Sale September',
        promo_stage: 'PREPARATION',
        deadline: '2026-09-07T14:00:00Z',
        estimated_minutes: 60,
        is_completed: false,
      },
      {
        day_of_week: 'Senin',
        date_str: '09/07/26',
        task_text: 'Bantu Setting Promo Double Date Shopee 9.9 Super Shopping Day',
        description: 'Daftarkan 8 SKU unggulan C-Booster Series dan Facial Wash ke campaign 9.9 Shopee.',
        category: 'PROMO',
        priority: 'HIGH',
        status: 'TODO',
        marketplace: 'Shopee',
        promo_name: 'Shopee 9.9 Super Shopping Day',
        promo_stage: 'PREPARATION',
        deadline: '2026-09-07T16:00:00Z',
        estimated_minutes: 45,
        is_completed: false,
      },
      {
        day_of_week: 'Senin',
        date_str: '09/07/26',
        task_text: 'Bikin Bundling Paket Extra Glow + Facial Wash di Etalase Varian',
        description: 'Buat etalase variasi baru Extra Glow Series + Facial Wash untuk mendongkrak AOV pelanggan.',
        category: 'PROJECT',
        priority: 'HIGH',
        status: 'TODO',
        marketplace: 'Shopee / Lazada',
        promo_name: 'Bundling Glow Hemat',
        promo_stage: 'PREPARATION',
        deadline: '2026-09-07T17:00:00Z',
        estimated_minutes: 60,
        is_completed: false,
      },
      {
        day_of_week: 'Senin',
        date_str: '09/07/26',
        task_text: 'Bantu Balas Chat Toko Cabang Semarang & Toko Pusat',
        description: 'Tuntaskan antrean inbox chat di bawah 5 menit respon, terutama calon pembeli bundling.',
        category: 'ROUTINE',
        priority: 'NORMAL',
        status: 'TODO',
        marketplace: 'Shopee',
        estimated_minutes: 30,
        is_completed: false,
      },
      {
        day_of_week: 'Senin',
        date_str: '09/07/26',
        task_text: 'Belajar Isi Weekly Monitor Cabang Semarang',
        description: 'Pelajari cara penarikan data transaksi cabang semarang dan input ke spreadsheet weekly monitor.',
        category: 'MONITORING',
        priority: 'NORMAL',
        status: 'DONE',
        marketplace: 'Shopee',
        estimated_minutes: 45,
        is_completed: true,
      },
      {
        day_of_week: 'Senin',
        date_str: '09/07/26',
        task_text: 'Setup Promo 9.9 Cuci Gudang Lazada',
        description: 'Menunggu konfirmasi daftar harga bottom price dari tim Finance sebelum submit pendaftaran.',
        category: 'PROMO',
        priority: 'HIGH',
        status: 'BLOCKED',
        marketplace: 'Lazada',
        promo_name: 'Lazada 9.9 Cuci Gudang',
        blocked_reason: 'Menunggu approval guardrail harga dari tim Finance',
        estimated_minutes: 45,
        is_completed: false,
      },
      {
        day_of_week: 'Senin',
        date_str: '09/07/26',
        task_text: 'Cek List Product Cuci Gudang yang Masih Belum Masuk',
        description: 'Deadline seharusnya kemarin hari Minggu sebelum event mulai.',
        category: 'PROMO',
        priority: 'URGENT',
        status: 'TODO',
        marketplace: 'Shopee',
        deadline: '2026-09-06T18:00:00Z', // Overdue!
        estimated_minutes: 30,
        is_completed: false,
      },

      // SELASA
      {
        day_of_week: 'Selasa',
        date_str: '09/08/26',
        task_text: 'Setting Campaign Lazada Pesta Gajian September',
        category: 'PROMO',
        priority: 'HIGH',
        status: 'TODO',
        marketplace: 'Lazada',
        promo_name: 'Pesta Gajian September',
        estimated_minutes: 45,
        is_completed: false,
      },
      {
        day_of_week: 'Selasa',
        date_str: '09/08/26',
        task_text: 'Bikin Bundling Paket C-Booster Serum + Face Cream di Etalase Varian',
        category: 'PROJECT',
        priority: 'HIGH',
        status: 'TODO',
        marketplace: 'Shopee / Lazada',
        estimated_minutes: 60,
        is_completed: false,
      },
      {
        day_of_week: 'Selasa',
        date_str: '09/08/26',
        task_text: 'Bantu Balas Chat Cabang Semarang dan Pusat',
        category: 'ROUTINE',
        priority: 'NORMAL',
        status: 'TODO',
        marketplace: 'Shopee',
        estimated_minutes: 30,
        is_completed: false,
      },

      // RABU
      {
        day_of_week: 'Rabu',
        date_str: '09/09/26',
        task_text: 'On-boarding, Pelajari Product Knowledge Theraskin Acne & Aging',
        category: 'PROJECT',
        priority: 'NORMAL',
        status: 'TODO',
        estimated_minutes: 60,
        is_completed: false,
      },
      {
        day_of_week: 'Rabu',
        date_str: '09/09/26',
        task_text: 'Bantu Set Flash Sale Toko 8-10 September',
        category: 'PROMO',
        priority: 'HIGH',
        status: 'TODO',
        marketplace: 'Shopee',
        estimated_minutes: 45,
        is_completed: false,
      },

      // KAMIS
      {
        day_of_week: 'Kamis',
        date_str: '09/10/26',
        task_text: 'Belajar Bundling Produk & Connect Produk Bundling ke MyEssent',
        category: 'PROJECT',
        priority: 'HIGH',
        status: 'TODO',
        marketplace: 'MyEssent',
        estimated_minutes: 60,
        is_completed: false,
      },
      {
        day_of_week: 'Kamis',
        date_str: '09/10/26',
        task_text: 'Bantu Set Flash Sale Toko 11-24 September Shopee',
        category: 'PROMO',
        priority: 'HIGH',
        status: 'TODO',
        marketplace: 'Shopee',
        estimated_minutes: 45,
        is_completed: false,
      },

      // JUMAT
      {
        day_of_week: 'Jumat',
        date_str: '09/11/26',
        task_text: 'Belajar Closingan Weekly Cabang Semarang via Menu Closing EcomPilot',
        category: 'MONITORING',
        priority: 'URGENT',
        status: 'TODO',
        marketplace: 'Shopee Cabang',
        estimated_minutes: 90,
        is_completed: false,
      },

      // BACKLOG (Belum terjadwal)
      {
        day_of_week: 'Backlog',
        date_str: 'Backlog',
        task_text: 'Riset Desain Banner Etalase Toko untuk Campaign 10.10',
        category: 'PROJECT',
        priority: 'NORMAL',
        status: 'TODO',
        estimated_minutes: 60,
        is_completed: false,
      },
      {
        day_of_week: 'Backlog',
        date_str: 'Backlog',
        task_text: 'Cek Potensi Produk Baru NPD C-Booster Series untuk Live Streaming',
        category: 'PROMO',
        priority: 'HIGH',
        status: 'TODO',
        estimated_minutes: 45,
        is_completed: false,
      },
    ],
  },
  Nandila: {
    notes:
      '1. ganti pdp etalase varian dan aktifkan etalase nya (yg masih single dan tdk ada varian dijadikan 1 etalase, varian lama tdk usah diaktifkan/diarsipkan)\n2. non aktifkan harga diskon full month bulan Agustus> yg on september hanya bundling c-booster di tgl 4',
    tasks: [
      // HARI SENIN (Hari Ini)
      {
        day_of_week: 'Senin',
        date_str: '09/07/26',
        task_text: 'Non-aktifkan Harga Diskon Full Month Bulan Agustus (Row 250)',
        description: 'Matikan diskon coret 30 hari di Shopee; hanya pertahankan bundling C-Booster dan ganti ke flash sale per-event.',
        category: 'PROMO',
        priority: 'URGENT',
        status: 'IN_PROGRESS',
        marketplace: 'Shopee',
        promo_name: 'Pembersihan Diskon Full-Month',
        deadline: '2026-09-07T12:00:00Z',
        estimated_minutes: 45,
        is_completed: false,
      },
      {
        day_of_week: 'Senin',
        date_str: '09/07/26',
        task_text: 'Setting Flash Sale Toko Shopee Cabang 7-10 September (Near-ED & Slow-Mo)',
        description: 'Alokasikan slot flash sale cabang Semarang jam 12-15 & 19-22 untuk percepatan stok slow-moving.',
        category: 'PROMO',
        priority: 'HIGH',
        status: 'TODO',
        marketplace: 'Shopee Cabang',
        promo_name: 'Flash Sale Toko Cabang',
        deadline: '2026-09-07T14:30:00Z',
        estimated_minutes: 60,
        is_completed: false,
      },
      {
        day_of_week: 'Senin',
        date_str: '09/07/26',
        task_text: 'Ajarin Shalwa Shopee Cabang & Buat Bundling di Marketplace Connect MyEssent',
        description: 'Mentoring operasional dan SOP teknis integrasi bundling ke ERP.',
        category: 'PROJECT',
        priority: 'HIGH',
        status: 'TODO',
        marketplace: 'MyEssent',
        deadline: '2026-09-07T16:00:00Z',
        estimated_minutes: 60,
        is_completed: false,
      },
      {
        day_of_week: 'Senin',
        date_str: '09/07/26',
        task_text: 'Balas Chat di Shopee Pusat & Cabang + WA Reseller/Maklon',
        category: 'ROUTINE',
        priority: 'NORMAL',
        status: 'TODO',
        marketplace: 'Shopee & WA',
        estimated_minutes: 30,
        is_completed: false,
      },
      {
        day_of_week: 'Senin',
        date_str: '09/07/26',
        task_text: 'Login WA Komunitas, Blast 1 Video di 2 Grup WA',
        category: 'ROUTINE',
        priority: 'NORMAL',
        status: 'DONE',
        marketplace: 'WhatsApp',
        estimated_minutes: 30,
        is_completed: true,
      },
      {
        day_of_week: 'Senin',
        date_str: '09/07/26',
        task_text: 'Request Banner Desain Double Date ke Ka Vanny',
        description: 'Menunggu konfirmasi ketersediaan antrean antrian grafis Ka Vanny.',
        category: 'PROJECT',
        priority: 'HIGH',
        status: 'BLOCKED',
        marketplace: 'Shopee',
        blocked_reason: 'Menunggu Ka Vanny selesai revisi banner campaign TikTok',
        estimated_minutes: 30,
        is_completed: false,
      },
      {
        day_of_week: 'Senin',
        date_str: '09/07/26',
        task_text: 'Cek Ads Shopee Cabang (Aktif s/d 10 Sep)',
        description: 'Harusnya diperiksa pagi hari sebelum traffic peak jam 11.',
        category: 'MONITORING',
        priority: 'URGENT',
        status: 'TODO',
        marketplace: 'Shopee Cabang',
        deadline: '2026-09-06T17:00:00Z', // Overdue!
        estimated_minutes: 30,
        is_completed: false,
      },

      // SELASA
      {
        day_of_week: 'Selasa',
        date_str: '09/08/26',
        task_text: 'Ganti PDP Etalase Varian di TikTok dan Lazada & Arsipkan Single Lama (Row 249)',
        category: 'PROJECT',
        priority: 'HIGH',
        status: 'TODO',
        marketplace: 'TikTok & Lazada',
        estimated_minutes: 60,
        is_completed: false,
      },
      {
        day_of_week: 'Selasa',
        date_str: '09/08/26',
        task_text: 'Add 1 Mitra Maklon PT/CV Baru, Assign ke Bu Ernita di MyEssent',
        category: 'PROJECT',
        priority: 'NORMAL',
        status: 'TODO',
        marketplace: 'MyEssent',
        estimated_minutes: 30,
        is_completed: false,
      },

      // RABU
      {
        day_of_week: 'Rabu',
        date_str: '09/09/26',
        task_text: 'Setting Promo Flash Sale Shopee tgl 19 s/d 25 September',
        category: 'PROMO',
        priority: 'HIGH',
        status: 'TODO',
        marketplace: 'Shopee',
        estimated_minutes: 45,
        is_completed: false,
      },
      {
        day_of_week: 'Rabu',
        date_str: '09/09/26',
        task_text: 'Nominasikan Campaign Gajian Sale 10.10 Brand Festival',
        category: 'PROMO',
        priority: 'HIGH',
        status: 'TODO',
        marketplace: 'Shopee',
        estimated_minutes: 45,
        is_completed: false,
      },

      // KAMIS
      {
        day_of_week: 'Kamis',
        date_str: '09/10/26',
        task_text: 'Add 1 Mitra Maklon Baru ke MyEssent, Assign ke Pak Ali',
        category: 'PROJECT',
        priority: 'NORMAL',
        status: 'TODO',
        marketplace: 'MyEssent',
        estimated_minutes: 30,
        is_completed: false,
      },
      {
        day_of_week: 'Kamis',
        date_str: '09/10/26',
        task_text: 'Nominasikan Campaign Gajian TikTok Shop',
        category: 'PROMO',
        priority: 'HIGH',
        status: 'TODO',
        marketplace: 'TikTok Shop',
        estimated_minutes: 45,
        is_completed: false,
      },

      // JUMAT
      {
        day_of_week: 'Jumat',
        date_str: '09/11/26',
        task_text: 'Setting Flash Sale Toko Lazada Periode Gajian',
        category: 'PROMO',
        priority: 'HIGH',
        status: 'TODO',
        marketplace: 'Lazada',
        estimated_minutes: 45,
        is_completed: false,
      },
      {
        day_of_week: 'Jumat',
        date_str: '09/11/26',
        task_text: 'Buat Plan Pembagian Budget Ads Shopee Cabang',
        category: 'MONITORING',
        priority: 'URGENT',
        status: 'TODO',
        marketplace: 'Shopee Cabang',
        estimated_minutes: 60,
        is_completed: false,
      },

      // BACKLOG
      {
        day_of_week: 'Backlog',
        date_str: 'Backlog',
        task_text: 'Review Potensi Lead Maklon Event PAAS Jabar & Muslim Vest',
        category: 'PROJECT',
        priority: 'HIGH',
        status: 'TODO',
        marketplace: 'MyEssent',
        estimated_minutes: 45,
        is_completed: false,
      },
      {
        day_of_week: 'Backlog',
        date_str: 'Backlog',
        task_text: 'Optimasi Judul Produk dan Kata Kunci SEO Etalase Baru',
        category: 'PROJECT',
        priority: 'NORMAL',
        status: 'TODO',
        marketplace: 'Shopee',
        estimated_minutes: 60,
        is_completed: false,
      },
    ],
  },
}
