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
 * Smart SOP Guidance Interface
 */
export interface TaskSOP {
  objective: string
  platform: string
  steps: string[]
  parameters: string[]
  tips: string
}

/**
 * Smart SOP Resolver: memberikan panduan langkah demi langkah praktis
 * agar staff (Shalwa & Nandila) tidak bingung saat menjalankan tugas!
 */
export function getTaskSOP(taskText: string): TaskSOP {
  const lower = taskText.toLowerCase()

  if (lower.includes('chat') && (lower.includes('shopee') || lower.includes('wa'))) {
    return {
      objective: 'Mempertahankan SLA respon chat di bawah 5 menit dan mengonversi konsultasi pembeli menjadi transaksi checkout.',
      platform: 'Shopee Seller Centre & WhatsApp Web',
      steps: [
        'Buka portal Web Chat Shopee untuk Toko Pusat dan Toko Cabang Semarang.',
        'Saring tab "Belum Dibalas" terlebih dahulu; prioritaskan pesan yang menanyakan stok produk promo.',
        'Gunakan template salam ramah: perkenalkan diri, tanyakan keluhan kulit pembeli (tipe kering/jerawat/flek), dan berikan rekomendasi bundling hemat.',
        'Buka WhatsApp Web reseller/maklon, respon pertanyaan harga grosir atau status pengiriman resi.',
      ],
      parameters: ['Target response rate > 95%', 'Waktu respon maksimal 3 menit di jam operasional (08.00 - 21.00)'],
      tips: 'Selalu sisipkan voucher diskon toko di akhir chat jika pembeli belum menyelesaikan pembayaran (checkout tapi pending).',
    }
  }

  if (lower.includes('komunitas') || lower.includes('blast')) {
    return {
      objective: 'Membangun interaksi rutin di grup komunitas pelanggan dan mengarahkan traffic gratis langsung ke etalase promo.',
      platform: 'WhatsApp Komunitas (2 Grup Resmi)',
      steps: [
        'Login ke WhatsApp Web khusus nomor broadcast komunitas.',
        'Siapkan 1 video materi edukasi atau testimoni before-after dari tim konten.',
        'Tulis caption pemikat: sebutkan promo terbatas hari ini (misal Flash Sale Toko atau Diskon Double Date).',
        'Sertakan link etalase resmi toko Shopee/TikTok dengan parameter voucher toko.',
        'Kirim broadcast ke Grup 1 dan Grup 2 di jam aktif audiens (11.30 - 13.00 WIB).',
      ],
      parameters: ['Maksimal 1 broadcast per hari agar member tidak merasa terganggu', 'Gunakan link pendek resmi'],
      tips: 'Pantau 10 menit setelah blast untuk merespon langsung pertanyaan member di dalam grup.',
    }
  }

  if (lower.includes('fs toko') || lower.includes('flash sale toko')) {
    return {
      objective: 'Membuat lonjakan pesanan kilat (flash sale) dengan kuota terkontrol tanpa merusak bottom price margin.',
      platform: 'Shopee / Lazada / TikTok Seller Centre',
      steps: [
        'Buka Seller Centre > Pusat Pemasaran > Flash Sale Toko Saya.',
        'Pilih tanggal dan sesi jam tayang (rekomendasi: jam 12:00 - 15:00 atau 19:00 - 22:00 WIB).',
        'Pilih SKU target: prioritaskan produk hero bundling atau produk stok banyak / slow-moving.',
        'Atur harga promo: pastikan diskon berada di kisaran 10% - 15% (wajib di atas bottom price Finance).',
        'Kunci kuota stok promo (misal 50 - 100 pcs per sesi agar tidak over-commit di gudang).',
        'Simpan dan aktifkan jadwal promo.',
      ],
      parameters: ['Diskon: 10% - 15%', 'Batas stok promo: 50 - 100 pcs', 'Durasi: 3 jam per sesi'],
      tips: 'Pastikan gambar produk flash sale sudah menggunakan frame promo resmi berwarna mencolok.',
    }
  }

  if (lower.includes('campaign') || lower.includes('nominasikan')) {
    return {
      objective: 'Mengamankan slot partisipasi campaign marketplace resmi (9.9, 10.10, Gajian/Payday, Mall Monday) untuk lonjakan traffic organik.',
      platform: 'Shopee / Lazada / TikTok Campaign Hub',
      steps: [
        'Buka Seller Centre > Menu Campaign / Promosi Marketplace.',
        'Cari nama campaign yang dituju (misal: "Shopee 10.10 Brands Festival" atau "Pesta Gajian Lazada").',
        'Klik "Nominasikan Produk" / "Join Campaign".',
        'Saring produk yang berstatus Eligible (layak).',
        'Masukkan diskon rekomendasi sistem (rekomendasi 4% - 6% sesuai panduan EcomPilot).',
        'Cek estimasi margin: jangan setujui jika margin bersih jatuh di bawah 25%.',
        'Submit pendaftaran dan pantau status persetujuan oleh tim Regional Manager (RM).',
      ],
      parameters: ['Batas pendaftaran: perhatikan tanggal closing registrasi', 'Diskon maks: 5-8%'],
      tips: 'Jika ada SKU rejected karena harga kurang murah, sesuaikan hanya untuk varian ukuran kecil/single.',
    }
  }

  if (lower.includes('pdp') || lower.includes('etalase varian') || lower.includes('bundling')) {
    return {
      objective: 'Menggabungkan beberapa produk ke dalam 1 etalase variasi terpadu untuk mendongkrak akumulasi ulasan dan nilai keranjang (AOV).',
      platform: 'Seller Centre (Shopee, Lazada, TikTok) & MyEssent ERP',
      steps: [
        'Buka menu Produk > Pengaturan Produk di Seller Centre.',
        'Pilih etalase produk utama (misal Facial Wash atau C-Booster Series).',
        'Aktifkan toggle Variasi: buat kelompok variasi (misal: Single 100ml, Paket Bundling Extra Glow, Twinpack).',
        'Unggah foto per varian dengan visual jelas dan banner hemat.',
        'Tautkan kode SKU varian baru ke MyEssent agar stok tersinkron dengan gudang pusat.',
        'Arsipkan etalase produk lama yang masih berstatus single terpisah agar traffic terpusat ke link baru.',
      ],
      parameters: ['Satu etalase maksimal 10 variasi', 'Foto varian wajib ukuran 1:1 resolusi tinggi'],
      tips: 'JANGAN menghapus produk lama secara permanen; cukup nonaktifkan/arsipkan agar riwayat penjualan toko tetap aman.',
    }
  }

  if (lower.includes('maklon') || lower.includes('mitra')) {
    return {
      objective: 'Mendokumentasikan calon mitra maklon / reseller baru ke database ERP MyEssent agar segera diproses follow up oleh tim Business Development.',
      platform: 'MyEssent ERP (Modul Kemitraan)',
      steps: [
        'Buka aplikasi web MyEssent ERP > Menu Maklon & Kemitraan.',
        'Klik tombol "+ Tambah Mitra Baru".',
        'Isi profil: Nama Perusahaan (PT/CV) atau Nama Perorangan, Nomor Kontak WhatsApp, Kota, dan Estimasi Kebutuhan Produk.',
        'Pilih PIC Assignee:',
        '   - Jika mitra berbadan hukum (PT/CV) → Assign ke Bu Ernita.',
        '   - Jika reseller perorangan / agen → Assign ke Pak Ali.',
        'Simpan data dan kirim notifikasi singkat ke grup koordinasi maklon.',
      ],
      parameters: ['Nomor WA wajib aktif', 'SLA follow up maksimal 1x24 jam setelah data diinput'],
      tips: 'Pastikan mencantumkan asal data (misal: "Lead Dinda - Event Jabar" atau "Inbound WA").',
    }
  }

  if (lower.includes('closing') || lower.includes('monitor') || lower.includes('weekly report')) {
    return {
      objective: 'Merekap realisasi penjualan, retur, biaya admin, dan margin bersih mingguan cabang tanpa ada selisih angka.',
      platform: 'Seller Centre Cabang & Modul Rekap Closing EcomPilot',
      steps: [
        'Download file Excel riwayat seluruh pesanan dari Seller Centre Cabang Semarang.',
        'Buka menu Rekap Closing Promo di EcomPilot.',
        'Upload file pesanan (.xlsx / .csv); sistem akan otomatis menyaring pesanan selesai dan mengeluarkan pesanan dibatalkan.',
        'Periksa ringkasan Gross GMV, Net Revenue, Potongan Diskon, dan Biaya Ongkir.',
        'Cocokkan angka mutasi saldo penghasilan di dompet marketplace.',
        'Ekspor ringkasan rekap dan laporkan ke grup koordinasi mingguan.',
      ],
      parameters: ['Status pesanan: Selesai / Terkirim saja', 'Pisahkan toko pusat dan cabang'],
      tips: 'Gunakan fitur upload otomatis di EcomPilot untuk menghemat waktu rekap manual hingga 80%.',
    }
  }

  // Default Fallback SOP
  return {
    objective: 'Menjalankan eksekusi operasional harian secara disiplin sesuai standar kerja marketplace EcomPilot.',
    platform: 'Marketplace Seller Centre & WhatsApp',
    steps: [
      'Pahami deskripsi tugas dan periksa kelengkapan materi/data yang dibutuhkan.',
      'Lakukan eksekusi pada portal marketplace atau sistem ERP yang bersangkutan.',
      'Lakukan pengecekan ulang (double-check) sebelum mempublikasikan promo atau menyimpan perubahan.',
      'Tandai checklist to-do list sebagai selesai setelah diverifikasi berhasil.',
    ],
    parameters: ['Perhatikan batas waktu pengerjaan', 'Koordinasikan dengan supervisor jika ada kendala sistem'],
    tips: 'Jika ragu mengenai margin harga promo, selalu konsultasikan dengan proteksi margin di EcomPilot.',
  }
}

/**
 * Smart AI & Operational Recommendations specifically for Shalwa & Nandila
 */
export interface StaffRecommendationItem {
  id: string
  staff_name: 'Shalwa' | 'Nandila'
  title: string
  short_action: string
  reason: string
  priority: 'Urgent' | 'High' | 'Medium'
  priority_color: string
  category: string
  target_day: DayOfWeek
  suggested_discount?: string
  suggested_skus?: string[]
  deadline?: string
  badge_label: string
}

export const STAFF_RECOMMENDATIONS: StaffRecommendationItem[] = [
  // Rekomendasi untuk SHALWA
  {
    id: 'rec-sh-1',
    staff_name: 'Shalwa',
    title: 'Buat Bundling Varian Extra Glow & C-Booster di Etalase Varian',
    short_action: 'bikin bundling paket extra glow + fw & c-booster di etalase varian',
    reason: 'Data penjualan menunjukkan 34% pembeli C-Booster Serum membeli Facial Wash secara terpisah. Menggabungkannya ke 1 etalase varian meningkatkan basket size pembeli dan menghemat biaya promosi.',
    priority: 'Urgent',
    priority_color: '#ef4444',
    category: 'PDP',
    target_day: 'Senin',
    suggested_discount: 'Diskon 12% - 15% (Margin aman: 31%)',
    suggested_skus: ['C-Booster Serum 20ml', 'Gentle Facial Wash 100ml', 'Extra Glow Day Cream'],
    deadline: 'Senin, 14:00 WIB',
    badge_label: 'Prioritas Hari Ini',
  },
  {
    id: 'rec-sh-2',
    staff_name: 'Shalwa',
    title: 'Nominasikan Campaign 9.9 Super Shopping Day Shopee & Gajian Lazada',
    short_action: 'setting campaign 9.9 shopee & nominasikan pesta gajian lazada',
    reason: 'Pendaftaran event Mega Campaign 9.9 akan ditutup dalam waktu dekat. Slot traffic Shopee Mall & Lazada Pesta Gajian berpotensi menaikkan GMV hingga 3.2x lipat baseline.',
    priority: 'Urgent',
    priority_color: '#ef4444',
    category: 'Campaign',
    target_day: 'Selasa',
    suggested_discount: 'Diskon 4% - 6% (Proteksi bottom price aman)',
    suggested_skus: ['C-Booster Series Bundling', 'Age Revival Twinpack', 'Theraskin Men Multi Action'],
    deadline: 'Selasa, 18:00 WIB',
    badge_label: 'Deadline Registrasi',
  },
  {
    id: 'rec-sh-3',
    staff_name: 'Shalwa',
    title: 'Review Kuota Voucher Toko NPD C-Booster & Voucher Member Baru',
    short_action: 'cek kuota voucher toko npd c-booster & perpanjang voucher klaim',
    reason: 'Sisa kuota klaim voucher toko 10% untuk produk baru NPD C-Booster tinggal sedikit. Perpanjang kuota agar konversi calon pembeli baru tidak drop.',
    priority: 'High',
    priority_color: '#f97316',
    category: 'Promo',
    target_day: 'Rabu',
    suggested_discount: 'Voucher 10% Min Belanja Rp 120.000',
    suggested_skus: ['Seluruh SKU C-Booster Series & Men'],
    deadline: 'Rabu, 16:00 WIB',
    badge_label: 'Optimasi Konversi',
  },
  {
    id: 'rec-sh-4',
    staff_name: 'Shalwa',
    title: 'Rekap Closingan Weekly Cabang Semarang Pakai Menu Closing EcomPilot',
    short_action: 'rekap closingan weekly cabang semarang via ecompilot',
    reason: 'Gunakan fitur upload otomatis file pesanan Shopee Cabang Semarang di EcomPilot agar perhitungan pesanan selesai vs retur 100% akurat tanpa perlu hitung rumus manual di spreadsheet.',
    priority: 'High',
    priority_color: '#f97316',
    category: 'Closing',
    target_day: 'Jumat',
    suggested_discount: 'Cek netto margin setelah potongan fee admin marketplace',
    suggested_skus: ['Toko Shopee Cabang Semarang'],
    deadline: 'Jumat, 17:00 WIB',
    badge_label: 'SOP Pelaporan',
  },

  // Rekomendasi untuk NANDILA
  {
    id: 'rec-na-1',
    staff_name: 'Nandila',
    title: 'Non-aktifkan Harga Diskon Full Month & Beralih ke Diskon Per-Event (Row 250)',
    short_action: 'non aktifkan harga diskon full month ganti ke diskon per event',
    reason: 'Instruksi baris 250 spreadsheet: harga coret full month 30 hari menekan margin toko secara permanen dan membuat promo event terasa tidak spesial. Matikan diskon full month, ganti dengan flash sale toko bertahap.',
    priority: 'Urgent',
    priority_color: '#ef4444',
    category: 'Promo',
    target_day: 'Senin',
    suggested_discount: 'Ganti ke Flash Sale Toko periodik 11-13 Sept',
    suggested_skus: ['Semua etalase lama kecuali C-Booster tgl 4'],
    deadline: 'Senin, 12:00 WIB',
    badge_label: 'Guardrail Margin',
  },
  {
    id: 'rec-na-2',
    staff_name: 'Nandila',
    title: 'Gabungkan PDP Etalase Varian & Arsipkan Etalase Single Lama (Row 249)',
    short_action: 'ganti pdp etalase varian dan arsipkan etalase single lama',
    reason: 'Instruksi baris 249 spreadsheet: produk yang masih single dan tidak ada varian dijadikan 1 etalase (single, twinpack, triplepack). Varian single lama diarsipkan agar pembeli tidak bingung dan algoritma rating terpusat.',
    priority: 'Urgent',
    priority_color: '#ef4444',
    category: 'PDP',
    target_day: 'Selasa',
    suggested_discount: 'Diskon bundling varian 12%',
    suggested_skus: ['AR Gentle Facial Wash', 'PDC Treatment Cream', 'AHA Series'],
    deadline: 'Selasa, 16:00 WIB',
    badge_label: 'Restrukturisasi Etalase',
  },
  {
    id: 'rec-na-3',
    staff_name: 'Nandila',
    title: 'Pasang Flash Sale Toko Shopee Cabang untuk Stok Near-ED & Slow-Moving',
    short_action: 'setting flash sale toko shopee cabang tgl 7-10 sep (near-ed & slowmo)',
    reason: 'Cabang Semarang memiliki cadangan stok slow-moving yang mendekati umur simpan. Alokasikan slot flash sale toko jam 12-15 & 19-22 untuk memacu perputaran barang tanpa mengganggu harga toko pusat.',
    priority: 'High',
    priority_color: '#f97316',
    category: 'Promo',
    target_day: 'Rabu',
    suggested_discount: 'Diskon kilat 12% - 15%, kuota 50 pcs/sesi',
    suggested_skus: ['SKU slow-moving Cabang Semarang'],
    deadline: 'Rabu, 11:30 WIB',
    badge_label: 'Pembersihan Inventori',
  },
  {
    id: 'rec-na-4',
    staff_name: 'Nandila',
    title: 'Follow Up & Assign Mitra Maklon Baru ke Pak Ali & Bu Ernita di MyEssent',
    short_action: 'add 1 mitra maklon baru ke my essent, assign pak ali / bu ernita',
    reason: 'Ada data calon mitra maklon potensial dari lead Dinda (event PAAS Jabar) dan inbound WA yang belum tercatat di ERP MyEssent. Segera input agar tim BD bisa kirim penawaran kontrak.',
    priority: 'High',
    priority_color: '#f97316',
    category: 'Maklon',
    target_day: 'Kamis',
    suggested_discount: 'Assign PT/CV ke Bu Ernita, Reseller ke Pak Ali',
    suggested_skus: ['Data Lead Event PAAS Jabar & Muslim Vest'],
    deadline: 'Kamis, 15:00 WIB',
    badge_label: 'Maklon SLA',
  },
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
