'use client'

import { useState } from 'react'

export function AffiliateDealSimulator({ brandId }: { brandId: string }) {
  const [targetROI, setTargetROI] = useState(5)
  const [minCommission, setMinCommission] = useState(8)
  const [maxCommission, setMaxCommission] = useState(15)
  
  const [sellingPrice, setSellingPrice] = useState(150000)
  const [cogs, setCogs] = useState(40000)
  const [marketplaceFeePct, setMarketplaceFeePct] = useState(6.5)

  // Computed state (Normally would hit API or run live locally)
  const marketplaceFee = sellingPrice * (marketplaceFeePct / 100)
  const availableMargin = sellingPrice - cogs - marketplaceFee
  
  const maxAffiliateCost = availableMargin / (targetROI + 1)
  const maxSustainableCommission = (maxAffiliateCost / sellingPrice) * 100
  const breakEvenCommission = (availableMargin / sellingPrice) * 100

  const [currentCommission, setCurrentCommission] = useState(10)
  const currentCommissionCost = sellingPrice * (currentCommission / 100)
  const netContribution = availableMargin - currentCommissionCost
  const projectedROI = currentCommissionCost > 0 ? netContribution / currentCommissionCost : 0

  return (
    <div className="card">
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>Deal Simulator</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Target ROI (x)</label>
            <input type="number" value={targetROI} onChange={e => setTargetROI(Number(e.target.value))} style={{ padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid var(--surface-border)' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Selling Price (Rp)</label>
            <input type="number" value={sellingPrice} onChange={e => setSellingPrice(Number(e.target.value))} style={{ padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid var(--surface-border)' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>COGS (Rp)</label>
            <input type="number" value={cogs} onChange={e => setCogs(Number(e.target.value))} style={{ padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid var(--surface-border)' }} />
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-border)', padding: '20px', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Commission Slider</h4>
          
          <input 
            type="range" 
            min="1" max="30" step="0.5"
            value={currentCommission}
            onChange={e => setCurrentCommission(Number(e.target.value))}
            style={{ width: '100%', accentColor: currentCommission > maxSustainableCommission ? 'var(--danger)' : 'var(--success)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontWeight: 600, fontSize: '1.2rem' }}>
            <span>{currentCommission.toFixed(1)}%</span>
            <span style={{ color: currentCommission > maxSustainableCommission ? 'var(--danger)' : 'var(--success)' }}>
              {projectedROI.toFixed(1)}x ROI
            </span>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Max Sustainable Commission</span>
              <span style={{ fontWeight: 600 }}>{maxSustainableCommission.toFixed(1)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Break-Even Commission</span>
              <span style={{ fontWeight: 600 }}>{breakEvenCommission.toFixed(1)}%</span>
            </div>
          </div>

          {currentCommission > maxSustainableCommission && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.85rem' }}>
              ⚠ Commission exceeds sustainable threshold for Target ROI.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
