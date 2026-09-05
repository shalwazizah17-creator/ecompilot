'use client'

import { useEffect, useState, useMemo } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'
import { Filter, Printer, FileText, PieChart, Store, Calendar, TrendingUp, Plus, X, Trash2, RotateCcw, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default function MarketplaceIntelligence() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Controls
  const [platform, setPlatform] = useState('ALL') // ALL, Shopee, TikTok Shop, Tokopedia
  const [period, setPeriod] = useState('MONTHLY') // WEEKLY, MONTHLY, YEARLY

  // Modal State
  const [showInputModal, setShowInputModal] = useState(false)
  const [savingData, setSavingData] = useState(false)
  const [inputPlatform, setInputPlatform] = useState('Shopee')
  const [inputReportType, setInputReportType] = useState('bulanan')
  const [inputDate, setInputDate] = useState(() => new Date().toISOString().split('T')[0])
  const [inputGMV, setInputGMV] = useState('')
  const [inputOrders, setInputOrders] = useState('')
  const [inputSpend, setInputSpend] = useState('')
  const [inputRefunds, setInputRefunds] = useState('')

  const load = async () => {
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

  useEffect(() => {
    load()
  }, [])

  const formatIDR = (val: number) => {
    if (!val || val === 0) return 'Rp 0'
    if (val >= 1000000) {
      return `Rp ${(val / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`
    }
    return `Rp ${val.toLocaleString('id-ID')}`
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSaveData = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingData(true)

    const gmvNum = parseFloat(inputGMV) || 0
    const ordersNum = parseInt(inputOrders) || 0
    const spendNum = parseFloat(inputSpend) || 0
    const refundsNum = parseFloat(inputRefunds) || 0

    try {
      const res = await fetch(`/api/marketplace-intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName: inputPlatform,
          date: inputDate,
          gmv: gmvNum,
          orders: ordersNum,
          spend: spendNum,
          refunds: refundsNum,
          cancellations: 0,
        })
      })

      if (res.ok) {
        setShowInputModal(false)
        setInputGMV('')
        setInputOrders('')
        setInputSpend('')
        setInputRefunds('')
        await load()
        alert('Data laporan berhasil disimpan! Dashboard sudah langsung terupdate 🎉')
      } else {
        alert('Gagal menyimpan data laporan ke server.')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan koneksi saat menyimpan data.')
    } finally {
      setSavingData(false)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Yakin ingin menghapus baris data laporan ini?')) return
    try {
      const res = await fetch(`/api/marketplace-intelligence?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        await load()
      } else {
        alert('Gagal menghapus data laporan.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Yakin ingin mengosongkan semua data laporan kembali ke 0? Data yang dihapus tidak bisa dikembalikan.')) return
    try {
      const res = await fetch(`/api/marketplace-intelligence?clearAll=true`, { method: 'DELETE' })
      if (res.ok) {
        await load()
        alert('Semua data laporan berhasil dibersihkan! Dashboard kembali bersih (0).')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Filtered calculations based on platform selection
  const filteredData = useMemo(() => {
    if (!data) return null
    const { kpis, chartData, platformGrowth, recentEntries = [], hasData } = data

    if (platform === 'ALL') {
      return { kpis, chartData, platformGrowth, recentEntries, hasData }
    }

    const matchedEntries = recentEntries.filter((e: any) => 
      e.platform.toLowerCase().includes(platform.toLowerCase()) ||
      platform.toLowerCase().includes(e.platform.toLowerCase())
    )

    const totalGMV = matchedEntries.reduce((acc: number, cur: any) => acc + (cur.sales || 0), 0)
    const totalOrders = matchedEntries.reduce((acc: number, cur: any) => acc + (cur.orders || 0), 0)
    const totalAdSpend = matchedEntries.reduce((acc: number, cur: any) => acc + (cur.spend || 0), 0)
    const totalRefunds = matchedEntries.reduce((acc: number, cur: any) => acc + (cur.refunds || 0), 0)
    const totalNetSales = Math.max(0, totalGMV - totalRefunds)
    const roas = totalAdSpend > 0 ? totalGMV / totalAdSpend : 0

    const matchedGrowth = (platformGrowth || []).filter((p: any) =>
      p.name.toLowerCase().includes(platform.toLowerCase()) ||
      platform.toLowerCase().includes(p.name.toLowerCase())
    )

    return {
      kpis: {
        totalGMV,
        totalNetSales,
        totalOrders,
        roas,
        affiliateContribution: 0,
      },
      chartData: totalGMV > 0 ? chartData : [],
      platformGrowth: matchedGrowth,
      recentEntries: matchedEntries,
      hasData: matchedEntries.length > 0 && totalGMV > 0,
    }
  }, [data, platform])

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="skeleton" style={{ width: '300px', height: '40px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />)}
        </div>
      </div>
    )
  }

  if (!filteredData || !filteredData.kpis) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Gagal memuat data laporan.</div>
  }

  const { kpis, chartData, platformGrowth, recentEntries, hasData } = filteredData

  const displayPlatform = platform === 'ALL' ? 'Semua Marketplace' : platform
  const displayPeriod = period === 'WEEKLY' ? 'Mingguan' : period === 'MONTHLY' ? 'Bulanan' : 'Tahunan'

  const hasChartPoints = chartData && chartData.length > 0 && chartData.some((c: any) => (c.gmv || 0) > 0)

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Laporan Evaluasi Marketplace
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Rangkuman performa jualan di {displayPlatform} buat evaluasi {displayPeriod}.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }} className="no-print">
          {recentEntries.length > 0 && (
            <button 
              onClick={handleClearAll} 
              className="btn-outline" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--error, #ef4444)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              title="Kosongkan semua data laporan"
            >
              <RotateCcw size={15} /> Kosongkan Data
            </button>
          )}
          <button 
            onClick={() => setShowInputModal(true)} 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Input Data Laporan
          </button>
          <button 
            onClick={handlePrint} 
            className="btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="no-print card-flat" style={{ padding: '14px 20px', display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '10px', flexWrap: 'wrap' }}>
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

      {/* PRINT HEADER */}
      <div className="print-only" style={{ display: 'none', marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Laporan Evaluasi EcomPilot</h2>
        <div style={{ display: 'flex', gap: '24px', marginTop: '8px', color: '#555' }}>
          <span><strong>Platform:</strong> {displayPlatform}</span>
          <span><strong>Periode:</strong> {displayPeriod}</span>
          <span><strong>Tanggal Generate:</strong> {new Date().toLocaleDateString('id-ID')}</span>
        </div>
      </div>

      {/* AI SUMMARY / EMPTY INSIGHT */}
      <div className="ai-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '8px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} /> Insight Laporan {displayPeriod} (by AI)
        </h3>
        {kpis.totalGMV > 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
            Overall, performa jualan di {displayPlatform} berhasil nyetak GMV sebesar <strong>{formatIDR(kpis.totalGMV)}</strong> dengan total <strong>{kpis.totalOrders.toLocaleString('id-ID')} pesanan</strong>. Rata-rata ROAS berada di angka <strong>{kpis.roas > 0 ? `${kpis.roas.toFixed(1)}x` : '-'}</strong>. {kpis.affiliateContribution > 0 ? `Penjualan juga didukung mitra Affiliate sebesar ${kpis.affiliateContribution.toFixed(1)}% dari total sales.` : 'Belum ada catatan biaya affiliate pada periode ini.'} Pantau terus tren harian dan maksimalkan promosi pada channel dengan konversi tertinggi! 🚀
          </p>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Belum ada data laporan penjualan yang diinput untuk {displayPlatform} periode {displayPeriod}. Halaman ini siap digunakan tanpa data dummy. Silakan klik tombol <strong>+ Input Data Laporan</strong> di atas untuk memasukkan data penjualan tokomu, atau upload file pesanan di menu <Link href="/data-sources" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Sumber Data</Link>. ✨
          </p>
        )}
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
          <h2 className="stat-value">{kpis.totalOrders ? kpis.totalOrders.toLocaleString('id-ID') : '0'}</h2>
        </div>
        <div className="stat-card">
          <p className="stat-label" style={{ marginBottom: '8px' }}>ROAS Iklan</p>
          <h2 className="stat-value">{kpis.roas > 0 ? `${kpis.roas.toFixed(1)}x` : '-'}</h2>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--success-light)', borderColor: 'var(--success-border)' }}>
          <p className="stat-label" style={{ color: 'var(--success)', marginBottom: '8px' }}>Kontribusi Affiliate</p>
          <h2 className="stat-value" style={{ color: 'var(--success)' }}>
            {kpis.affiliateContribution > 0 ? `${kpis.affiliateContribution.toFixed(1)}%` : '0.0%'}
          </h2>
        </div>
      </div>

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }} className="print-charts-grid">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <TrendingUp size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Grafik Pertumbuhan GMV & Affiliate</h3>
          </div>
          {hasChartPoints ? (
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
                    formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`} 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--surface-border)' }}
                  />
                  <Area type="monotone" dataKey="gmv" name="Total GMV" stroke="#2563EB" fill="url(#colorGmv)" strokeWidth={3} />
                  <Area type="monotone" dataKey="affiliateGmv" name="Affiliate GMV" stroke="#059669" fill="url(#colorAffiliate)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '10px', backgroundColor: 'var(--surface-subtle, rgba(0,0,0,0.02))', borderRadius: '8px', border: '1px dashed var(--surface-border)' }}>
              <TrendingUp size={36} style={{ opacity: 0.35 }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--text-secondary)' }}>Belum ada histori grafik penjualan</p>
              <p style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-muted)' }}>Input data laporan penjualan toko untuk melihat visualisasi tren pertumbuhan di sini.</p>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <PieChart size={18} color="var(--primary-navy)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Share per Platform</h3>
          </div>
          {platformGrowth && platformGrowth.length > 0 && platformGrowth.some((p: any) => (p.gmv || 0) > 0) ? (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformGrowth} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--surface-border)" />
                  <XAxis type="number" tickFormatter={(val) => `${(val/1000000)} Jt`} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }} type="category" width={80} />
                  <Tooltip 
                    formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--surface-border)' }} 
                  />
                  <Bar dataKey="gmv" name="GMV" fill="var(--primary)" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '10px', backgroundColor: 'var(--surface-subtle, rgba(0,0,0,0.02))', borderRadius: '8px', border: '1px dashed var(--surface-border)' }}>
              <PieChart size={36} style={{ opacity: 0.35 }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--text-secondary)' }}>Belum ada data share platform</p>
              <p style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-muted)', textAlign: 'center', padding: '0 16px' }}>Data Shopee, TikTok Shop, & Tokopedia akan muncul setelah ada laporan tersimpan.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIWAYAT INPUT DATA LAPORAN TABLE */}
      <div className="card no-print" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Riwayat Data Laporan Yang Diinput
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Data penjualan manual toko kamu yang tercatat di sistem.
            </p>
          </div>
          {recentEntries.length > 0 && (
            <span style={{ fontSize: '0.8125rem', padding: '4px 10px', backgroundColor: 'var(--surface-border)', borderRadius: '20px', fontWeight: 600 }}>
              {recentEntries.length} data tersimpan
            </span>
          )}
        </div>

        {recentEntries.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', border: '1px dashed var(--surface-border)', borderRadius: '8px', backgroundColor: 'var(--surface-subtle, rgba(0,0,0,0.01))' }}>
            <ShoppingBag size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px' }}>
              Belum ada data laporan yang dimasukkan
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Mulai input data penjualan atau omzet toko kamu agar metrik dashboard langsung aktif.
            </p>
            <button onClick={() => setShowInputModal(true)} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
              <Plus size={15} /> + Input Data Sekarang
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}>
                  <th style={{ padding: '10px 12px' }}>Tanggal</th>
                  <th style={{ padding: '10px 12px' }}>Platform</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total GMV</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Order</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Biaya Iklan</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '80px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((item: any) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '12px', fontWeight: 500 }}>{item.date}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: item.platform.toLowerCase().includes('shopee') ? '#fff1ee' : item.platform.toLowerCase().includes('tiktok') ? '#f1f5f9' : '#eefbf4',
                        color: item.platform.toLowerCase().includes('shopee') ? '#ee4d2d' : item.platform.toLowerCase().includes('tiktok') ? '#0f172a' : '#10b981',
                        border: `1px solid ${item.platform.toLowerCase().includes('shopee') ? '#fed7aa' : item.platform.toLowerCase().includes('tiktok') ? '#cbd5e1' : '#a7f3d0'}`
                      }}>
                        {item.platform}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                      Rp {Number(item.sales || 0).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {Number(item.orders || 0).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {item.spend > 0 ? `Rp ${Number(item.spend).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDeleteEntry(item.id)}
                        title="Hapus baris ini"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error, #ef4444)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INPUT MODAL */}
      {showInputModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '500px', padding: '24px', backgroundColor: 'var(--surface)', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Input Data Laporan Penjualan</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Masukkan data real penjualan marketplace tokomu.
                </p>
              </div>
              <button 
                onClick={() => setShowInputModal(false)} 
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveData} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Platform</label>
                  <select 
                    className="input" 
                    value={inputPlatform}
                    onChange={e => setInputPlatform(e.target.value)}
                    required
                  >
                    <option value="Shopee">Shopee</option>
                    <option value="TikTok Shop">TikTok Shop</option>
                    <option value="Tokopedia">Tokopedia</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Tipe Laporan</label>
                  <select 
                    className="input"
                    value={inputReportType}
                    onChange={e => setInputReportType(e.target.value)}
                    required
                  >
                    <option value="harian">Harian</option>
                    <option value="mingguan">Mingguan</option>
                    <option value="bulanan">Bulanan</option>
                    <option value="tahunan">Tahunan</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Periode / Tanggal</label>
                <input 
                  type="date" 
                  className="input" 
                  value={inputDate}
                  onChange={e => setInputDate(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Total GMV (Rp) *</label>
                  <input 
                    type="number" 
                    className="input" 
                    placeholder="Contoh: 15000000" 
                    value={inputGMV}
                    onChange={e => setInputGMV(e.target.value)}
                    required 
                    min="0"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Total Pesanan (Orders) *</label>
                  <input 
                    type="number" 
                    className="input" 
                    placeholder="Contoh: 150" 
                    value={inputOrders}
                    onChange={e => setInputOrders(e.target.value)}
                    required 
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Biaya Iklan (Rp) (Opsional)</label>
                  <input 
                    type="number" 
                    className="input" 
                    placeholder="Contoh: 2500000" 
                    value={inputSpend}
                    onChange={e => setInputSpend(e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Pesanan Batal / Retur (Rp)</label>
                  <input 
                    type="number" 
                    className="input" 
                    placeholder="Contoh: 500000" 
                    value={inputRefunds}
                    onChange={e => setInputRefunds(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowInputModal(false)} 
                  className="btn-outline"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={savingData}
                >
                  {savingData ? 'Menyimpan...' : 'Simpan Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

