'use client'

import { useEffect, useState } from 'react'
import {
  Activity, ArrowUpRight, ArrowDownRight, DollarSign, Target,
  ShoppingCart, TrendingUp, Percent, HelpCircle, Sparkles,
  AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Lightbulb,
  BarChart2, Upload
} from 'lucide-react'
import Link from 'next/link'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedWhy, setExpandedWhy] = useState<string | null>(null)
  const [expandedWhat, setExpandedWhat] = useState<string | null>(null)
  const [showHealthDetail, setShowHealthDetail] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const brandRes = await fetch('/api/brands')
        const brands = await brandRes.json()
        const brandId = brands[0]?.id

        if (brandId) {
          const [ovRes, recRes] = await Promise.all([
            fetch(`/api/intelligence/overview?brandId=${brandId}`),
            fetch(`/api/intelligence/recommendations?brandId=${brandId}`),
          ])
          if (ovRes.ok) setOverview(await ovRes.json())
          if (recRes.ok) setRecommendations((await recRes.json()).recommendations || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const fmt = (val: number) => `Rp ${(val / 1000000).toFixed(1)} Juta`

  // Loading Skeleton
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="skeleton" style={{ width: '240px', height: '24px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '320px', height: '14px' }} />
        </div>
        <div className="skeleton" style={{ width: '120px', height: '72px', borderRadius: '12px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />)}
      </div>
    </div>
  )

  const isStaff = overview?.role === 'STAFF'
  const metrics = overview?.metrics
  const health = overview?.healthScore

  // Empty state
  if (!metrics || metrics.gmv.value === 0) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '0' }}>
        <div style={{ maxWidth: '440px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Upload size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Belum ada data marketplace nih
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '28px' }}>
            Upload laporan dari Shopee, TikTok Shop, Tokopedia, atau Lazada buat mulai analisis performa bisnis kamu.
          </p>
          <Link href="/data-sources" className="btn-primary">
            Upload data marketplace
          </Link>
        </div>
      </div>
    )
  }

  const kpiItems = [
    { label: 'GMV', value: fmt(metrics.gmv.value), trend: metrics.gmv.trend, icon: DollarSign, key: 'GMV', why: 'Penyebab utamanya: Orders turun 11% dan Conversion Rate turun 8%. Pengaruh terbesar dari ketersediaan stok SKU Hero.' },
    { label: 'ROAS', value: `${metrics.roas.value.toFixed(2)}x`, trend: metrics.roas.trend, icon: Target, key: 'ROAS', why: 'ROAS dipengaruhi oleh efisiensi kampanye iklan dan biaya per klik yang bervariasi antar marketplace.' },
    { label: 'Net Sales', value: fmt(metrics.netSales.value), trend: metrics.netSales.trend, icon: ShoppingCart, key: 'NetSales', why: 'Net sales dihitung setelah deduksi retur dan voucher dari gross revenue.' },
    { label: 'Profit', value: fmt(metrics.profit.value), trend: metrics.profit.trend, icon: TrendingUp, key: 'Profit', why: 'Profit dipengaruhi margin kotor dan biaya operasional logistik bulan ini.' },
    { label: 'Margin', value: `${metrics.margin.value}%`, trend: metrics.margin.trend, icon: Percent, key: 'Margin', why: 'Margin berubah akibat fluktuasi harga HPP dan promosi diskon platform.' },
  ]

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Welcome back! 👋
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Ini ringkasan performa dan saran AI buat bisnis kamu.
          </p>
        </div>

        {/* HEALTH SCORE */}
        {health && (
          <button
            onClick={() => setShowHealthDetail(!showHealthDetail)}
            style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 18px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--surface-border)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--surface-border)' }}
          >
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              backgroundColor: health.total >= 80 ? 'var(--success-light)' : 'var(--warning-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={20} color={health.total >= 80 ? 'var(--success)' : 'var(--warning)'} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Skor kesehatan bisnis</div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.03em', color: health.total >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                {health.total} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ 100</span>
              </div>
            </div>
            {showHealthDetail ? <ChevronDown size={15} color="var(--text-muted)" /> : <ChevronRight size={15} color="var(--text-muted)" />}
          </button>
        )}
      </div>

      {/* HEALTH DETAIL */}
      {showHealthDetail && health && (
        <div className="card fade-in" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
            Kenapa skor kamu {health.total}/100?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
            {health.components.map((c: any) => (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{c.name}</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: c.score / c.max >= 0.7 ? 'var(--success)' : 'var(--warning)' }}>{c.score}/{c.max}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
        {kpiItems.map((k) => {
          const Icon = k.icon
          const isPositive = k.trend >= 0
          const isExpanded = expandedWhy === k.key
          return (
            <div key={k.key} style={{ position: 'relative' }}>
              <div
                className="stat-card"
                style={{
                  cursor: 'pointer',
                  borderColor: isExpanded ? 'rgba(37, 99, 235, 0.3)' : 'var(--surface-border)',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Label + icon */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div className="stat-label">{k.label}</div>
                  <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} color="var(--text-muted)" />
                  </div>
                </div>

                {/* Value */}
                <div className="stat-value" style={{ fontSize: '1.375rem', marginBottom: '8px' }}>{k.value}</div>

                {/* Trend + Why */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.8125rem', fontWeight: 600, color: isPositive ? 'var(--success)' : 'var(--danger)' }}>
                    {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {Math.abs(k.trend)}%
                  </div>
                  <button
                    onClick={() => setExpandedWhy(isExpanded ? null : k.key)}
                    style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <HelpCircle size={12} /> Kenapa?
                  </button>
                </div>
              </div>

              {/* Tooltip popover */}
              {isExpanded && (
                <div
                  className="fade-in"
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 20,
                    padding: '14px', backgroundColor: 'var(--surface)',
                    borderRadius: '10px', border: '1px solid rgba(37, 99, 235, 0.25)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.10)',
                  }}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Kenapa {k.label} {isPositive ? 'naik' : 'turun'} {Math.abs(k.trend)}%?
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{k.why}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: isStaff ? '1fr' : '1.6fr 1fr', gap: '20px' }}>

        {/* AI RECOMMENDATIONS */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="ai-card-icon">
                <Sparkles size={15} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Rekomendasi AI</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{recommendations.length} hal yang perlu diperhatiin</div>
              </div>
            </div>
            <button
              onClick={() => setExpandedWhat(expandedWhat ? null : 'all')}
              className="btn-outline"
              style={{ fontSize: '0.8125rem', padding: '7px 14px' }}
            >
              <Lightbulb size={14} />
              Harus ngapain?
            </button>
          </div>

          {/* Expanded action plan */}
          {expandedWhat && (
            <div className="fade-in ai-card" style={{ margin: '16px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '10px' }}>Langkah paling impactful:</div>
              <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recommendations.map((r, i) => (
                  <li key={i} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{r.category}:</strong> {r.actionSteps?.[0]} <span style={{ color: 'var(--text-muted)' }}>— Dampak: {r.expectedImpact}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Recommendation list */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recommendations.map((rec, i) => {
              const severityColor = rec.severity === 'CRITICAL' ? 'var(--danger)' : rec.severity === 'HIGH' ? 'var(--warning)' : 'var(--text-muted)'
              const severityBg = rec.severity === 'CRITICAL' ? 'var(--danger-light)' : rec.severity === 'HIGH' ? 'var(--warning-light)' : '#F8FAFC'
              const severityBorder = rec.severity === 'CRITICAL' ? 'var(--danger-border)' : rec.severity === 'HIGH' ? 'var(--warning-border)' : '#E2E8F0'
              return (
                <div
                  key={i}
                  style={{
                    padding: '16px 24px',
                    borderBottom: i < recommendations.length - 1 ? '1px solid var(--surface-border)' : 'none',
                    transition: 'background-color 0.12s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        className="badge"
                        style={{ backgroundColor: severityBg, color: severityColor, borderColor: severityBorder }}
                      >
                        {rec.severity}
                      </span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{rec.title}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {rec.confidenceScore}% yakin
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{rec.recommendation}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT COLUMN (SPV only) */}
        {!isStaff && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Partial data alert */}
            <div style={{ display: 'flex', gap: '12px', padding: '14px 16px', backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning-border)', borderRadius: '10px' }}>
              <AlertTriangle size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--warning)', marginBottom: '3px' }}>Data belum lengkap</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Data affiliate baru 74% lengkap. Akurasi rekomendasi bisa kurang optimal.</div>
              </div>
            </div>

            {/* Mini trend chart */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={16} color="var(--primary)" />
                Tren performa 5 minggu terakhir
              </div>
              <div style={{ height: '150px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[{n:'M1',v:10},{n:'M2',v:12},{n:'M3',v:11},{n:'M4',v:15},{n:'M5',v:14}]}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2}/>
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2} fill="url(#grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick actions */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '12px' }}>Aksi cepat</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: 'Rekap closing promo (Jalur Ninja)', href: '/closing' },
                  { label: 'Atur budget iklan', href: '/budget' },
                  { label: 'Laporan marketplace', href: '/marketplace-intelligence' },
                  { label: 'Jaga margin promo', href: '/margin-protection' },
                  { label: 'Upload data baru', href: '/data-sources' },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 12px', borderRadius: '8px',
                      fontSize: '0.8125rem', color: 'var(--text-secondary)',
                      transition: 'all 0.12s ease',
                      border: '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--background)'
                      e.currentTarget.style.borderColor = 'var(--surface-border)'
                      e.currentTarget.style.color = 'var(--primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.borderColor = 'transparent'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }}
                  >
                    {action.label}
                    <ChevronRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STAFF: Today's priorities */}
        {isStaff && recommendations.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <CheckCircle size={18} color="var(--success)" />
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Prioritas hari ini</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recommendations.map((r, i) => (
                <div key={i} style={{ padding: '12px 14px', borderLeft: `3px solid ${r.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)'}`, backgroundColor: 'var(--background)', borderRadius: '0 8px 8px 0' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px' }}>{i+1}. {r.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{r.recommendation}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
