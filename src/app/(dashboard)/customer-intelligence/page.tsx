'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Star, Upload } from 'lucide-react'

const TOPIC_LABELS: Record<string, string> = {
  Quality: '🏭 Kualitas Produk', Packaging: '📦 Kemasan', Shipping: '🚚 Pengiriman',
  WrongVariant: '🔀 Varian Salah', Leakage: '💧 Bocor/Rusak', Size: '📏 Ukuran',
  Color: '🎨 Warna', CustomerService: '👨‍💼 Layanan Pelanggan', Price: '💰 Harga', Other: '❓ Lainnya'
}

export default function CustomerIntelligencePage() {
  const [brandId, setBrandId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'import'>('overview')
  const [csvText, setCsvText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(async (sess) => {
      if (!sess?.user) return
      const bRes = await fetch('/api/brands')
      const bData = await bRes.json()
      const bid = bData.brands?.[0]?.id
      if (bid) { setBrandId(bid); await loadData(bid) }
      setLoading(false)
    })
  }, [])

  async function loadData(bid: string) {
    setLoading(true)
    const res = await fetch(`/api/customer-intelligence?brandId=${bid}`)
    const d = await res.json()
    setData(d)
    setLoading(false)
  }

  async function importCSV() {
    if (!brandId || !csvText.trim()) return
    setImporting(true)
    setImportResult(null)
    try {
      const lines = csvText.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
      const reviews = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[h] = vals[i] ?? '' })
        return {
          rating: Number(obj.rating ?? obj.bintang ?? obj.star ?? 0),
          review_text: obj.review ?? obj.ulasan ?? obj.komentar ?? obj.comment ?? '',
          product_name: obj.product ?? obj.produk ?? obj.product_name ?? '',
          sku: obj.sku ?? '',
          variant: obj.variant ?? obj.varian ?? '',
          courier: obj.courier ?? obj.kurir ?? '',
          review_date: obj.date ?? obj.tanggal ?? obj.review_date ?? '',
        }
      }).filter(r => r.rating > 0 || r.review_text)

      const res = await fetch('/api/customer-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, reviews }),
      })
      const result = await res.json()
      setImportResult(`✅ Berhasil mengimpor ${result.created} ulasan.`)
      setCsvText('')
      loadData(brandId)
    } catch (e) {
      setImportResult('❌ Gagal mengimpor. Periksa format CSV Anda.')
    } finally {
      setImporting(false)
    }
  }

  const summary = data?.summary ?? { total: 0, avgRating: 0, negative: 0, positive: 0, negativePct: 0 }
  const clusters = data?.complaintClusters ?? []
  const ratingDist = data?.ratingDist ?? {}
  const reviews = data?.recentReviews ?? []

  if (loading && !data) return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Menganalisis sentimen pelanggan...</div>

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>💬 Intelijen Pelanggan</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
          Analisis sentimen ulasan pelanggan dengan klasifikasi otomatis berbasis kata kunci.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--surface-border)' }}>
        {[{ key: 'overview', label: '📊 Ringkasan' }, { key: 'reviews', label: '📝 Ulasan Terbaru' }, { key: 'import', label: '📤 Import CSV' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', backgroundColor: 'transparent',
            color: activeTab === t.key ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Total Ulasan', value: summary.total, suffix: '', color: 'var(--text-primary)' },
              { label: 'Rating Rata-rata', value: summary.avgRating.toFixed(1), suffix: '⭐', color: '#d97706' },
              { label: 'Ulasan Positif', value: summary.positive, suffix: '✅', color: '#059669' },
              { label: 'Ulasan Negatif', value: summary.negative, suffix: '❌', color: '#dc2626' },
              { label: 'Tingkat Negatif', value: `${summary.negativePct.toFixed(1)}%`, suffix: '', color: summary.negativePct > 15 ? '#dc2626' : '#d97706' },
            ].map((c, i) => (
              <div key={i} className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>{c.label}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: c.color, marginTop: '8px' }}>{c.value} {c.suffix}</div>
              </div>
            ))}
          </div>

          {/* Rating Distribution */}
          {summary.total > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Distribusi Rating</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = ratingDist[star] ?? 0
                  const pct = summary.total > 0 ? (count / summary.total) * 100 : 0
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ minWidth: '36px', fontSize: '0.85rem', fontWeight: 600 }}>{star} ⭐</span>
                      <div style={{ flex: 1, backgroundColor: 'var(--surface-border)', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', backgroundColor: star >= 4 ? '#059669' : star === 3 ? '#d97706' : '#dc2626', width: `${pct}%`, borderRadius: '4px', transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ minWidth: '60px', fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{count} ({pct.toFixed(0)}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Complaint Clusters */}
          {clusters.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Kluster Keluhan Utama</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>Klasifikasi otomatis berbasis kata kunci dari ulasan negatif.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
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
                  <strong>Rekomendasi:</strong> Keluhan terbanyak pada <strong>{TOPIC_LABELS[clusters[0].topic] ?? clusters[0].topic}</strong> ({clusters[0].pct.toFixed(0)}% dari ulasan negatif).
                  Segera tinjau sebelum menaikkan volume kampanye atau afiliasi untuk produk terkait.
                </div>
              )}
            </div>
          )}

          {summary.total === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '56px' }}>
              <MessageSquare size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ marginBottom: '8px' }}>Belum Ada Data Ulasan</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>Import file CSV ulasan marketplace Anda untuk mengaktifkan analisis sentimen.</p>
              <button className="btn-primary" onClick={() => setActiveTab('import')}>Import CSV Ulasan</button>
            </div>
          )}
        </div>
      )}

      {/* REVIEWS TAB */}
      {activeTab === 'reviews' && (
        <div className="card" style={{ overflow: 'auto' }}>
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Belum ada data ulasan.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reviews.map((r: any, i: number) => (
                <div key={i} style={{ padding: '14px 16px', border: '1px solid var(--surface-border)', borderRadius: '8px', backgroundColor: 'var(--background)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.product_name || 'Produk Tidak Diketahui'}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.sku ? `(${r.sku})` : ''}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {'⭐'.repeat(Math.min(5, Math.max(0, r.rating)))}
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
        </div>
      )}

      {/* IMPORT TAB */}
      {activeTab === 'import' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>📤 Import Ulasan dari CSV</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Tempel konten CSV Anda di bawah. Kolom yang didukung: <code>rating</code>, <code>review</code>, <code>product_name</code>, <code>sku</code>, <code>variant</code>, <code>courier</code>, <code>date</code>
            </p>
          </div>
          <div style={{ padding: '12px', border: '1px solid var(--surface-border)', borderRadius: '8px', backgroundColor: 'var(--background)', fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            Contoh format:<br />rating,review,product_name,sku,date<br />5,Produk bagus,Serum A,SKU001,2026-08-01<br />2,Kemasan bocor,Serum A,SKU001,2026-08-05
          </div>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder="Tempel data CSV Anda di sini..."
            rows={10}
            style={{ width: '100%', padding: '12px', border: '1px solid var(--surface-border)', borderRadius: '8px', backgroundColor: 'var(--background)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
          />
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
    </div>
  )
}
