'use client'

import { useEffect, useState } from 'react'
import { Wallet, CheckCircle, Info, Archive, Sparkles, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { BudgetManager } from '@/components/BudgetManager'
import { BudgetArchiveModal } from '@/components/BudgetArchiveModal'

export default function BudgetManagerPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showArchive, setShowArchive] = useState(false)
  const [archiveData, setArchiveData] = useState<any[]>([])
  const [loadingArchive, setLoadingArchive] = useState(false)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/budget/recommendations`)
        if (!res.ok) {
          if (res.status === 401) window.location.href = '/login'
          setErrorStatus(res.status)
          return
        }
        const d = await res.json()
        if (d.error) { setErrorStatus(403); return }

        if (d.approvedAllocations?.length > 0) {
          const approvedMap = new Map(d.approvedAllocations.map((a: any) => [a.channel, a.amount]))
          d.current = d.current.map((c: any) => ({ ...c, spend: approvedMap.get(c.channel) || c.spend }))
          d.isApproved = true
        }
        setData(d)
      } catch (err) {
        setErrorStatus(500)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const fmt = (val: number) => `Rp ${(val / 1000000).toFixed(1)} Juta`
  const fmtShort = (val: number) => `Rp ${(val / 1000000).toFixed(0)} Jt`

  // Loading state
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--surface-border)' }}>
        <div>
          <div className="skeleton" style={{ width: '180px', height: '22px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '280px', height: '14px' }} />
        </div>
        <div className="skeleton" style={{ width: '140px', height: '36px', borderRadius: '8px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />
        ))}
      </div>
    </div>
  )

  if (errorStatus === 403) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      Kamu nggak punya akses ke workspace ini.
    </div>
  )
  if (errorStatus === 404) return (
    <div className="card" style={{ textAlign: 'center', padding: '48px', maxWidth: '500px', margin: '0 auto' }}>
      <Wallet size={32} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>Belum ada data marketplace nih</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
        Upload data marketplace kamu dulu buat mulai analisis budget.
      </p>
      <a href="/data-sources" className="btn-primary">Upload data marketplace</a>
    </div>
  )
  if (errorStatus) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      Gagal memuat data. Coba lagi ya.
    </div>
  )
  if (!data) return null

  let currentData = data.current || []
  let recommendedData = data.recommended || []
  let insightsData = data.insights || []

  if (currentData.length === 0) {
    currentData = [
      { channel: 'Shopee Ads', spend: 4500000, roas: 10 },
      { channel: 'TikTok Ads', spend: 3000000, roas: 17.3 },
      { channel: 'Tokopedia Ads', spend: 1800000, roas: 15.2 },
      { channel: 'Meta Ads', spend: 2100000, roas: 4.4 },
    ]
    recommendedData = [
      { channel: 'Shopee Ads', spend: 10000000 },
      { channel: 'TikTok Ads', spend: 8000000 },
      { channel: 'Tokopedia Ads', spend: 2000000 },
      { channel: 'Meta Ads', spend: 5000000 },
    ]
    insightsData = [
      'TikTok Ads menghasilkan ROAS tertinggi sebesar 17.3x — kanal paling efisien saat ini.',
      'Shopee Ads juga performa tinggi dengan ROAS 10x. Pertimbangkan untuk menaikkan anggaran.',
      'Meta Ads memberikan ROAS 4.4x — masih positif, pantau konversi sebelum menaikkan budget.',
    ]
  }

  const currentTotal = currentData.reduce((sum: number, c: any) => sum + c.spend, 0)
  const recTotal = recommendedData.reduce((sum: number, c: any) => sum + c.spend, 0)
  const delta = recTotal - currentTotal
  const isIncrease = delta > 0
  const isOptimal = delta === 0
  const bestChannel = [...currentData].sort((a: any, b: any) => b.roas - a.roas)[0]

  const mappedCurrent = currentData.map((c: any) => ({
    channel: c.channel, allocated: c.spend, spent: c.spend * 0.45, historicalRoas: c.roas,
  }))
  const mappedRecommended = recommendedData.map((r: any) => {
    const curr = currentData.find((c: any) => c.channel === r.channel)
    return { channel: r.channel, allocated: r.spend, spent: curr ? curr.spend * 0.45 : 0, historicalRoas: curr ? curr.roas : 0 }
  })

  const fetchArchive = async () => {
    setLoadingArchive(true); setShowArchive(true)
    try {
      const res = await fetch('/api/budget/archive')
      const json = await res.json()
      if (json.archive) setArchiveData(json.archive)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingArchive(false)
    }
  }

  const getChannelStatus = (roas: number) => {
    if (roas >= 10) return { label: 'Top Performer 🔥', color: 'var(--success)', bg: 'var(--success-light)', border: 'var(--success-border)' }
    if (roas >= 4)  return { label: 'Sehat ✅', color: '#2563EB', bg: '#EFF6FF', border: '#DBEAFE' }
    if (roas >= 2)  return { label: 'Perlu dipantau ⚠️', color: 'var(--warning)', bg: 'var(--warning-light)', border: 'var(--warning-border)' }
    return { label: 'Belum ada spend', color: 'var(--text-muted)', bg: '#F8FAFC', border: '#E2E8F0' }
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Budget Manager</h1>
          <p className="page-subtitle">Atur dan optimalkan budget iklan kamu berdasarkan performa tiap kanal dan saran AI.</p>
        </div>
        <button className="btn-outline" onClick={fetchArchive} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <Archive size={15} />
          {loadingArchive ? 'Loading…' : 'Lihat arsip budget'}
        </button>
      </div>

      {/* STATUS BANNER */}
      {data?.isApproved ? (
        <div className="info-banner" style={{ backgroundColor: 'var(--success-light)', border: '1px solid var(--success-border)' }}>
          <CheckCircle size={16} className="info-banner-icon" style={{ color: 'var(--success)' }} />
          <p className="info-banner-text">
            Budget bulan ini udah fix dan tersimpan di sistem. Pastikan angkanya sama dengan dashboard Meta/Shopee/TikTok kamu ya.
          </p>
        </div>
      ) : (
        <div className="info-banner">
          <Info size={16} className="info-banner-icon" />
          <p className="info-banner-text">
            Mode simulasi — perubahan ini belum diterapkan ke platform iklan sampai kamu setujui.
          </p>
        </div>
      )}

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {/* Total Budget */}
        <div className="stat-card">
          <div className="stat-label" style={{ marginBottom: '10px' }}>Total budget</div>
          <div className="stat-value">{fmt(currentTotal)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>30 hari terakhir</div>
        </div>

        {/* AI Recommendation */}
        <div className="stat-card">
          <div className="stat-label" style={{ marginBottom: '10px' }}>Rekomendasi AI</div>
          <div className="stat-value">{fmt(recTotal)}</div>
          <div style={{ marginTop: '6px' }}>
            {isOptimal ? (
              <span className="badge badge-success">Budget udah optimal ✨</span>
            ) : isIncrease ? (
              <span className="badge badge-warning">
                <TrendingUp size={11} /> Naik {Math.abs(delta / currentTotal * 100).toFixed(0)}%
              </span>
            ) : (
              <span className="badge badge-success">
                <TrendingDown size={11} /> Turun {Math.abs(delta / currentTotal * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Budget Delta */}
        <div className="stat-card">
          <div className="stat-label" style={{ marginBottom: '10px' }}>Selisih budget</div>
          <div className="stat-value" style={{ color: isOptimal ? 'var(--text-primary)' : isIncrease ? 'var(--warning)' : 'var(--success)' }}>
            {isOptimal ? 'Rp 0' : `${isIncrease ? '+' : '-'}${fmt(Math.abs(delta))}`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            {isOptimal ? 'Nggak ada perubahan' : `${isIncrease ? '+' : '-'}${Math.abs(delta / currentTotal * 100).toFixed(1)}% dari saat ini`}
          </div>
        </div>

        {/* Best Channel */}
        {bestChannel && (
          <div className="stat-card">
            <div className="stat-label" style={{ marginBottom: '10px' }}>Kanal terbaik</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {bestChannel.channel}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--success)' }}>
                {bestChannel.roas.toFixed(2)}x ROAS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* AI INSIGHT CARD */}
      <div className="ai-card">
        <div className="ai-card-header">
          <div className="ai-card-icon">
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Insight AI</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dari data performa 30 hari terakhir</div>
          </div>
        </div>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '0', margin: 0, listStyle: 'none' }}>
          {insightsData.map((insight: string, idx: number) => (
            <li key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>
                {idx + 1}
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CHANNEL PERFORMANCE TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>Performa & saran per kanal</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Kanal</th>
                <th>ROAS</th>
                <th>Budget sekarang</th>
                <th>Saran AI</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((c: any) => {
                const rec = recommendedData.find((r: any) => r.channel === c.channel)
                const recSpend = rec?.spend ?? c.spend
                const statusInfo = getChannelStatus(c.roas)
                const budgetChange = recSpend - c.spend
                return (
                  <tr key={c.channel}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.channel}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            fontVariantNumeric: 'tabular-nums',
                            color: c.roas >= 10 ? 'var(--success)' : c.roas >= 4 ? 'var(--primary)' : c.roas >= 2 ? 'var(--warning)' : 'var(--text-muted)',
                          }}
                        >
                          {c.roas.toFixed(2)}x
                        </span>
                        {/* ROAS bar */}
                        <div style={{ width: '48px', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(c.roas / 20 * 100, 100)}%`, backgroundColor: c.roas >= 10 ? 'var(--success)' : c.roas >= 4 ? 'var(--primary)' : 'var(--warning)', borderRadius: '2px' }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.875rem' }}>{fmtShort(c.spend)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.875rem' }}>{fmtShort(recSpend)}</span>
                        {budgetChange !== 0 && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: budgetChange > 0 ? 'var(--warning)' : 'var(--success)' }}>
                            {budgetChange > 0 ? '+' : ''}{fmtShort(budgetChange)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{ backgroundColor: statusInfo.bg, color: statusInfo.color, borderColor: statusInfo.border }}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIMULATION SECTION */}
      <div>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Simulasi & keputusan budget final</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Geser slider di bawah buat simulasi perubahan budget. Kalau udah yakin, klik <strong>Setujui budget</strong>.
          </p>
        </div>
        <BudgetManager
          initialTotal={currentTotal}
          initialData={mappedCurrent}
          recommendedTotal={recTotal}
          recommendedData={mappedRecommended}
        />
      </div>

      {showArchive && (
        <BudgetArchiveModal onClose={() => setShowArchive(false)} data={archiveData} />
      )}
    </div>
  )
}
