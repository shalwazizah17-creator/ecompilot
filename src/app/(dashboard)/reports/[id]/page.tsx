'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PerformanceTrendChart } from '@/components/charts/PerformanceTrendChart'
import { AdSpendVsRevenueChart } from '@/components/charts/AdSpendVsRevenueChart'
import { MarketplaceComparisonChart } from '@/components/charts/MarketplaceComparisonChart'
import { MetaAdsScatterPlot } from '@/components/charts/MetaAdsScatterPlot'
import { ForecastActualChart } from '@/components/charts/ForecastActualChart'
import { BudgetUtilizationBar } from '@/components/charts/BudgetUtilizationBar'
import { ProductScatterPlot } from '@/components/charts/ProductScatterPlot'
import { RoasTrendChart } from '@/components/charts/RoasTrendChart'
import { AlertTriangle, Info, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react'

export default function ReportDetail() {
  const params = useParams()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'OWNER' | 'SPECIALIST'>('OWNER')

  useEffect(() => {
    fetch(`/api/reports/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setReport(data.report)
        setLoading(false)
      })
  }, [params.id])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Report Snapshot...</div>
  if (!report) return <div style={{ padding: '40px', textAlign: 'center' }}>Report not found.</div>

  const data = JSON.parse(report.content)
  const { kpis, trendData, platforms, products, metaCampaigns, forecast, insights, metadata, targets, executiveSummary } = data

  const formatCurrency = (v: number) => `Rp ${(v/1000).toLocaleString()}`
  
  const renderKpi = (title: string, current: number, pct: number, isCurrency = false, isMultiplier = false) => {
    let display = current.toLocaleString()
    if (isCurrency) display = formatCurrency(current)
    if (isMultiplier) display = `${current.toFixed(2)}x`
    if (title === 'Profit Margin') display = `${current.toFixed(1)}%`

    const isPositive = pct >= 0
    let trendColor = isPositive ? 'var(--success)' : 'var(--danger)'
    if (title === 'Ads Spend' && pct > 0) trendColor = 'var(--warning)'
    if (title === 'Ads Spend' && pct <= 0) trendColor = 'var(--success)'
    
    // Handle N/A for Infinity pct
    let trendText = `${Math.abs(pct).toFixed(1)}%`
    if (!isFinite(pct) || isNaN(pct)) trendText = 'N/A'

    return (
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{display}</div>
        <div style={{ fontSize: '0.8rem', color: trendColor, marginTop: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isPositive ? '↑' : '↓'} {trendText} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs prev</span>
        </div>
      </div>
    )
  }

  const getInsightIcon = (severity: string) => {
    if (severity === 'CRITICAL' || severity === 'HIGH') return <AlertTriangle size={20} color="var(--danger)" />
    if (severity === 'OPPORTUNITY' || severity === 'POSITIVE') return <Zap size={20} color="var(--success)" />
    return <Info size={20} color="var(--primary)" />
  }

  return (
    <div className="report-container" style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; }
          .report-container { padding: 0 !important; max-width: 100% !important; }
          .card { border: none !important; box-shadow: none !important; border-radius: 0 !important; break-inside: avoid; }
          .no-print { display: none !important; }
          nav { display: none !important; }
          @page { size: A4 portrait; margin: 1cm; }
        }
      `}} />

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>{metadata.brandName} - {metadata.reportType}</h1>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Period: {new Date(metadata.periodStart).toLocaleDateString()} to {new Date(metadata.periodEnd).toLocaleDateString()}
          </div>
        </div>
        <div className="no-print" style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => setViewMode('OWNER')} 
              style={{ padding: '6px 12px', border: '1px solid var(--primary)', borderRadius: '4px', cursor: 'pointer', background: viewMode === 'OWNER' ? 'var(--primary)' : 'transparent', color: viewMode === 'OWNER' ? 'white' : 'var(--primary)' }}
            >
              Owner View
            </button>
            <button 
              onClick={() => setViewMode('SPECIALIST')} 
              style={{ padding: '6px 12px', border: '1px solid var(--primary)', borderRadius: '4px', cursor: 'pointer', background: viewMode === 'SPECIALIST' ? 'var(--primary)' : 'transparent', color: viewMode === 'SPECIALIST' ? 'white' : 'var(--primary)' }}
            >
              Specialist View
            </button>
            <button className="btn-primary" onClick={() => window.print()}>Export PDF</button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Generated {new Date(metadata.generatedAt).toLocaleString()} (v{metadata.snapshotVersion})
          </div>
        </div>
      </div>

      {/* DATA QUALITY BAR */}
      <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: metadata.status === 'PARTIAL_DATA' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
        {metadata.status === 'PARTIAL_DATA' ? <ShieldAlert color="var(--warning)" size={20} /> : <CheckCircle2 color="var(--success)" size={20} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: metadata.status === 'PARTIAL_DATA' ? 'var(--warning)' : 'var(--success)' }}>
            {metadata.status === 'PARTIAL_DATA' ? 'Partial Data Coverage' : 'Complete Data Coverage'} ({metadata.dataCoverage.toFixed(0)}%)
          </div>
          {metadata.status === 'PARTIAL_DATA' && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Missing sources: {metadata.missingSources.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <div className="card" style={{ marginBottom: '32px', borderLeft: '4px solid var(--primary)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Executive Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>What Happened?</div>
            <p style={{ fontSize: '0.95rem' }}>{executiveSummary.whatHappened}</p>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Why?</div>
            <p style={{ fontSize: '0.95rem' }}>{executiveSummary.why}</p>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>What Needs Attention?</div>
            <p style={{ fontSize: '0.95rem' }}>{executiveSummary.attention}</p>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>What Should We Do?</div>
            <p style={{ fontSize: '0.95rem' }}>{executiveSummary.recommend}</p>
          </div>
        </div>
      </div>

      {/* EXECUTIVE KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {renderKpi('GMV', kpis.gmv.value, kpis.gmv.pct, true)}
        {renderKpi('Net Sales', kpis.netSales.value, kpis.netSales.pct, true)}
        {renderKpi('Ads Spend', kpis.spend.value, kpis.spend.pct, true)}
        {renderKpi('ROAS', kpis.roas.value, kpis.roas.pct, false, true)}
        {renderKpi('Profit', kpis.profit.value, kpis.profit.pct, true)}
        {renderKpi('Profit Margin', kpis.margin.value, kpis.margin.pct)}
      </div>

      {/* PERFORMANCE TREND */}
      <div style={{ height: '400px', marginBottom: '32px' }}>
        <PerformanceTrendChart data={trendData} />
      </div>

      {/* COMPARISONS & DECOUPLING */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ height: '400px' }}><AdSpendVsRevenueChart data={trendData} /></div>
        <div style={{ height: '400px' }}><MarketplaceComparisonChart data={platforms.filter((p: any) => p.gmv > 0)} /></div>
      </div>

      {/* BUDGET & ROAS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <BudgetUtilizationBar allocations={platforms.filter((p: any) => p.spend > 0).map((p: any) => ({ name: p.name, spend: p.spend }))} />
        <div style={{ height: '300px' }}><RoasTrendChart data={trendData} targetRoas={targets.roas} /></div>
      </div>

      {/* SCATTER PLOTS (SPECIALIST VIEW ONLY) */}
      {viewMode === 'SPECIALIST' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div style={{ height: '450px' }}><MetaAdsScatterPlot data={metaCampaigns} /></div>
          <div style={{ height: '450px' }}><ProductScatterPlot data={products} /></div>
        </div>
      )}

      {/* FORECAST & INSIGHTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ height: '400px' }}><ForecastActualChart trendData={trendData} forecast={forecast} /></div>
        
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '24px' }}>Key Insights (Data-Driven)</h3>
          {insights.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No notable anomalies detected during this period.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {insights.map((insight: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
                  <div style={{ paddingTop: '2px' }}>{getInsightIcon(insight.severity)}</div>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>{insight.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{insight.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
    </div>
  )
}
