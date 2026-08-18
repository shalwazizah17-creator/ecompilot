'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Upload } from 'lucide-react'

const DUMMY_SUMMARY = { total: 124, avgRating: 4.1, negative: 18, positive: 89, negativePct: 14.5 }
const DUMMY_CLUSTERS = [
  { topic: 'Shipping',    count: 7, pct: 38.9 },
  { topic: 'Packaging',  count: 4, pct: 22.2 },
  { topic: 'Quality',    count: 4, pct: 22.2 },
  { topic: 'Leakage',    count: 2, pct: 11.1 },
  { topic: 'Other',      count: 1, pct: 5.6  },
]
const DUMMY_DIST = { 5: 68, 4: 21, 3: 17, 2: 11, 1: 7 }
const DUMMY_REVIEWS = [
  { product_name: 'Serum Vitamin C 30ml', sku: 'SRM-VC-001', rating: 5, review_text: 'Produk bagus banget, kulit cerah dalam seminggu! Recommended!', sentiment: 'POSITIVE', complaint_topic: null },
  { product_name: 'Toner AHA 7%',         sku: 'TNR-AHA-02', rating: 2, review_text: 'Pengiriman sangat lambat, sudah 2 minggu belum sampai.', sentiment: 'NEGATIVE', complaint_topic: 'Shipping' },
  { product_name: 'Masker Clay Pore',     sku: 'MSK-CLY-04', rating: 1, review_text: 'Kemasan rusak saat tiba, botol pecah.', sentiment: 'NEGATIVE', complaint_topic: 'Packaging' },
  { product_name: 'Pelembab SPF30',       sku: 'PLM-SPF-03', rating: 4, review_text: 'Cukup bagus, sudah pakai 2 buah. Akan beli lagi.', sentiment: 'POSITIVE', complaint_topic: null },
  { product_name: 'Eye Cream Retinol',    sku: 'EYE-RET-05', rating: 3, review_text: 'Lumayan, tapi hasilnya kurang terasa.', sentiment: 'NEUTRAL', complaint_topic: null },
  { product_name: 'Serum Vitamin C 30ml', sku: 'SRM-VC-001', rating: 1, review_text: 'Kualitas jelek, tidak sebanding dengan harga. Sangat kecewa.', sentiment: 'NEGATIVE', complaint_topic: 'Quality' },
]

const TOPIC_LABELS: Record<string, string> = {
  Quality: '🏭 Kualitas Produk', Packaging: '📦 Kemasan', Shipping: '🚚 Pengiriman',
  WrongVariant: '🔀 Varian Salah', Leakage: '💧 Bocor/Rusak', Size: '📏 Ukuran',
  Color: '🎨 Warna', CustomerService: '👨‍💼 Layanan Pelanggan', Price: '💰 Harga', Other: '❓ Lainnya'
}

async function getBrandId(): Promise<string | null> {
  try {
    const res = await fetch('/api/brands')
    if (!res.ok) return null
    const data = await res.json()
    return data.brands?.[0]?.id ?? null
  } catch { return null }
}

export default function CustomerIntelligencePage() {
  const [loading, setLoading] = useState(true)
  const [brandId, setBrandId] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [isDummy, setIsDummy] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'import'>('overview')
  const [csvText, setCsvText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  useEffect(() => { init() }, [])

  async function init() {
    setLoading(true)
    try {
      const bid = await getBrandId()
      setBrandId(bid)
      if (bid) {
        await loadData(bid)
      } else {
        applyDummy()
      }
    } catch {
      applyDummy()
    } finally {
      setLoading(false)
    }
  }

  function applyDummy() {
    setData({ summary: DUMMY_SUMMARY, complaintClusters: DUMMY_CLUSTERS, ratingDist: DUMMY_DIST, recentReviews: DUMMY_REVIEWS })
    setIsDummy(true)
  }

  async function loadData(bid: string) {
    const res = await fetch(`/api/customer-intelligence?brandId=${bid}`)
    const d = await res.json()
    if (!d.summary || d.summary.total === 0) {
      applyDummy()
    } else {
      setData(d)
      setIsDummy(false)
    }
  }

  async function importCSV() {
    if (!brandId || !csvText.trim()) return
    setImporting(true); setImportResult(null)
    try {
      const lines = csvText.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
      const reviews = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[h] = vals[i] ?? '' })
        return { rating: Number(obj.rating ?? obj.bintang ?? 0), review_text: obj.review ?? obj.ulasan ?? obj.komentar ?? '', product_name: obj.product ?? obj.produk ?? obj.product_name ?? '', sku: obj.sku ?? '', review_date: obj.date ?? obj.tanggal ?? '' }
      }).filter(r => r.rating > 0 || r.review_text)
      const res = await fetch('/api/customer-intelligence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brandId, reviews }) })
      const result = await res.json()
      setImportResult(`✅ Berhasil mengimpor ${result.created} ulasan.`)
      setCsvText('')
      if (brandId) loadData(brandId)
    } catch { setImportResult('❌ Gagal mengimpor. Periksa format CSV Anda.') }
    finally { setImporting(false) }
  }

  const summary  = data?.summary         ?? DUMMY_SUMMARY
  const clusters = data?.complaintClusters ?? []
  const ratingDist = data?.ratingDist     ?? {}
  const reviews  = data?.recentReviews    ?? []

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexDirection: 'column', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid var(--surface-border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Menganalisis sentimen pelanggan...</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>💬 Intelijen Pelanggan</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>Analisis sentimen ulasan pelanggan dengan klasifikasi otomatis berbasis kata kunci.</p>
      </div>

      {isDummy && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#854d0e', flexWrap: 'wrap' }}>
          <span>⚠️ Menampilkan <strong>data contoh</strong>. Import CSV ulasan marketplace Anda untuk analisis nyata.</span>
          <button onClick={() => setActiveTab('import')} style={{ marginLeft: 'auto', padding: '6px 14px', border: '1px solid var(--primary)', borderRadius: '6px', color: 'var(--primary)', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Import CSV →</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--surface-border)' }}>
        {[{ key: 'overview', label: '📊 Ringkasan' }, { key: 'reviews', label: '📝 Ulasan Terbaru' }, { key: 'import', label: '📤 Import CSV' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', backgroundColor: 'transparent',
            color: activeTab === t.key ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Total Ulasan',     value: summary.total,                          color: 'var(--text-primary)' },
              { label: 'Rating Rata-rata', value: `${summary.avgRating.toFixed(1)} ⭐`,   color: '#d97706' },
              { label: 'Ulasan Positif',   value: `${summary.positive} ✅`,              color: '#059669' },
              { label: 'Ulasan Negatif',   value: `${summary.negative} ❌`,              color: '#dc2626' },
              { label: 'Tingkat Negatif',  value: `${summary.negativePct.toFixed(1)}%`,  color: summary.negativePct > 15 ? '#dc2626' : '#d97706' },
            ].map((c, i) => (
              <div key={i} className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>{c.label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: c.color, marginTop: '8px' }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Rating Distribution */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Distribusi Rating</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[5,4,3,2,1].map(star => {
                const count = ratingDist[star] ?? 0
                const pct = summary.total > 0 ? (count / summary.total) * 100 : 0
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ minWidth: '36px', fontSize: '0.85rem', fontWeight: 600 }}>{star} ⭐</span>
                    <div style={{ flex: 1, backgroundColor: 'var(--surface-border)', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', backgroundColor: star >= 4 ? '#059669' : star === 3 ? '#d97706' : '#dc2626', width: `${pct}%`, borderRadius: '4px', transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ minWidth: '70px', fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{count} ({pct.toFixed(0)}%)</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Complaint Clusters */}
          {clusters.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Kluster Keluhan Utama</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>Dari {summary.negative} ulasan negatif.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '12px' }}>
                {clusters.map((c: any, i: number) => (
                  <div key={i} style={{ padding: '14px 16px', border: '1px solid var(--surface-border)', borderRadius: '8px', backgroundColor: 'var(--background)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{TOPIC_LABELS[c.topic] ?? c.topic}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{c.count} ulasan</div>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: c.pct > 30 ? '#dc2626' : '#d97706' }}>{c.pct.toFixed(0)}%</div>
                  </div>
                ))}
              </div>
              {clusters[0] && (
                <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px', fontSize: '0.9rem' }}>
                  <strong>Rekomendasi:</strong> Keluhan terbanyak pada <strong>{TOPIC_LABELS[clusters[0].topic] ?? clusters[0].topic}</strong> ({clusters[0].pct.toFixed(0)}%). Segera tinjau sebelum menaikkan volume kampanye.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* REVIEWS */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reviews.map((r: any, i: number) => (
            <div key={i} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.product_name || 'Produk'}</span>
                  {r.sku && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>({r.sku})</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>{'⭐'.repeat(Math.min(5, Math.max(0, r.rating)))}</span>
                  {r.complaint_topic && (
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>
                      {TOPIC_LABELS[r.complaint_topic] ?? r.complaint_topic}
                    </span>
                  )}
                  <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                    backgroundColor: r.sentiment === 'POSITIVE' ? 'rgba(5,150,105,0.08)' : r.sentiment === 'NEGATIVE' ? 'rgba(220,38,38,0.08)' : 'rgba(107,114,128,0.08)',
                    color: r.sentiment === 'POSITIVE' ? '#059669' : r.sentiment === 'NEGATIVE' ? '#dc2626' : '#6b7280' }}>
                    {r.sentiment === 'POSITIVE' ? 'Positif' : r.sentiment === 'NEGATIVE' ? 'Negatif' : 'Netral'}
                  </span>
                </div>
              </div>
              {r.review_text && <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>"{r.review_text}"</p>}
            </div>
          ))}
        </div>
      )}

      {/* IMPORT */}
      {activeTab === 'import' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>📤 Import Ulasan dari CSV</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Kolom yang didukung: <code>rating</code>, <code>review</code>, <code>product_name</code>, <code>sku</code>, <code>date</code></p>
          </div>
          <div style={{ padding: '12px', border: '1px solid var(--surface-border)', borderRadius: '8px', backgroundColor: 'var(--background)', fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            Contoh format:<br />rating,review,product_name,sku,date<br />5,Produk bagus,Serum A,SKU001,2026-08-01<br />2,Kemasan bocor,Serum A,SKU001,2026-08-05
          </div>
          <textarea value={csvText} onChange={e => setCsvText(e.target.value)} placeholder="Tempel data CSV di sini..." rows={10}
            style={{ width: '100%', padding: '12px', border: '1px solid var(--surface-border)', borderRadius: '8px', backgroundColor: 'var(--background)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }} />
          {importResult && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: importResult.startsWith('✅') ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)', color: importResult.startsWith('✅') ? '#059669' : '#dc2626', fontWeight: 600 }}>
              {importResult}
            </div>
          )}
          <button className="btn-primary" disabled={importing || !csvText.trim()} onClick={importCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}>
            <Upload size={16} /> {importing ? 'Mengimpor...' : 'Proses & Import'}
          </button>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
