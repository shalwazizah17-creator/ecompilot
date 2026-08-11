'use client'

import { useEffect, useState } from 'react'
import { Activity, ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle, ShieldCheck, DollarSign, Target, ShoppingCart, Percent, Database } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const url = '/api/intelligence/daily'
        const res = await fetch(url)
        const json = await res.json()
        if (json.score !== undefined) setData(json)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div>Memuat Pusat Perintah Eksekutif...</div>
  if (!data) return <div>Gagal memuat data.</div>

  const { score, healthStatus, metrics, risks, opportunities } = data

  const formatCurrency = (val: number) => `Rp ${(val/1000000).toFixed(1)}M`
  
  let healthColor = 'var(--text-primary)'
  if (healthStatus === 'Excellent') healthColor = 'var(--success)'
  else if (healthStatus === 'Healthy') healthColor = 'var(--primary)'
  else if (healthStatus === 'Needs Attention') healthColor = 'var(--warning)'
  else if (healthStatus === 'Critical') healthColor = 'var(--danger)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Pusat Perintah Eksekutif</h1>
          <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            <span>Kesehatan Data: {data.dataHealthPct}%</span>
            <span>•</span>
            <span>Terakhir diperbarui: {new Date(data.lastUpdated).toLocaleString()}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
          <Activity size={28} color={healthColor} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Skor Kesehatan Bisnis</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: healthColor }}>{score} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>/ 100</span></div>
            <div style={{ fontSize: '0.85rem', color: healthColor, fontWeight: 500 }}>{healthStatus}</div>
          </div>
        </div>
      </div>

      {!data.hasData ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', backgroundColor: 'var(--surface)' }}>
          <Database size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Data Diperlukan</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '500px', lineHeight: '1.6' }}>
            Belum ada data marketplace yang diimpor. Unggah laporan Seller Center terbaru Anda untuk memulai analisis.
          </p>
          <Link href="/data-sources" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1rem', fontWeight: 600, textDecoration: 'none' }}>
            + Impor Data Marketplace
          </Link>
        </div>
      ) : (
        <>
          {/* KPI GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={16} /> Total GMV (30d)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(metrics.currGmv)}</div>
          <div style={{ fontSize: '0.8rem', color: metrics.gmvGrowth >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {metrics.gmvGrowth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(metrics.gmvGrowth).toFixed(1)}% vs Prev
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShoppingCart size={16} /> Pesanan
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{metrics.currOrders.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Total transaksi diproses
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={16} /> Ads ROAS
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{metrics.currRoas.toFixed(2)}x</div>
          <div style={{ fontSize: '0.8rem', color: metrics.currRoas > 4 ? 'var(--success)' : (metrics.currRoas > 2 ? 'var(--warning)' : 'var(--danger)'), marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Target: 4.0x+
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={16} /> Penjualan Bersih
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(metrics.currNetSales)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Setelah pembatalan
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Percent size={16} /> Profit Est (15%)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(metrics.estProfit)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '8px' }}>
            Margin: {metrics.margin.toFixed(1)}%
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} /> Affiliate GMV
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(metrics.currAffGmv)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '8px' }}>
            {metrics.currGmv > 0 ? ((metrics.currAffGmv / metrics.currGmv) * 100).toFixed(1) : 0}% of Total GMV
          </div>
        </div>
      </div>

      {(!data.metrics || (data.metrics.currGmv === 0 && data.metrics.currOrders === 0)) ? (
        <div style={{ padding: '40px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--surface-border)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Ruang kerja Anda sudah siap.</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Impor data marketplace Anda untuk memulai analisis.</p>
          <Link href="/data-sources" style={{ display: 'inline-block', backgroundColor: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: '6px', fontWeight: 500, textDecoration: 'none' }}>
            + IMPOR DATA MARKETPLACE
          </Link>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '16px' }}>Didukung: Shopee, TikTok Shop, Tokopedia</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontWeight: 600 }}>
            <AlertTriangle size={20} /> RISIKO TERBESAR
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {risks.map((r: any, idx: number) => (
              <div key={idx} style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px', borderLeft: `3px solid ${r.severity === 'HIGH' ? 'var(--danger)' : (r.severity === 'MEDIUM' ? 'var(--warning)' : 'var(--success)')}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.title}</span>
                  <span style={{ fontSize: '0.8rem', color: r.severity === 'HIGH' ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{r.severity}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '4px', fontWeight: 500 }}>
                  Aktual: {r.change} | Target: {r.target}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{r.reason}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Tindakan: {r.action}</div>
                {r.impact && r.impact !== 'N/A' && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '8px', fontWeight: 600 }}>Dampak: {r.impact}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 600 }}>
            <TrendingUp size={20} /> PELUANG TERBESAR
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {opportunities.map((o: any, idx: number) => (
              <div key={idx} style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px', borderLeft: '3px solid var(--success)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{o.opportunity}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>{o.metrics}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{o.impact}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>Tindakan: {o.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
      </>
      )}
    </div>
  )
}
