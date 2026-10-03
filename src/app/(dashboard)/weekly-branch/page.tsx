'use client'

import React, { useState } from 'react'
import {
  TrendingUp,
  Target,
  ShoppingCart,
  Users,
  Video,
  Store,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react'

// Dummy Data mimicking the user's Google Sheet
const MOCK_DATA = {
  Surabaya: {
    w1: { gmv: 14109334, ads: 0, roas: 0, traffic: 1181, orders: 82, cr: 6.93, stock: 'Menipis', campaign: 'Promo Payday', video: 2508562, affiliate: 0 },
    w2: { gmv: 14521800, ads: 0, roas: 0, traffic: 1715, orders: 85, cr: 5.00, stock: 'OOS', campaign: '4.4 Cuci Gudang', video: 3016848, affiliate: 0 },
    w3: { gmv: 3038200,  ads: 0, roas: 0, traffic: 547,  orders: 21, cr: 4.00, stock: 'OOS', campaign: '4.4 Cuci Gudang', video: 2222232, affiliate: 0 },
    w4: { gmv: 10094220, ads: 0, roas: 0, traffic: 1454, orders: 58, cr: 4.00, stock: 'Aman', campaign: 'All Monday', video: 1980291, affiliate: 0 },
  },
  Semarang: {
    w1: { gmv: 7165850, ads: 0, roas: 0, traffic: 937, orders: 49, cr: 5.28, stock: 'Aman', campaign: '-', video: 1200000, affiliate: 0 },
    w2: { gmv: 7564360, ads: 0, roas: 0, traffic: 1291, orders: 68, cr: 5.30, stock: 'Aman', campaign: '-', video: 1500000, affiliate: 0 },
    w3: { gmv: 1390100, ads: 0, roas: 0, traffic: 289, orders: 13, cr: 4.70, stock: 'Menipis', campaign: '-', video: 400000, affiliate: 0 },
    w4: { gmv: 5352320, ads: 0, roas: 0, traffic: 812, orders: 38, cr: 4.70, stock: 'Aman', campaign: '-', video: 900000, affiliate: 0 },
  }
}

export default function WeeklyBranchPage() {
  const [selectedMonth, setSelectedMonth] = useState('Maret 2026')
  const [targetMonthly, setTargetMonthly] = useState(72000000)
  
  const formatRp = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
  
  // Calculate aggregate
  const totalGmvSurabaya = Object.values(MOCK_DATA.Surabaya).reduce((acc, curr) => acc + curr.gmv, 0)
  const totalGmvSemarang = Object.values(MOCK_DATA.Semarang).reduce((acc, curr) => acc + curr.gmv, 0)
  const totalGmvAll = totalGmvSurabaya + totalGmvSemarang
  const achievement = ((totalGmvAll / targetMonthly) * 100).toFixed(1)

  const renderBadgeCR = (cr: number) => {
    if (cr >= 4.5) return <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: '0.75rem' }}>🔵 Strong &gt; 4.5%</span>
    if (cr >= 3.0) return <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#FEFCE8', color: '#CA8A04', fontWeight: 700, fontSize: '0.75rem' }}>🟡 Good 3-4.5%</span>
    return <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: '0.75rem' }}>🔴 Danger &lt; 3%</span>
  }

  const renderBadgeTraffic = (traffic: number) => {
    if (traffic >= 1000) return <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: '0.75rem' }}>🔵 Strong &gt; 1rb</span>
    if (traffic >= 500) return <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#ECFDF5', color: '#059669', fontWeight: 700, fontSize: '0.75rem' }}>🟢 Good &gt; 500</span>
    return <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: '0.75rem' }}>🔴 Danger &lt; 500</span>
  }
  
  const renderBadgeStock = (status: string) => {
    if (status === 'OOS') return <span style={{ color: '#DC2626', fontWeight: 800 }}>OOS</span>
    if (status === 'Menipis') return <span style={{ color: '#CA8A04', fontWeight: 800 }}>Menipis</span>
    return <span style={{ color: '#059669', fontWeight: 800 }}>Aman</span>
  }

  const branches = Object.entries(MOCK_DATA)

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
            Weekly Monitor Cabang
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Laporan otomatis performa GMV, Traffic, CR, dan Stok per cabang tanpa perlu ketik manual di Excel.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="filter-select" style={{ fontWeight: 600 }}>
            <option>Maret 2026</option>
            <option>April 2026</option>
            <option>Mei 2026</option>
          </select>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UploadCloud size={16} /> Import Shopee Data
          </button>
        </div>
      </div>

      {/* Target & Achievement */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="stat-card" style={{ backgroundColor: '#F8FAFC', padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>🎯 Target Bulanan (All Cabang)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>{formatRp(targetMonthly)}</div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#F0FDF4', padding: '16px 20px', borderColor: '#BBF7D0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '8px' }}>💰 Total Achievement (Aktual)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803D' }}>{formatRp(totalGmvAll)}</div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#FEFCE8', padding: '16px 20px', borderColor: '#FEF08A' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#854D0E', textTransform: 'uppercase', marginBottom: '8px' }}>🚀 % Pencapaian</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#A16207' }}>{achievement}%</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #E2E8F0' }}>
                <th style={{ minWidth: '150px', backgroundColor: '#F8FAFC', position: 'sticky', left: 0, zIndex: 10 }}>Cabang &amp; Metrik</th>
                <th style={{ textAlign: 'center', minWidth: '120px' }}>Week 1</th>
                <th style={{ textAlign: 'center', minWidth: '120px' }}>Week 2</th>
                <th style={{ textAlign: 'center', minWidth: '120px' }}>Week 3</th>
                <th style={{ textAlign: 'center', minWidth: '120px' }}>Week 4</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(([branchName, weeks]) => (
                <React.Fragment key={branchName}>
                  {/* Penjualan GMV */}
                  <tr>
                    <td style={{ backgroundColor: '#F8FAFC', position: 'sticky', left: 0, zIndex: 9, borderRight: '1px solid #E2E8F0' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>{branchName}</div>
                      <div style={{ color: '#64748B', fontSize: '0.75rem' }}>Penjualan (GMV)</div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRp(weeks.w1.gmv)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRp(weeks.w2.gmv)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRp(weeks.w3.gmv)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRp(weeks.w4.gmv)}</td>
                  </tr>
                  {/* Traffic */}
                  <tr>
                    <td style={{ backgroundColor: '#F8FAFC', position: 'sticky', left: 0, zIndex: 9, borderRight: '1px solid #E2E8F0' }}>
                      <div style={{ color: '#64748B', fontSize: '0.75rem' }}>Traffic (Pengunjung)</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, marginBottom: '6px' }}>{weeks.w1.traffic.toLocaleString('id-ID')}</div>
                      {renderBadgeTraffic(weeks.w1.traffic)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, marginBottom: '6px' }}>{weeks.w2.traffic.toLocaleString('id-ID')}</div>
                      {renderBadgeTraffic(weeks.w2.traffic)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, marginBottom: '6px' }}>{weeks.w3.traffic.toLocaleString('id-ID')}</div>
                      {renderBadgeTraffic(weeks.w3.traffic)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, marginBottom: '6px' }}>{weeks.w4.traffic.toLocaleString('id-ID')}</div>
                      {renderBadgeTraffic(weeks.w4.traffic)}
                    </td>
                  </tr>
                  {/* CR */}
                  <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                    <td style={{ backgroundColor: '#F8FAFC', position: 'sticky', left: 0, zIndex: 9, borderRight: '1px solid #E2E8F0' }}>
                      <div style={{ color: '#64748B', fontSize: '0.75rem' }}>Conversion Rate (CR)</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, marginBottom: '6px' }}>{weeks.w1.cr}%</div>
                      {renderBadgeCR(weeks.w1.cr)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, marginBottom: '6px' }}>{weeks.w2.cr}%</div>
                      {renderBadgeCR(weeks.w2.cr)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, marginBottom: '6px' }}>{weeks.w3.cr}%</div>
                      {renderBadgeCR(weeks.w3.cr)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, marginBottom: '6px' }}>{weeks.w4.cr}%</div>
                      {renderBadgeCR(weeks.w4.cr)}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '10px' }}>
        *Semua status Traffic, CR, dan Stok di-*generate* otomatis oleh EcomPilot berdasarkan *threshold* resmi Theraskin.
      </div>

    </div>
  )
}
