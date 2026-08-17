'use client'

import { useState } from 'react'
import { Calculations } from '@/lib/calculations'

interface MarginSimulatorProps {
  initialSellingPrice?: number
  initialHpp?: number
  initialMarketplaceFeePct?: number
  initialAffiliateCommissionPct?: number
  initialVoucherPct?: number
  initialAdSpendPct?: number
  targetMarginPct?: number
  productName?: string
}

const STATUS_CONFIG = {
  SAFE: { label: '🟢 AMAN', color: '#059669', bg: 'rgba(5, 150, 105, 0.08)', border: 'rgba(5, 150, 105, 0.2)' },
  LOW_MARGIN: { label: '🟡 MARGIN RENDAH', color: '#d97706', bg: 'rgba(217, 119, 6, 0.08)', border: 'rgba(217, 119, 6, 0.2)' },
  HIGH_RISK: { label: '🟠 RISIKO TINGGI', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.08)', border: 'rgba(234, 88, 12, 0.2)' },
  LOSS: { label: '🔴 MERUGI', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.08)', border: 'rgba(220, 38, 38, 0.2)' },
}

function formatRp(val: number) {
  return `Rp ${Math.round(val).toLocaleString('id-ID')}`
}

function SliderRow({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={e => onChange(Number(e.target.value))}
            style={{
              width: '80px', textAlign: 'right', padding: '4px 8px',
              border: '1px solid var(--surface-border)', borderRadius: '6px',
              backgroundColor: 'var(--background)', color: 'var(--text-primary)',
              fontSize: '0.9rem', fontWeight: 600,
            }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '20px' }}>{unit}</span>
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
      />
    </div>
  )
}

export function MarginSimulator({
  initialSellingPrice = 100000,
  initialHpp = 40000,
  initialMarketplaceFeePct = 5,
  initialAffiliateCommissionPct = 0,
  initialVoucherPct = 0,
  initialAdSpendPct = 0,
  targetMarginPct = 20,
  productName,
}: MarginSimulatorProps) {
  const [sellingPrice, setSellingPrice] = useState(initialSellingPrice)
  const [hpp, setHpp] = useState(initialHpp)
  const [marketplaceFeePct, setMarketplaceFeePct] = useState(initialMarketplaceFeePct)
  const [affiliateCommissionPct, setAffiliateCommissionPct] = useState(initialAffiliateCommissionPct)
  const [voucherPct, setVoucherPct] = useState(initialVoucherPct)
  const [adSpendPct, setAdSpendPct] = useState(initialAdSpendPct)
  const paymentFeePct = 2 // fixed 2%

  const result = Calculations.skuMarginAnalysis({
    sellingPrice, units: 1, hpp,
    marketplaceFeePct, paymentFeePct, affiliateCommissionPct,
    voucherPct, adSpendPct, otherCostsPct: 0,
    refundsPct: 0, cancellationsPct: 0,
  })

  const status = Calculations.marginRiskStatus(result.marginPercent, targetMarginPct)
  const statusCfg = STATUS_CONFIG[status]

  const minSafePrice = Calculations.minimumSafePrice({
    hpp, marketplaceFeePct, paymentFeePct: paymentFeePct,
    affiliateCommissionPct, voucherPct, adSpendPct, otherCostsPct: 0, targetMarginPct,
  })

  const maxSafeVoucher = Calculations.maximumSafeVoucher({
    sellingPrice, hpp, marketplaceFeePct, paymentFeePct: paymentFeePct,
    affiliateCommissionPct, adSpendPct, otherCostsPct: 0, targetMarginPct,
  })

  const gapToTarget = targetMarginPct - result.marginPercent

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
            {productName ? `Simulasi: ${productName}` : 'Simulasi Margin'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SliderRow label="Harga Jual" value={sellingPrice} min={1000} max={5000000} step={1000} unit="Rp" onChange={setSellingPrice} />
            <SliderRow label="HPP (Modal)" value={hpp} min={0} max={sellingPrice} step={500} unit="Rp" onChange={setHpp} />
            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '12px' }}>
              <SliderRow label="Fee Marketplace" value={marketplaceFeePct} min={0} max={25} step={0.5} unit="%" onChange={setMarketplaceFeePct} />
            </div>
            <SliderRow label="Komisi Afiliasi" value={affiliateCommissionPct} min={0} max={30} step={0.5} unit="%" onChange={setAffiliateCommissionPct} />
            <SliderRow label="Voucher/Diskon" value={voucherPct} min={0} max={50} step={0.5} unit="%" onChange={setVoucherPct} />
            <SliderRow label="Biaya Iklan" value={adSpendPct} min={0} max={30} step={0.5} unit="%" onChange={setAdSpendPct} />
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Status Banner */}
        <div style={{
          padding: '16px 20px', borderRadius: '10px',
          backgroundColor: statusCfg.bg, border: `1px solid ${statusCfg.border}`,
          display: 'flex', flexDirection: 'column', gap: '4px'
        }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: statusCfg.color }}>{statusCfg.label}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: statusCfg.color }}>
            {result.marginPercent.toFixed(1)}% Margin
          </div>
          {gapToTarget > 0 && (
            <div style={{ fontSize: '0.85rem', color: statusCfg.color, opacity: 0.85 }}>
              ⚠️ {gapToTarget.toFixed(1)} poin di bawah target {targetMarginPct}%
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div style={{ backgroundColor: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px', letterSpacing: '0.5px' }}>Rincian per Unit</div>
          {[
            { label: 'Harga Jual (Gross)', value: result.grossSales, type: 'income' },
            { label: `Voucher (${voucherPct}%)`, value: -result.voucherCost, type: 'cost' },
            { label: '→ Pendapatan Bersih', value: result.netRevenue, type: 'neutral', bold: true },
            { label: `HPP / Modal`, value: -result.hppTotal, type: 'cost' },
            { label: `Fee Marketplace (${marketplaceFeePct}%)`, value: -result.marketplaceFee, type: 'cost' },
            { label: `Fee Pembayaran (${paymentFeePct}%)`, value: -result.paymentFee, type: 'cost' },
            { label: `Komisi Afiliasi (${affiliateCommissionPct}%)`, value: -result.affiliateCommission, type: 'cost' },
            { label: `Biaya Iklan (${adSpendPct}%)`, value: -result.adCost, type: 'cost' },
            { label: '→ Total Biaya', value: -result.totalVariableCost, type: 'cost', bold: true },
            { label: '💰 Keuntungan Bersih', value: result.netProfit, type: result.netProfit >= 0 ? 'profit' : 'loss', bold: true },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: row.bold ? 600 : 400 }}>{row.label}</span>
              <span style={{
                fontSize: row.bold ? '0.95rem' : '0.85rem',
                fontWeight: row.bold ? 700 : 500,
                color: row.type === 'income' ? 'var(--text-primary)' : row.type === 'cost' ? 'var(--danger)' : row.type === 'profit' ? 'var(--success)' : row.type === 'loss' ? 'var(--danger)' : 'var(--text-primary)'
              }}>
                {formatRp(Math.abs(row.value))}
              </span>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Batas Aman</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Harga Minimum Aman</span>
            <span style={{ fontWeight: 700, color: minSafePrice > sellingPrice ? 'var(--danger)' : 'var(--success)', fontSize: '0.9rem' }}>{formatRp(Math.ceil(minSafePrice))}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Voucher Maksimum Aman</span>
            <span style={{ fontWeight: 700, color: voucherPct > maxSafeVoucher ? 'var(--danger)' : 'var(--success)', fontSize: '0.9rem' }}>{maxSafeVoucher.toFixed(1)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Margin</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{targetMarginPct}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
