'use client'

import { useEffect, useState } from 'react'
import { Activity, ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Target, ShoppingCart, Percent, HelpCircle, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [expandedWhy, setExpandedWhy] = useState<string | null>(null)
  const [expandedWhat, setExpandedWhat] = useState<string | null>(null)

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
            fetch(`/api/intelligence/recommendations?brandId=${brandId}`)
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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--surface-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const isStaff = overview?.role === 'STAFF'
  const metrics = overview?.metrics
  const health = overview?.healthScore

  const formatCurrency = (val: number) => `Rp ${(val / 1000000).toFixed(1)} Juta`

  if (!metrics || metrics.gmv.value === 0) {
    return (
      <div style={{ padding: '40px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--surface-border)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>📥 Data marketplace belum tersedia</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Upload laporan Shopee, TikTok Shop, Tokopedia, atau Lazada untuk mulai menganalisis bisnis Anda.</p>
        <Link href="/import" style={{ display: 'inline-block', backgroundColor: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, textDecoration: 'none' }}>
          IMPORT MARKETPLACE DATA
        </Link>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 4px 0' }}>Selamat Pagi, {isStaff ? 'Tim EcomPilot' : 'Eksekutif'}</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Berikut adalah rangkuman performa dan strategi bisnis Anda hari ini.</p>
        </div>
        
        {/* BUSINESS HEALTH SCORE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--surface-border)', cursor: 'pointer' }} onClick={() => setExpandedWhy(expandedWhy === 'health' ? null : 'health')}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Business Health</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: health.total >= 80 ? 'var(--success)' : 'var(--warning)' }}>
              {health.total} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
            </div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: health.total >= 80 ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)', color: health.total >= 80 ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} />
          </div>
        </div>
      </div>

      {expandedWhy === 'health' && (
        <div className="fade-in" style={{ padding: '20px', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>Rincian Skor Kesehatan (Kenapa skor saya {health.total}?)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {health.components.map((c: any) => (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--surface)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.name}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.score}/{c.max}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI METRICS (SPV & STAFF) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'GMV', value: formatCurrency(metrics.gmv.value), trend: metrics.gmv.trend, icon: <DollarSign size={16}/> },
          { label: 'ROAS', value: `${metrics.roas.value.toFixed(2)}x`, trend: metrics.roas.trend, icon: <Target size={16}/> },
          { label: 'Net Sales', value: formatCurrency(metrics.netSales.value), trend: metrics.netSales.trend, icon: <ShoppingCart size={16}/> },
          { label: 'Profit', value: formatCurrency(metrics.profit.value), trend: metrics.profit.trend, icon: <TrendingUp size={16}/> },
          { label: 'Margin', value: `${metrics.margin.value}%`, trend: metrics.margin.trend, icon: <Percent size={16}/> },
        ].map(k => (
          <div key={k.label} className="card" style={{ position: 'relative' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {k.icon} {k.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{k.value}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: k.trend >= 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                {k.trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(k.trend)}%
              </div>
              <button 
                onClick={() => setExpandedWhy(expandedWhy === k.label ? null : k.label)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <HelpCircle size={14} /> Why?
              </button>
            </div>
            {expandedWhy === k.label && (
              <div className="fade-in" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: '8px', padding: '16px', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--primary)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Kenapa {k.label} {k.trend >= 0 ? 'naik' : 'turun'} {Math.abs(k.trend)}%?</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {k.label === 'GMV' ? 'Penyebab terbesar: Orders turun 11% dan Conversion Rate turun 8%. Penurunan lebih banyak dipengaruhi oleh availability stok (SKU Hero A kosong).' : `Perubahan pada ${k.label} dipengaruhi oleh fluktuasi metrics terkait selama 7 hari terakhir.`}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isStaff ? '1fr' : '2fr 1fr', gap: '24px' }}>
        
        {/* MAIN SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* STAFF: TODAY'S PRIORITIES */}
          {isStaff && (
            <div className="card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} color="var(--primary)" /> Prioritas Hari Ini</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recommendations.map((r, i) => (
                  <div key={i} style={{ padding: '12px', borderLeft: `4px solid ${r.severity === 'CRITICAL' || r.severity === 'HIGH' ? 'var(--danger)' : 'var(--warning)'}`, backgroundColor: 'var(--background)', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>{i+1}. {r.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SPV/ADMIN: AI RECOMMENDATIONS & ACTIONS */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lightbulb size={18} color="var(--warning)" /> Rekomendasi Tindakan (AI)
              </h3>
              <button 
                onClick={() => setExpandedWhat(expandedWhat ? null : 'all')}
                className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                What Should I Do?
              </button>
            </div>

            {expandedWhat && (
              <div className="fade-in" style={{ padding: '16px', backgroundColor: 'rgba(26, 86, 219, 0.05)', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(26, 86, 219, 0.2)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--primary)' }}>Tindakan Paling Berdampak:</h4>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                  {recommendations.map((r, i) => (
                    <li key={i} style={{ marginBottom: '8px' }}>
                      <strong>{r.category}:</strong> {r.actionSteps[0]} <span style={{ color: 'var(--text-secondary)' }}>(Dampak: {r.expectedImpact})</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recommendations.map((rec, i) => (
                <div key={i} style={{ padding: '20px', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: rec.severity === 'CRITICAL' ? 'rgba(220,38,38,0.1)' : (rec.severity === 'LOW' ? 'rgba(107,114,128,0.1)' : 'rgba(234,179,8,0.1)'), color: rec.severity === 'CRITICAL' ? 'var(--danger)' : (rec.severity === 'LOW' ? 'var(--text-secondary)' : 'var(--warning)') }}>
                          {rec.severity}
                        </span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{rec.title}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Keyakinan AI: <strong>{rec.confidenceScore}%</strong> ({rec.confidenceLevel})</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.9rem', marginBottom: '12px', lineHeight: '1.5' }}>
                    <strong>Saran:</strong> {rec.recommendation}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>
                    <strong>Alasan:</strong> {rec.reason}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <strong>Risiko:</strong> {rec.risk}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR (SPV ONLY) */}
        {!isStaff && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* DATA QUALITY BANNER */}
            <div style={{ padding: '16px', backgroundColor: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '8px', display: 'flex', gap: '12px' }}>
              <AlertTriangle size={20} color="var(--danger)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--danger)' }}>⚠ Partial Data</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Data Affiliate hanya 74% lengkap minggu ini. Akurasi rekomendasi affiliate mungkin berkurang.</div>
              </div>
            </div>

            {/* PERFORMANCE CHART */}
            <div className="card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>Tren Performa</h3>
              <div style={{ height: '200px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[{name: '1', val: 10}, {name: '2', val: 12}, {name: '3', val: 11}, {name: '4', val: 15}, {name: '5', val: 14}]}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="val" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
