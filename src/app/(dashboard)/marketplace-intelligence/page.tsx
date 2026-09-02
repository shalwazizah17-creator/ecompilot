'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'
import { Download, Filter, Printer, FileText, PieChart, Store, Calendar, TrendingUp } from 'lucide-react'

export default function MarketplaceIntelligence() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Controls
  const [platform, setPlatform] = useState('ALL') // ALL, Shopee, TikTok, Tokopedia
  const [period, setPeriod] = useState('MONTHLY') // WEEKLY, MONTHLY, YEARLY

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/marketplace-intelligence`)
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="skeleton" style={{ width: '300px', height: '40px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />)}
        </div>
      </div>
    )
  }

  if (!data || !data.kpis) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Gagal memuat data laporan.</div>
  }

  const { kpis, chartData, platformGrowth } = data

  const formatIDR = (val: number) => `Rp ${(val/1000000).toFixed(1)} Juta`

  const handlePrint = () => {
    window.print()
  }

  // Simulated dynamic values based on selection
  const displayPlatform = platform === 'ALL' ? 'Semua Marketplace' : platform
  const displayPeriod = period === 'WEEKLY' ? 'Mingguan' : period === 'MONTHLY' ? 'Bulanan' : 'Tahunan'

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Laporan Evaluasi Marketplace</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Rangkuman performa {displayPlatform} buat evaluasi {displayPeriod}.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }} className="no-print">
          <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS (Hidden when printing) */}
      <div className="no-print card-flat" style={{ padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
          <Filter size={16} /> Filter Laporan
        </div>
        
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--surface-border)' }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Store size={15} color="var(--text-muted)" />
          <select 
            value={platform} 
            onChange={(e) => setPlatform(e.target.value)}
            className="filter-select"
            style={{ minWidth: '150px' }}
          >
            <option value="ALL">Semua Marketplace</option>
            <option value="Shopee">Shopee</option>
            <option value="TikTok Shop">TikTok Shop</option>
            <option value="Tokopedia">Tokopedia</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={15} color="var(--text-muted)" />
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="filter-select"
            style={{ minWidth: '120px' }}
          >
            <option value="WEEKLY">Mingguan</option>
            <option value="MONTHLY">Bulanan</option>
            <option value="YEARLY">Tahunan</option>
          </select>
        </div>
      </div>

      {/* PRINT HEADER (Only visible when printing) */}
      <div className="print-only" style={{ display: 'none', marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Laporan Evaluasi EcomPilot</h2>
        <div style={{ display: 'flex', gap: '24px', marginTop: '8px', color: '#555' }}>
          <span><strong>Platform:</strong> {displayPlatform}</span>
          <span><strong>Periode:</strong> {displayPeriod}</span>
          <span><strong>Tanggal Generate:</strong> {new Date().toLocaleDateString('id-ID')}</span>
        </div>
      </div>

      {/* AI SUMMARY */}
      <div className="ai-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '8px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} /> Rangkuman Evaluasi {displayPeriod}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
          Secara keseluruhan, {displayPlatform} mencatatkan GMV sebesar <strong>{formatIDR(kpis.totalGMV)}</strong> dengan ROAS rata-rata <strong>{kpis.roas.toFixed(1)}x</strong>. Pertumbuhan cukup stabil didorong oleh kontribusi Affiliate sebesar <strong>{kpis.affiliateContribution.toFixed(1)}%</strong>. Untuk evaluasi bulan depan, disarankan untuk mengoptimalkan budget pada channel dengan ROAS di atas 4x dan memperbanyak kuota sampel affiliate untuk menjaga momentum penjualan.
        </p>
      </div>

      {/* EXECUTIVE KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        <div className="stat-card">
          <p className="stat-label" style={{ marginBottom: '8px' }}>Total GMV</p>
          <h2 className="stat-value">{formatIDR(kpis.totalGMV)}</h2>
        </div>
        <div className="stat-card">
          <p className="stat-label" style={{ marginBottom: '8px' }}>Net Sales</p>
          <h2 className="stat-value">{formatIDR(kpis.totalNetSales)}</h2>
        </div>
        <div className="stat-card">
          <p className="stat-label" style={{ marginBottom: '8px' }}>Total Order</p>
          <h2 className="stat-value">{kpis.totalOrders.toLocaleString()}</h2>
        </div>
        <div className="stat-card">
          <p className="stat-label" style={{ marginBottom: '8px' }}>ROAS Iklan</p>
          <h2 className="stat-value">{kpis.roas.toFixed(1)}x</h2>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--success-light)', borderColor: 'var(--success-border)' }}>
          <p className="stat-label" style={{ color: 'var(--success)', marginBottom: '8px' }}>Kontribusi Affiliate</p>
          <h2 className="stat-value" style={{ color: 'var(--success)' }}>{kpis.affiliateContribution.toFixed(1)}%</h2>
        </div>
      </div>

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }} className="print-charts-grid">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <TrendingUp size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Grafik Pertumbuhan GMV & Affiliate</h3>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAffiliate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(val) => `${(val/1000000)} Jt`} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: any) => `Rp ${Number(value).toLocaleString()}`} 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--surface-border)' }}
                />
                <Area type="monotone" dataKey="gmv" name="Total GMV" stroke="#2563EB" fill="url(#colorGmv)" strokeWidth={3} />
                <Area type="monotone" dataKey="affiliateGmv" name="Affiliate GMV" stroke="#059669" fill="url(#colorAffiliate)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <PieChart size={18} color="var(--primary-navy)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Share per Platform</h3>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformGrowth} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--surface-border)" />
                <XAxis type="number" tickFormatter={(val) => `${(val/1000000)} Jt`} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }} type="category" width={80} />
                <Tooltip 
                  formatter={(value: any) => `Rp ${Number(value).toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--surface-border)' }} 
                />
                <Bar dataKey="gmv" name="GMV" fill="var(--primary)" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  )
}
