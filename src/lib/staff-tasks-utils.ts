export interface StaffTaskItem {
  id: string
  brand_id: string
  staff_name: string
  week_start: string | Date
  day_of_week: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat'
  date_str: string
  task_text: string
  category?: string | null
  is_completed: boolean
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

// Khusus Shalwa dan Nandila sesuai instruksi terbaru user
export const STAFF_LIST = ['Shalwa', 'Nandila'] as const
export type StaffName = (typeof STAFF_LIST)[number]

export const DAYS_OF_WEEK = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]

// Categories for nice badge styling
export const TASK_CATEGORIES = [
  { label: 'CS / Chat', value: 'CS', color: '#0284c7', bg: '#e0f2fe' },
  { label: 'Promo / Diskon', value: 'Promo', color: '#ea580c', bg: '#ffedd5' },
  { label: 'Campaign Marketplace', value: 'Campaign', color: '#7c3aed', bg: '#f5f3ff' },
  { label: 'Ads / Iklan', value: 'Ads', color: '#059669', bg: '#ecfdf5' },
  { label: 'Maklon / Mitra', value: 'Maklon', color: '#d97706', bg: '#fef3c7' },
  { label: 'PDP & Etalase', value: 'PDP', color: '#4f46e5', bg: '#eef2ff' },
  { label: 'Closing & Laporan', value: 'Closing', color: '#0d9488', bg: '#ccfbf1' },
  { label: 'Operasional', value: 'Operasional', color: '#475569', bg: '#f1f5f9' },
] as const

/**
 * Returns the Monday UTC 00:00:00 for the week containing `date`.
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday, 1 = Monday, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
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
 * Auto-detect category from task text
 */
export function detectCategory(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('chat') || lower.includes('komunitas') || lower.includes('inbox') || lower.includes('customer') || lower.includes('broadcast')) {
    return 'CS'
  }
  if (lower.includes('fs toko') || lower.includes('flash sale') || lower.includes('diskon') || lower.includes('voucher') || lower.includes('margin') || lower.includes('bottom price')) {
    return 'Promo'
  }
  if (lower.includes('campaign') || lower.includes('nominasi') || lower.includes('payday') || lower.includes('10.10') || lower.includes('9.9') || lower.includes('lazada') || lower.includes('shopee') || lower.includes('tiktok') || lower.includes('mall monday')) {
    return 'Campaign'
  }
  if (lower.includes('closing') || lower.includes('laporan') || lower.includes('report') || lower.includes('monitor')) {
    return 'Closing'
  }
  if (lower.includes('ads') || lower.includes('iklan') || lower.includes('roas') || lower.includes('budget ads') || lower.includes('kata kunci')) {
    return 'Ads'
  }
  if (lower.includes('maklon') || lower.includes('mitra')) {
    return 'Maklon'
  }
  if (lower.includes('pdp') || lower.includes('etalase') || lower.includes('deskripsi') || lower.includes('keyword') || lower.includes('varian') || lower.includes('bundling')) {
    return 'PDP'
  }
  return 'Operasional'
}

/**
 * Common daily routines for quick addition
 */
export const DAILY_ROUTINES = [
  'balas chat di shopee pusat dan cabang + balas chat wa reseller/ maklon',
  'Login wa komunitas, blast 1 video di 2 grup wa>>',
  'add 1 mitra maklon baru ke my essent',
  'ganti pdp etalase varian di marketplace',
  'cek campaign dan setting flash sale toko',
]

/**
 * Seed data extracted directly from user's Google Sheet:
 * https://docs.google.com/spreadsheets/d/1yYcWODA20a6piMhl0yCHCo1mNlt-BieYO7OKceI5DNw/edit
 * Khusus untuk Shalwa dan Nandila!
 */
export const INITIAL_STAFF_TASKS_SEED: Record<
  string,
  {
    notes: string
    tasks: Record<DayOfWeek, string[]>
  }
> = {
  Shalwa: {
    notes:
      'Prioritas On-Boarding & Marketplace Specialist:\n1. Pelajari product knowledge & kuasai setting campaign/flash sale Shopee & Lazada.\n2. Kuasai bundling produk, connect etalase ke my essent, dan laporan closingan weekly.',
    tasks: {
      Senin: [
        'Bantu setting buat promo double date shopee',
        'cek campaign apa aja yang di marketplace shopee',
        'belajar isi weekly monitor cabang',
        'setting campaign 9.9 shopee super shopping day',
        'setting flash sale live 8-10 dan 10-24 september shopee',
        'setting flash sale toko 8-10 dan 10-24 september shopee',
        'belajar closingan weekly cabang semarang',
      ],
      Selasa: [
        'bantu cek variasi bundling yang belum dimasukin ke etalase',
        'bikin bundling paket extra glow + facial wash dibuat etalase varian',
        'cek campaign apa aja yang bisa di ikutin di Lazada',
        'bikin bundling paket c-booster serum + Perfect Glow Face Cream di etalase varian',
        'cek list product campaign 9.9 cuci gudang yang masi belum masuk',
        'Bantu balas chat cabang semarang dan pusat',
        'Setting campaign lazada Pesta Gajian September',
      ],
      Rabu: [
        'On boarding, pelajari product knowledge',
        'Belajar Closingan mingguan',
        'Bantu set flash sale toko 8-10 september',
        'Bantu balas chat cabang semarang dan pusat',
        'Cek campaign gajian & kuota voucher toko',
      ],
      Kamis: [
        'Belajar Bundling produk dan connect produk bundling ke my essent',
        'Bantu set flash sale live streaming toko 11-24 september shopee',
        'Bantu set flash sale toko 11-24 september shopee',
        'Bantu balas chat cabang semarang dan pusat',
        'Review etalase varian bundling baru',
      ],
      Jumat: [
        'Rekap closingan weekly cabang semarang',
        'Cek status persetujuan campaign lazada & shopee',
        'Bantu balas chat cabang semarang dan pusat',
        'Evaluasi flash sale toko & promo weekend',
      ],
    },
  },
  Nandila: {
    notes:
      '1. ganti pdp etalase varian dan aktifkan etalase nya (yg masih single dan tdk ada varian dijadikan 1 etalase, varian lama tdk usah diaktifkan/diarsipkan)\n2. non aktifkan harga diskon full month bulan Agustus> yg on september hanya bundling c-booster di tgl 4',
    tasks: {
      Senin: [
        'balas chat di shopee pusat dan cabang + balas chat wa reseller/ maklon',
        'Login wa komunitas, blast 1 video di 2 grup wa>>',
        'isi weekly monitor cabang',
        'cek ads shopee cabang> aktif sd tgl 10 sep',
        'setting flash sale toko shopee cabang tgl 7-10 Sep',
        'add 2 mitra maklon baru di my essent, sudah di assign ke pak Ali dan Bu Ernita',
        'request design banner ke ka vanny sesuai kalender promo untuk periode double date tgl 8-10 september (diskon livestream dan diskon toko)',
        'cek campaign bulan ini di all mp yang belum di nominasikan> koleksi cuci gudang shopee tgl sd tgl 10 september',
        'setting promo payday di tiktok dan lazada',
        'ganti nama produk aha cream di tiktok dan lazada',
        'nge list produk bundling yang belum di buat',
        'ajarin shalwa shopee cabang dan buat bundling di marketplace dan connect ke myessent',
      ],
      Selasa: [
        'balas chat di shopee pusat dan cabang + balas chat wa reseller/ maklon',
        'Login wa komunitas, blast 1 video di 2 grup wa>>',
        'ganti pdp etalase varian di tiktok dan lazada',
        'add 1 mitra maklon PT/CV yang baru, di assign ke bu Ernita',
        'request pdp ke ka vanny untuk etalase varian tambahan',
        'setting promo bau di tiktok dan lazada',
        'nominasikan produk untuk join mall monday shopee tgl 14 september',
        'setting promo 9.9 mega campaign lazada (CBMO)',
        'cicil tambahkan etalase varian',
        'follow up list potential lead maklon dari data nya dinda',
      ],
      Rabu: [
        'balas chat di shopee pusat dan cabang + balas chat wa reseller/ maklon',
        'Login wa komunitas, blast 1 video di 2 grup wa>>',
        'setting promo flash sale shopee tgl 19 sd 25 september',
        'nominasikan campaign gajian sale 10.10 brand festival untuk 25 september - koleksi ingatkan diskon dan produk favorit hari ini',
        'add 1 mitra maklon baru di my essent, di assign ke pak Ali',
        'request pdp bundling etalase varian yang belum ada',
        'ganti pdp etalase varian',
      ],
      Kamis: [
        'balas chat di shopee pusat dan cabang + balas chat wa reseller/ maklon',
        'Login wa komunitas, blast 1 video di 2 grup wa>>',
        'add 1 mitra maklon baru, di assign ke pak Ali',
        'join campaign flash sale shopee',
        'nominasikan campaign gajian tiktok',
        'ganti pdp etalase varian',
      ],
      Jumat: [
        'balas chat di shopee pusat dan cabang + balas chat wa reseller/ maklon',
        'Login wa komunitas, blast 1 video di 2 grup wa>>',
        'setting flash sale toko lazada',
        'nominasikan flash sale shopee tgl 12-18 september',
        'ganti kode sku di excel shopee dan tiktok',
        'buat plan pembagian budget ads shopee cabang',
      ],
    },
  },
}
