'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useStore, DateRangeOption } from '../store/useStore'
import { Filter, Calendar, TrendingUp, Store } from 'lucide-react'

export function GlobalFilters() {
  const { 
    dateRangeOption, 
    setDateRangeOption, 
    selectedMarketplace, 
    setSelectedMarketplace,
    selectedAdChannel,
    setSelectedAdChannel,
    selectedBrandId
  } = useStore()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Sync URL to Zustand on mount
  useEffect(() => {
    const pMp = searchParams.get('marketplace')
    const pCh = searchParams.get('channel')
    if (pMp && pMp !== selectedMarketplace) setSelectedMarketplace(pMp)
    if (pCh && pCh !== selectedAdChannel) setSelectedAdChannel(pCh)
  }, [searchParams])

  // Sync Zustand to URL on change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    // Fallback to a seeded brand ID if none selected for MVP testing
    params.set('brandId', selectedBrandId || 'cm0m2xxxx0000000000000000') 
    params.set('marketplace', selectedMarketplace)
    params.set('channel', selectedAdChannel)
    params.set('dateOption', dateRangeOption)
    
    router.push(`${pathname}?${params.toString()}`)
  }, [selectedBrandId, selectedMarketplace, selectedAdChannel, dateRangeOption, pathname, router])

  const dateOptions: { value: DateRangeOption, label: string }[] = [
    { value: 'TODAY', label: 'Today' },
    { value: 'YESTERDAY', label: 'Yesterday' },
    { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
    { value: 'LAST_30_DAYS', label: 'Last 30 Days' },
    { value: 'THIS_MONTH', label: 'This Month' },
    { value: 'LAST_MONTH', label: 'Last Month' },
    { value: 'THIS_QUARTER', label: 'This Quarter' },
    { value: 'THIS_YEAR', label: 'This Year' },
  ]

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      padding: '16px 24px',
      backgroundColor: 'var(--surface)',
      borderBottom: '1px solid var(--surface-border)',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px', color: 'var(--text-secondary)' }}>
        <Filter size={18} />
        <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Global Filters</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Calendar size={16} color="var(--text-muted)" />
        <select 
          value={dateRangeOption}
          onChange={(e) => setDateRangeOption(e.target.value as DateRangeOption)}
          className="select-input"
          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--surface-border)', fontSize: '0.85rem', outline: 'none' }}
        >
          {dateOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--surface-border)' }}></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Store size={16} color="var(--text-muted)" />
        <select 
          value={selectedMarketplace}
          onChange={(e) => setSelectedMarketplace(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--surface-border)', fontSize: '0.85rem', outline: 'none' }}
        >
          <option value="ALL">All Marketplaces</option>
          <option value="Shopee">Shopee</option>
          <option value="TikTok Shop">TikTok Shop</option>
          <option value="Tokopedia">Tokopedia</option>
        </select>
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--surface-border)' }}></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TrendingUp size={16} color="var(--text-muted)" />
        <select 
          value={selectedAdChannel}
          onChange={(e) => setSelectedAdChannel(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--surface-border)', fontSize: '0.85rem', outline: 'none' }}
        >
          <option value="ALL">All Ad Channels</option>
          <option value="Meta Ads">Meta Ads</option>
          <option value="Shopee Ads">Shopee Ads</option>
          <option value="TikTok Ads">TikTok Ads</option>
          <option value="Tokopedia Ads">Tokopedia Ads</option>
        </select>
      </div>
    </div>
  )
}
