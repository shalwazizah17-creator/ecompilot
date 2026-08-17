'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, AlertTriangle, TrendingDown, DollarSign, Settings, Info } from 'lucide-react'
import { MarginSimulator } from '@/components/MarginSimulator'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  SAFE: { label: 'Aman', color: '#059669', bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.2)' },
  LOW_MARGIN: { label: 'Margin Rendah', color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.2)' },
  HIGH_RISK: { label: 'Risiko Tinggi', color: '#ea580c', bg: 'rgba(234,88,12,0.08)', border: 'rgba(234,88,12,0.2)' },
  LOSS: { label: 'Merugi', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.2)' },
}

function formatRp(v: number) { return `Rp ${Math.round(v).toLocaleString('id-ID')}` }
function formatPct(v: number) { return `${v.toFixed(1)}%` }

export default function MarginProtectionPage() {
  const [brandId, setBrandId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'simulator' | 'rules'>('overview')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [ruleForm, setRuleForm] = useState<any>({ marketplace: 'shopee', marketplace_fee_percent: 5, payment_fee_percent: 2, affiliate_commission_percent: 0, voucher_cost_percent: 0, target_margin_percent: 20 })
  const [rules, setRules] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(async (sess) => {
      if (!sess?.user) return
      const bRes = await fetch('/api/brands')
      const bData = await bRes.json()
      const bid = bData.brands?.[0]?.id
      if (!bid) { setLoading(false); return }
      setBrandId(bid)
      await loadData(bid)
    })
  }, [])

  async function loadData(bid: string) {
    setLoading(true)
    try {
      const [analysisRes, recRes, rulesRes] = await Promise.all([
        fetch(`/api/margin/analysis?brandId=${bid}`),
        fetch(`/api/margin/recommendations?brandId=${bid}`),
        fetch(`/api/margin/rules?brandId=${bid}`),
      ])
      const [analysis, rec, rulesData] = await Promise.all([analysisRes.json(), recRes.json(), rulesRes.json()])
      setData(analysis)
      setRecommendations(rec.recommendations ?? [])
      setRules(rulesData.rules ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function saveRule() {
    if (!brandId) return
    await fetch('/api/margin/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ruleForm, brandId }),
    })
    setShowRuleModal(false)
    loadData(brandId)
  }

  const tabs = [
    { key: 'overview', label: '📊 Ringkasan' },
    { key: 'products', label: '🏷️ Produk' },
    { key: 'simulator', label: '🔬 Simulator' },
    { key: 'rules', label: '⚙️ Aturan Biaya' },
  ]

  const summary = data?.summary ?? { total: 0, safe: 0, lowMargin: 0, highRisk: 0, loss: 0 }
  const products = data?.products ?? []

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-secondary)' }}>
      Menganalisis margin produk...
    </div>
  )

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            🛡️ Margin Protection
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Analisis profitabilitas nyata setiap SKU setelah semua biaya: fee marketplace, voucher, afiliasi, dan iklan.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
            backgroundColor: 'transparent',
            color: activeTab === t.key ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Total Produk Dianalisis', value: summary.total, icon: '📦', color: 'var(--text-primary)' },
              { label: '🟢 Margin Aman', value: summary.safe, icon: null, color: '#059669' },
              { label: '🟡 Margin Rendah', value: summary.lowMargin, icon: null, color: '#d97706' },
              { label: '🟠 Risiko Tinggi', value: summary.highRisk, icon: null, color: '#ea580c' },
              { label: '🔴 Merugi', value: summary.loss, icon: null, color: '#dc2626' },
            ].map((card, i) => (
              <div key={i} className="card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>{card.label}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: card.color, marginTop: '8px' }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="var(--danger)" /> Tindakan yang Diperlukan ({recommendations.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recommendations.slice(0, 5).map((rec, i) => (
                  <div key={i} style={{
                    padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--surface-border)',
                    backgroundColor: 'var(--background)',
                    borderLeft: `4px solid ${rec.severity === 'CRITICAL' ? '#dc2626' : rec.severity === 'HIGH' ? '#ea580c' : '#d97706'}`
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{rec.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>{rec.reason}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>→ {rec.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {products.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <ShieldCheck size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Belum Ada Data Produk</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Import data marketplace Anda terlebih dahulu untuk mengaktifkan analisis margin.
              </p>
              <a href="/data-sources" className="btn-primary" style={{ display: 'inline-block' }}>Import Data Marketplace</a>
            </div>
          )}
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {products.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
              Belum ada data produk. <a href="/data-sources">Import data</a> terlebih dahulu.
            </div>
          ) : (
            <div className="card" style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                    {['SKU / Produk', 'Harga Jual', 'HPP', 'GMV (30H)', 'Margin %', 'Status', 'Harga Min Aman', 'Aksi'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p: any, i: number) => {
                    const st = STATUS_CONFIG[p.riskStatus] ?? STATUS_CONFIG.SAFE
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)', transition: 'background 0.15s' }}
                        onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--surface)')}
                        onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.sku}</div>
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{formatRp(p.sellingPrice)}</td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{formatRp(p.hpp)}</td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{formatRp(p.grossSales)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: st.color }}>{formatPct(p.marginPercent)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`, whiteSpace: 'nowrap' }}>
                            {st.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: p.minSafePrice > p.sellingPrice ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                          {formatRp(Math.ceil(p.minSafePrice))}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => { setSelectedProduct(p); setActiveTab('simulator') }}
                            style={{ padding: '6px 12px', border: '1px solid var(--primary)', borderRadius: '6px', color: 'var(--primary)', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            Simulasi
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SIMULATOR TAB */}
      {activeTab === 'simulator' && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔬 Simulator Harga & Voucher — Uji skenario sebelum diterapkan
          </h3>
          {products.length > 0 && (
            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>Pilih produk:</span>
              {products.map((p: any) => (
                <button key={p.sku} onClick={() => setSelectedProduct(p)} style={{
                  padding: '6px 14px', border: '1px solid var(--surface-border)', borderRadius: '20px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                  backgroundColor: selectedProduct?.sku === p.sku ? 'var(--primary)' : 'transparent',
                  color: selectedProduct?.sku === p.sku ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                }}>{p.name}</button>
              ))}
            </div>
          )}
          <MarginSimulator
            productName={selectedProduct?.name}
            initialSellingPrice={selectedProduct?.sellingPrice ?? 100000}
            initialHpp={selectedProduct?.hpp ?? 40000}
            targetMarginPct={selectedProduct?.targetMarginPct ?? 20}
          />
        </div>
      )}

      {/* RULES TAB */}
      {activeTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>⚙️ Aturan Biaya per Marketplace</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>Konfigurasikan fee dan target margin untuk setiap platform.</p>
            </div>
            <button className="btn-primary" onClick={() => setShowRuleModal(true)}>+ Tambah Aturan</button>
          </div>

          {rules.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <Settings size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
              Belum ada aturan biaya. Tambahkan aturan untuk mengaktifkan analisis margin yang akurat.
            </div>
          ) : (
            <div className="card" style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                    {['Marketplace', 'Fee Mkt', 'Fee Payment', 'Komisi Aff.', 'Voucher', 'Target Margin'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r: any) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, textTransform: 'capitalize' }}>{r.marketplace}</td>
                      <td style={{ padding: '12px 16px' }}>{r.marketplace_fee_percent}%</td>
                      <td style={{ padding: '12px 16px' }}>{r.payment_fee_percent}%</td>
                      <td style={{ padding: '12px 16px' }}>{r.affiliate_commission_percent}%</td>
                      <td style={{ padding: '12px 16px' }}>{r.voucher_cost_percent}%</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--primary)' }}>{r.target_margin_percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 20px', fontWeight: 700 }}>Tambah Aturan Biaya</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Marketplace', field: 'marketplace', type: 'select', options: ['shopee', 'tokopedia', 'tiktok', 'meta', 'lazada', 'other'] },
                { label: 'Fee Marketplace (%)', field: 'marketplace_fee_percent', type: 'number' },
                { label: 'Fee Pembayaran (%)', field: 'payment_fee_percent', type: 'number' },
                { label: 'Komisi Afiliasi (%)', field: 'affiliate_commission_percent', type: 'number' },
                { label: 'Voucher/Diskon (%)', field: 'voucher_cost_percent', type: 'number' },
                { label: 'Target Margin (%)', field: 'target_margin_percent', type: 'number' },
              ].map(f => (
                <div key={f.field}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select value={ruleForm[f.field]} onChange={e => setRuleForm((p: any) => ({ ...p, [f.field]: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
                      {f.options!.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type="number" step="0.1" value={ruleForm[f.field] ?? 0} onChange={e => setRuleForm((p: any) => ({ ...p, [f.field]: parseFloat(e.target.value) }))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRuleModal(false)} style={{ padding: '10px 20px', border: '1px solid var(--surface-border)', borderRadius: '8px', backgroundColor: 'transparent', cursor: 'pointer' }}>Batal</button>
              <button className="btn-primary" onClick={saveRule}>Simpan Aturan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
